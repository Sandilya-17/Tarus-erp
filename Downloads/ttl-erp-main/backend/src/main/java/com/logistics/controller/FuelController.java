package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.FuelEntry;
import com.logistics.model.Truck;
import com.logistics.repository.FuelEntryRepository;
import com.logistics.repository.TruckRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fuel")
public class FuelController {
    @Autowired private FuelEntryRepository repo;
    @Autowired private TruckRepository truckRepo;

    @GetMapping
    public List<FuelEntry> getAll() { return repo.findAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody FuelEntry entry) {
        if (entry.getQuantity() != null && entry.getPricePerLitre() != null)
            entry.setTotalAmount(entry.getQuantity() * entry.getPricePerLitre());
        // Extract month/year from date string
        if (entry.getDate() != null && entry.getDate().length() >= 7) {
            try {
                String[] parts = entry.getDate().split("-");
                entry.setYear(Integer.parseInt(parts[0]));
                entry.setMonth(Integer.parseInt(parts[1]));
            } catch (Exception ignored) {}
        }
        entry.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(repo.save(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody FuelEntry entry) {
        return repo.findById(id).map(e -> {
            entry.setId(id); entry.setCreatedAt(e.getCreatedAt());
            if (entry.getQuantity() != null && entry.getPricePerLitre() != null)
                entry.setTotalAmount(entry.getQuantity() * entry.getPricePerLitre());
            if (entry.getDate() != null && entry.getDate().length() >= 7) {
                try { String[] p = entry.getDate().split("-"); entry.setYear(Integer.parseInt(p[0])); entry.setMonth(Integer.parseInt(p[1])); } catch (Exception ignored) {}
            }
            return ResponseEntity.ok(repo.save(entry));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        repo.deleteById(id); return ResponseEntity.ok().build();
    }

    @GetMapping("/truck/{truckNumber}")
    public List<FuelEntry> byTruck(@PathVariable String truckNumber) {
        return repo.findByTruckNumber(truckNumber);
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> monthlyExcessReport(@RequestParam int month, @RequestParam int year) {
        List<FuelEntry> entries = repo.findByMonthAndYear(month, year);
        // Group by truck
        Map<String, Double> consumed = new HashMap<>();
        entries.forEach(e -> consumed.merge(e.getTruckNumber(), e.getQuantity() != null ? e.getQuantity() : 0.0, Double::sum));

        List<Map<String, Object>> report = new ArrayList<>();
        // All active trucks
        truckRepo.findByActiveTrue().forEach(truck -> {
            double use = consumed.getOrDefault(truck.getTruckNumber(), 0.0);
            double limit = truck.getFuelLimit() != null ? truck.getFuelLimit() : 0;
            double excess = use - limit;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("truckNumber", truck.getTruckNumber());
            row.put("fuelLimit", limit);
            row.put("consumed", use);
            row.put("excess", excess > 0 ? excess : 0);
            row.put("status", excess > 0 ? "EXCESS" : "OK");
            report.add(row);
        });
        // Add trucks with entries but not in fleet
        consumed.forEach((truckNum, use) -> {
            boolean exists = report.stream().anyMatch(r -> r.get("truckNumber").equals(truckNum));
            if (!exists) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("truckNumber", truckNum);
                row.put("fuelLimit", 0); row.put("consumed", use); row.put("excess", use); row.put("status", "EXCESS");
                report.add(row);
            }
        });
        return ResponseEntity.ok(report);
    }
}
