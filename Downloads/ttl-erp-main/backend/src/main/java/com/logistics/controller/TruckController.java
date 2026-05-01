package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.Truck;
import com.logistics.repository.TruckRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/trucks")
public class TruckController {
    @Autowired private TruckRepository repo;

    @GetMapping
    public List<Truck> getAll() { return repo.findAll(); }

    @GetMapping("/numbers")
    public List<String> getNumbers() {
        return repo.findByActiveTrue().stream().map(Truck::getTruckNumber).sorted().collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Truck> getById(@PathVariable String id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Truck truck) {
        if (repo.existsByTruckNumber(truck.getTruckNumber()))
            return ResponseEntity.badRequest().body("Truck number already exists: " + truck.getTruckNumber());
        truck.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(repo.save(truck));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Truck truck) {
        return repo.findById(id).map(existing -> {
            truck.setId(id);
            truck.setCreatedAt(existing.getCreatedAt());
            return ResponseEntity.ok(repo.save(truck));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repo.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
