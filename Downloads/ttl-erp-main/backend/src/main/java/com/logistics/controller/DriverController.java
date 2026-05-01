package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.Driver;
import com.logistics.repository.DriverRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {
    @Autowired private DriverRepository repo;

    @GetMapping public List<Driver> getAll() { return repo.findAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Driver driver) {
        driver.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(repo.save(driver));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Driver driver) {
        return repo.findById(id).map(e -> {
            driver.setId(id); driver.setCreatedAt(e.getCreatedAt());
            return ResponseEntity.ok(repo.save(driver));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repo.deleteById(id); return ResponseEntity.ok().build();
    }
}
