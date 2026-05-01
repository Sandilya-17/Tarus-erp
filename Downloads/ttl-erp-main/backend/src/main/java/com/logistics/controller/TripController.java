package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.Trip;
import com.logistics.repository.TripRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class TripController {
    @Autowired private TripRepository repo;

    @GetMapping public List<Trip> getAll() { return repo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getById(@PathVariable String id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Trip trip) {
        if (trip.getLrNumber() != null && repo.existsByLrNumber(trip.getLrNumber()))
            return ResponseEntity.badRequest().body("LR Number already exists: " + trip.getLrNumber());
        // Compute balance
        if (trip.getFreight() != null && trip.getAdvance() != null)
            trip.setBalance(trip.getFreight() - trip.getAdvance());
        trip.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(repo.save(trip));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Trip trip) {
        return repo.findById(id).map(e -> {
            trip.setId(id); trip.setCreatedAt(e.getCreatedAt());
            if (trip.getFreight() != null && trip.getAdvance() != null)
                trip.setBalance(trip.getFreight() - trip.getAdvance());
            return ResponseEntity.ok(repo.save(trip));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repo.deleteById(id); return ResponseEntity.ok().build();
    }

    @GetMapping("/truck/{truckNumber}")
    public List<Trip> byTruck(@PathVariable String truckNumber) {
        return repo.findByTruckNumber(truckNumber);
    }
}
