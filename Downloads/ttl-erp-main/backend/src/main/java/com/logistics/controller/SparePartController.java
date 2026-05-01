package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.*;
import com.logistics.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/spare-parts")
public class SparePartController {
    @Autowired private SparePartRepository partRepo;
    @Autowired private SparePartIssueRepository issueRepo;
    @Autowired private SparePartPurchaseRepository purchaseRepo;

    @GetMapping
    public List<SparePart> getAll() { return partRepo.findAll(); }

    @GetMapping("/stock-report")
    public List<SparePart> getLowStock() {
        return partRepo.findAll().stream()
            .filter(p -> p.getCurrentStock() != null && p.getReorderLevel() != null
                && p.getCurrentStock() <= p.getReorderLevel())
            .collect(Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody SparePart part) {
        part.setPurchasedStock(0);
        part.setIssuedStock(0);
        int opening = part.getOpeningStock() != null ? part.getOpeningStock() : 0;
        part.setOpeningStock(opening);
        part.setCurrentStock(opening);
        part.setCreatedAt(LocalDateTime.now().toString());
        return ResponseEntity.ok(partRepo.save(part));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody SparePart part) {
        return partRepo.findById(id).map(e -> {
            part.setId(id);
            part.setCreatedAt(e.getCreatedAt());
            part.setPurchasedStock(e.getPurchasedStock());
            part.setIssuedStock(e.getIssuedStock());
            int opening = part.getOpeningStock() != null ? part.getOpeningStock() : 0;
            part.setCurrentStock(opening
                + (e.getPurchasedStock() != null ? e.getPurchasedStock() : 0)
                - (e.getIssuedStock() != null ? e.getIssuedStock() : 0));
            return ResponseEntity.ok(partRepo.save(part));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        partRepo.deleteById(id); return ResponseEntity.ok().build();
    }

    // ── Purchases ─────────────────────────────────────────
    @GetMapping("/purchases")
    public List<SparePartPurchase> getPurchases() { return purchaseRepo.findAll(); }

    @PostMapping("/purchases")
    public ResponseEntity<?> purchase(@RequestBody SparePartPurchase purchase) {
        return partRepo.findById(purchase.getPartId()).map(part -> {
            purchase.setPartName(part.getPartName());
            purchase.setPurchaseDate(LocalDateTime.now().toLocalDate().toString());
            if (purchase.getPricePerUnit() != null && purchase.getQuantity() != null)
                purchase.setTotalAmount(purchase.getPricePerUnit() * purchase.getQuantity());
            purchaseRepo.save(purchase);
            int current = part.getPurchasedStock() != null ? part.getPurchasedStock() : 0;
            part.setPurchasedStock(current + purchase.getQuantity());
            part.setCurrentStock((part.getOpeningStock() != null ? part.getOpeningStock() : 0)
                + part.getPurchasedStock()
                - (part.getIssuedStock() != null ? part.getIssuedStock() : 0));
            partRepo.save(part);
            return ResponseEntity.ok(purchase);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/purchases/{id}")
    public ResponseEntity<?> updatePurchase(@PathVariable String id, @RequestBody SparePartPurchase purchase) {
        java.util.Optional<SparePartPurchase> oldOpt = purchaseRepo.findById(id);
        if (!oldOpt.isPresent()) return ResponseEntity.notFound().build();
        SparePartPurchase old = oldOpt.get();

        java.util.Optional<SparePart> partOpt = partRepo.findById(old.getPartId());
        if (!partOpt.isPresent()) return ResponseEntity.notFound().build();
        SparePart part = partOpt.get();

        int oldQty = old.getQuantity() != null ? old.getQuantity() : 0;
        int newQty = purchase.getQuantity() != null ? purchase.getQuantity() : 0;
        int diff = newQty - oldQty;
        int purchased = part.getPurchasedStock() != null ? part.getPurchasedStock() : 0;
        part.setPurchasedStock(purchased + diff);
        part.setCurrentStock(
            (part.getOpeningStock() != null ? part.getOpeningStock() : 0)
            + part.getPurchasedStock()
            - (part.getIssuedStock() != null ? part.getIssuedStock() : 0));
        partRepo.save(part);

        purchase.setId(id);
        purchase.setPartId(old.getPartId());
        purchase.setPartName(part.getPartName());
        purchase.setPurchaseDate(old.getPurchaseDate());
        if (purchase.getPricePerUnit() != null && purchase.getQuantity() != null)
            purchase.setTotalAmount(purchase.getPricePerUnit() * purchase.getQuantity());
        return ResponseEntity.ok(purchaseRepo.save(purchase));
    }

    @DeleteMapping("/purchases/{id}")
    public ResponseEntity<?> deletePurchase(@PathVariable String id) {
        java.util.Optional<SparePartPurchase> purchaseOpt = purchaseRepo.findById(id);
        if (!purchaseOpt.isPresent()) return ResponseEntity.notFound().build();
        SparePartPurchase purchase = purchaseOpt.get();

        java.util.Optional<SparePart> partOpt = partRepo.findById(purchase.getPartId());
        if (partOpt.isPresent()) {
            SparePart part = partOpt.get();
            int qty = purchase.getQuantity() != null ? purchase.getQuantity() : 0;
            int purchased = part.getPurchasedStock() != null ? part.getPurchasedStock() : 0;
            part.setPurchasedStock(Math.max(0, purchased - qty));
            part.setCurrentStock(
                (part.getOpeningStock() != null ? part.getOpeningStock() : 0)
                + part.getPurchasedStock()
                - (part.getIssuedStock() != null ? part.getIssuedStock() : 0));
            partRepo.save(part);
        }
        purchaseRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ── Issues ────────────────────────────────────────────
    @GetMapping("/issues")
    public List<SparePartIssue> getIssues() { return issueRepo.findAll(); }

    @GetMapping("/issues/truck/{truckNumber}")
    public List<SparePartIssue> getIssuesByTruck(@PathVariable String truckNumber) {
        return issueRepo.findByTruckNumber(truckNumber);
    }

    @PostMapping("/issues")
    public ResponseEntity<?> issue(@RequestBody SparePartIssue issue) {
        return partRepo.findById(issue.getPartId()).map(part -> {
            int current = part.getCurrentStock() != null ? part.getCurrentStock() : 0;
            if (current < issue.getQuantity())
                return ResponseEntity.badRequest().body("Insufficient stock. Available: " + current);
            issue.setPartName(part.getPartName());
            issue.setPartCode(part.getPartCode());
            if (part.getUnitPrice() != null)
                issue.setTotalValue(part.getUnitPrice() * issue.getQuantity());
            issue.setIssuedAt(LocalDateTime.now().toString());
            issueRepo.save(issue);
            int issued = part.getIssuedStock() != null ? part.getIssuedStock() : 0;
            part.setIssuedStock(issued + issue.getQuantity());
            part.setCurrentStock(current - issue.getQuantity());
            partRepo.save(part);
            return ResponseEntity.ok(issue);
        }).orElse(ResponseEntity.notFound().build());
    }
}
