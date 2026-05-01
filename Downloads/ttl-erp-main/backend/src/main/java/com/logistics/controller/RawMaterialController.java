package com.logistics.controller;

import com.logistics.model.RawMaterial;
import com.logistics.repository.RawMaterialRepository;
import com.logistics.model.AuditLog;
import com.logistics.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/raw-materials")
public class RawMaterialController {

    @Autowired private RawMaterialRepository repo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<RawMaterial> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        if (from != null && to != null) return repo.findByEntryDateBetween(from, to);
        if (category != null && !category.isEmpty()) return repo.findByCategory(category);
        if (status != null && !status.isEmpty()) return repo.findByStatus(status);
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<RawMaterial> add(@RequestBody RawMaterial rm, Authentication auth) {
        if (rm.getTotalCost() == null && rm.getQuantity() != null && rm.getRatePerUnit() != null) {
            rm.setTotalCost(rm.getQuantity() * rm.getRatePerUnit());
        }
        if (rm.getEntryDate() == null) rm.setEntryDate(LocalDate.now());
        rm.setCreatedAt(LocalDateTime.now());
        rm.setCreatedBy(auth != null ? auth.getName() : "system");
        RawMaterial saved = repo.save(rm);
        auditRepo.save(new AuditLog("CREATE", "RawMaterial", saved.getId(),
                saved.getMaterialName(), auth != null ? auth.getName() : "system", "", "Created raw material entry"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RawMaterial> update(@PathVariable String id, @RequestBody RawMaterial rm, Authentication auth) {
        return repo.findById(id).map(existing -> {
            rm.setId(id);
            if (rm.getTotalCost() == null && rm.getQuantity() != null && rm.getRatePerUnit() != null) {
                rm.setTotalCost(rm.getQuantity() * rm.getRatePerUnit());
            }
            RawMaterial saved = repo.save(rm);
            auditRepo.save(new AuditLog("UPDATE", "RawMaterial", id,
                    rm.getMaterialName(), auth != null ? auth.getName() : "system", "", "Updated raw material"));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        return repo.findById(id).map(rm -> {
            repo.deleteById(id);
            auditRepo.save(new AuditLog("DELETE", "RawMaterial", id,
                    rm.getMaterialName(), auth != null ? auth.getName() : "system", "", "Deleted raw material"));
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody List<RawMaterial> items, Authentication auth) {
        int count = 0;
        for (RawMaterial rm : items) {
            if (rm.getMaterialName() == null || rm.getMaterialName().isBlank()) continue;
            if (rm.getEntryDate() == null) rm.setEntryDate(LocalDate.now());
            rm.setCreatedAt(LocalDateTime.now());
            rm.setCreatedBy(auth != null ? auth.getName() : "import");
            if (rm.getTotalCost() == null && rm.getQuantity() != null && rm.getRatePerUnit() != null) {
                rm.setTotalCost(rm.getQuantity() * rm.getRatePerUnit());
            }
            repo.save(rm);
            count++;
        }
        auditRepo.save(new AuditLog("IMPORT", "RawMaterial", null, count + " records",
                auth != null ? auth.getName() : "system", "", "Bulk imported " + count + " raw material records"));
        return ResponseEntity.ok(Map.of("imported", count, "total", items.size()));
    }
}
