package com.logistics.controller;

import com.logistics.model.Expenditure;
import com.logistics.repository.ExpenditureRepository;
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
@RequestMapping("/api/expenditures")
public class ExpenditureController {

    @Autowired private ExpenditureRepository repo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<Expenditure> getAll(
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
        List<Expenditure> list = (from != null && to != null) ? repo.findByDateBetween(from, to) : repo.findAll();
        Map<String, Double> byCategory = new HashMap<>();
        double total = 0;
        for (Expenditure e : list) {
            double amt = e.getAmount() != null ? e.getAmount() : 0;
            total += amt;
            byCategory.merge(e.getCategory() != null ? e.getCategory() : "OTHER", amt, Double::sum);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("byCategory", byCategory);
        result.put("count", list.size());
        return result;
    }

    @PostMapping
    public ResponseEntity<Expenditure> add(@RequestBody Expenditure exp, Authentication auth) {
        if (exp.getDate() == null) exp.setDate(LocalDate.now());
        exp.setCreatedAt(LocalDateTime.now());
        exp.setCreatedBy(auth != null ? auth.getName() : "system");
        Expenditure saved = repo.save(exp);
        auditRepo.save(new AuditLog("CREATE", "Expenditure", saved.getId(),
                saved.getCategory() + ": " + saved.getDescription(), auth != null ? auth.getName() : "system", "", "Created expenditure"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expenditure> update(@PathVariable String id, @RequestBody Expenditure exp, Authentication auth) {
        return repo.findById(id).map(existing -> {
            exp.setId(id);
            Expenditure saved = repo.save(exp);
            auditRepo.save(new AuditLog("UPDATE", "Expenditure", id,
                    exp.getCategory(), auth != null ? auth.getName() : "system", "", "Updated expenditure"));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        return repo.findById(id).map(exp -> {
            repo.deleteById(id);
            auditRepo.save(new AuditLog("DELETE", "Expenditure", id,
                    exp.getCategory(), auth != null ? auth.getName() : "system", "", "Deleted expenditure"));
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody List<Expenditure> items, Authentication auth) {
        int count = 0;
        for (Expenditure e : items) {
            if (e.getAmount() == null) continue;
            if (e.getDate() == null) e.setDate(LocalDate.now());
            e.setCreatedAt(LocalDateTime.now());
            e.setCreatedBy(auth != null ? auth.getName() : "import");
            repo.save(e);
            count++;
        }
        auditRepo.save(new AuditLog("IMPORT", "Expenditure", null, count + " records",
                auth != null ? auth.getName() : "system", "", "Bulk imported " + count + " expenditure records"));
        return ResponseEntity.ok(Map.of("imported", count, "total", items.size()));
    }
}
