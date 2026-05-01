package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.MaintenanceRecord;
import com.logistics.repository.MaintenanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {
    @Autowired private MaintenanceRepository repo;

    @GetMapping public List<MaintenanceRecord> getAll() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceRecord> getById(@PathVariable String id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody MaintenanceRecord record) {
        record.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(repo.save(record));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody MaintenanceRecord record) {
        return repo.findById(id).map(e -> {
            record.setId(id); record.setCreatedAt(e.getCreatedAt());
            return ResponseEntity.ok(repo.save(record));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repo.deleteById(id); return ResponseEntity.ok().build();
    }

    @GetMapping("/truck/{truckNumber}")
    public List<MaintenanceRecord> byTruck(@PathVariable String truckNumber) {
        return repo.findByTruckNumber(truckNumber);
    }
}
