package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.*;
import com.logistics.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tyres")
public class TyreController {
    @Autowired private TyreRepository tyreRepo;
    @Autowired private TyreIssueRepository issueRepo;

    @GetMapping public List<Tyre> getAll() { return tyreRepo.findAll(); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Tyre tyre) {
        tyre.setPurchased(0);
        tyre.setIssued(0);
        int opening = tyre.getOpeningStock() != null ? tyre.getOpeningStock() : 0;
        tyre.setOpeningStock(opening);
        tyre.setCurrentStock(opening);
        tyre.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(tyreRepo.save(tyre));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Tyre tyre) {
        return tyreRepo.findById(id).map(e -> {
            tyre.setId(id); tyre.setCreatedAt(e.getCreatedAt());
            tyre.setPurchased(e.getPurchased()); tyre.setIssued(e.getIssued());
            int opening = tyre.getOpeningStock() != null ? tyre.getOpeningStock() : 0;
            tyre.setCurrentStock(opening + (e.getPurchased() != null ? e.getPurchased() : 0) - (e.getIssued() != null ? e.getIssued() : 0));
            return ResponseEntity.ok(tyreRepo.save(tyre));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        tyreRepo.deleteById(id); return ResponseEntity.ok().build();
    }

    @GetMapping("/stock-report")
    public List<Tyre> getLowStock() {
        return tyreRepo.findAll().stream()
            .filter(t -> t.getCurrentStock() != null && t.getReorderLevel() != null
                && t.getCurrentStock() <= t.getReorderLevel())
            .collect(Collectors.toList());
    }

    @PostMapping("/purchases")
    public ResponseEntity<?> purchase(@RequestBody Map<String, Object> body) {
        String tyreId = (String) body.get("tyreId");
        int qty = Integer.parseInt(body.get("quantity").toString());
        return tyreRepo.findById(tyreId).map(tyre -> {
            int purchased = tyre.getPurchased() != null ? tyre.getPurchased() : 0;
            tyre.setPurchased(purchased + qty);
            tyre.setCurrentStock((tyre.getOpeningStock() != null ? tyre.getOpeningStock() : 0) + tyre.getPurchased() - (tyre.getIssued() != null ? tyre.getIssued() : 0));
            tyreRepo.save(tyre);
            return ResponseEntity.ok(Map.of("message", "Stock updated", "currentStock", tyre.getCurrentStock()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/issues") public List<TyreIssue> getIssues() { return issueRepo.findAll(); }

    @GetMapping("/issues/truck/{truckNumber}")
    public List<TyreIssue> getIssuesByTruck(@PathVariable String truckNumber) {
        return issueRepo.findByTruckNumber(truckNumber);
    }

    @PostMapping("/issues")
    public ResponseEntity<?> issue(@RequestBody TyreIssue issue) {
        return tyreRepo.findById(issue.getTyreId()).map(tyre -> {
            int current = tyre.getCurrentStock() != null ? tyre.getCurrentStock() : 0;
            if (current < issue.getQuantity())
                return ResponseEntity.badRequest().body("Insufficient tyre stock. Available: " + current);
            issue.setTyreName(tyre.getTyreName());
            issue.setIssuedDate(LocalDateTime.now().toLocalDate().toString());
            issueRepo.save(issue);
            int issued = tyre.getIssued() != null ? tyre.getIssued() : 0;
            tyre.setIssued(issued + issue.getQuantity());
            tyre.setCurrentStock(current - issue.getQuantity());
            tyreRepo.save(tyre);
            return ResponseEntity.ok(issue);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/issues/{id}")
    public ResponseEntity<?> updateIssue(@PathVariable String id, @RequestBody TyreIssue updated) {
        return issueRepo.findById(id).map(existing -> {
            return tyreRepo.findById(existing.getTyreId()).map(tyre -> {
                int oldQty = existing.getQuantity() != null ? existing.getQuantity() : 0;
                int newQty = updated.getQuantity() != null ? updated.getQuantity() : 0;
                int currentStock = tyre.getCurrentStock() != null ? tyre.getCurrentStock() : 0;
                int availableAfterReverse = currentStock + oldQty;
                if (availableAfterReverse < newQty)
                    return ResponseEntity.badRequest().body("Insufficient stock. Available after reversal: " + availableAfterReverse);
                existing.setTruckNumber(updated.getTruckNumber());
                existing.setQuantity(newQty);
                existing.setPosition(updated.getPosition());
                existing.setLocation(updated.getLocation());
                existing.setIssuedBy(updated.getIssuedBy());
                existing.setIssuedDate(updated.getIssuedDate() != null ? updated.getIssuedDate() : existing.getIssuedDate());
                existing.setRemarks(updated.getRemarks());
                issueRepo.save(existing);
                int issuedTotal = tyre.getIssued() != null ? tyre.getIssued() : 0;
                tyre.setIssued(issuedTotal - oldQty + newQty);
                tyre.setCurrentStock(availableAfterReverse - newQty);
                tyreRepo.save(tyre);
                return ResponseEntity.ok(existing);
            }).orElse(ResponseEntity.notFound().build());
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/issues/{id}")
    public ResponseEntity<?> deleteIssue(@PathVariable String id) {
        return issueRepo.findById(id).map(issue -> {
            tyreRepo.findById(issue.getTyreId()).ifPresent(tyre -> {
                int qty = issue.getQuantity() != null ? issue.getQuantity() : 0;
                int issued = tyre.getIssued() != null ? tyre.getIssued() : 0;
                int current = tyre.getCurrentStock() != null ? tyre.getCurrentStock() : 0;
                tyre.setIssued(Math.max(0, issued - qty));
                tyre.setCurrentStock(current + qty);
                tyreRepo.save(tyre);
            });
            issueRepo.deleteById(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
