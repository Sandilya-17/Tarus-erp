package com.logistics.controller;

import com.logistics.model.Vendor;
import com.logistics.repository.VendorRepository;
import com.logistics.model.AuditLog;
import com.logistics.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendors")
public class VendorController {

    @Autowired private VendorRepository repo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<Vendor> getAll(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) return repo.findByCategory(category);
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<Vendor> add(@RequestBody Vendor vendor, Authentication auth) {
        vendor.setCreatedAt(LocalDateTime.now());
        vendor.setActive(true);
        Vendor saved = repo.save(vendor);
        auditRepo.save(new AuditLog("CREATE", "Vendor", saved.getId(),
                saved.getName(), auth != null ? auth.getName() : "system", "", "Created vendor"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vendor> update(@PathVariable String id, @RequestBody Vendor vendor, Authentication auth) {
        return repo.findById(id).map(existing -> {
            vendor.setId(id);
            Vendor saved = repo.save(vendor);
            auditRepo.save(new AuditLog("UPDATE", "Vendor", id,
                    vendor.getName(), auth != null ? auth.getName() : "system", "", "Updated vendor"));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        return repo.findById(id).map(vendor -> {
            vendor.setActive(false);
            repo.save(vendor);
            auditRepo.save(new AuditLog("DELETE", "Vendor", id,
                    vendor.getName(), auth != null ? auth.getName() : "system", "", "Deactivated vendor"));
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody List<Vendor> items, Authentication auth) {
        int count = 0;
        for (Vendor v : items) {
            if (v.getName() == null || v.getName().isBlank()) continue;
            v.setCreatedAt(LocalDateTime.now());
            v.setActive(true);
            repo.save(v);
            count++;
        }
        return ResponseEntity.ok(Map.of("imported", count, "total", items.size()));
    }
}
