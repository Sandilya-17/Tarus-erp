package com.logistics.controller;

import com.logistics.model.Revenue;
import com.logistics.repository.RevenueRepository;
import com.logistics.model.AuditLog;
import com.logistics.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/revenues")
public class RevenueController {

    @Autowired private RevenueRepository repo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<Revenue> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String category) {
        if (from != null && to != null) return repo.findByDateBetween(from, to);
        if (category != null && !category.isEmpty()) return repo.findByCategory(category);
        return repo.findAll();
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<Revenue> list = (from != null && to != null) ? repo.findByDateBetween(from, to) : repo.findAll();
        Map<String, Double> byCategory = new HashMap<>();
        double total = 0;
        for (Revenue r : list) {
            double amt = r.getAmount() != null ? r.getAmount() : 0;
            total += amt;
            byCategory.merge(r.getCategory() != null ? r.getCategory() : "OTHER", amt, Double::sum);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("byCategory", byCategory);
        result.put("count", list.size());
        return result;
    }

    @PostMapping
    public ResponseEntity<Revenue> add(@RequestBody Revenue rev, Authentication auth) {
        if (rev.getDate() == null) rev.setDate(LocalDate.now());
        rev.setCreatedAt(LocalDateTime.now());
        rev.setCreatedBy(auth != null ? auth.getName() : "system");
        Revenue saved = repo.save(rev);
        auditRepo.save(new AuditLog("CREATE", "Revenue", saved.getId(),
                saved.getCategory() + ": " + saved.getDescription(), auth != null ? auth.getName() : "system", "", "Created revenue entry"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Revenue> update(@PathVariable String id, @RequestBody Revenue rev, Authentication auth) {
        return repo.findById(id).map(existing -> {
            rev.setId(id);
            Revenue saved = repo.save(rev);
            auditRepo.save(new AuditLog("UPDATE", "Revenue", id,
                    rev.getCategory(), auth != null ? auth.getName() : "system", "", "Updated revenue"));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        return repo.findById(id).map(rev -> {
            repo.deleteById(id);
            auditRepo.save(new AuditLog("DELETE", "Revenue", id,
                    rev.getCategory(), auth != null ? auth.getName() : "system", "", "Deleted revenue"));
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody List<Revenue> items, Authentication auth) {
        int count = 0;
        for (Revenue r : items) {
            if (r.getAmount() == null) continue;
            if (r.getDate() == null) r.setDate(LocalDate.now());
            r.setCreatedAt(LocalDateTime.now());
            r.setCreatedBy(auth != null ? auth.getName() : "import");
            repo.save(r);
            count++;
        }
        auditRepo.save(new AuditLog("IMPORT", "Revenue", null, count + " records",
                auth != null ? auth.getName() : "system", "", "Bulk imported " + count + " revenue records"));
        return ResponseEntity.ok(Map.of("imported", count, "total", items.size()));
    }
}
