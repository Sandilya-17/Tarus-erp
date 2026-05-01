package com.logistics.controller;

import com.logistics.model.Invoice;
import com.logistics.repository.InvoiceRepository;
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
@RequestMapping("/api/invoices")
public class InvoiceController {

    @Autowired private InvoiceRepository repo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<Invoice> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status) {
        if (from != null && to != null) return repo.findByIssueDateBetween(from, to);
        if (status != null && !status.isEmpty()) return repo.findByStatus(status);
        return repo.findAll();
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        List<Invoice> all = repo.findAll();
        double totalBilled = all.stream().mapToDouble(i -> i.getTotalAmount() != null ? i.getTotalAmount() : 0).sum();
        double totalPaid = all.stream().filter(i -> "PAID".equals(i.getStatus()))
                .mapToDouble(i -> i.getTotalAmount() != null ? i.getTotalAmount() : 0).sum();
        long unpaidCount = all.stream().filter(i -> "UNPAID".equals(i.getStatus()) || "OVERDUE".equals(i.getStatus())).count();
        Map<String, Object> result = new HashMap<>();
        result.put("totalBilled", totalBilled); result.put("totalPaid", totalPaid);
        result.put("outstanding", totalBilled - totalPaid); result.put("unpaidCount", unpaidCount);
        result.put("totalInvoices", all.size());
        return result;
    }

    @PostMapping
    public ResponseEntity<Invoice> add(@RequestBody Invoice inv, Authentication auth) {
        if (inv.getIssueDate() == null) inv.setIssueDate(LocalDate.now());
        if (inv.getTaxAmount() == null && inv.getSubtotal() != null && inv.getTaxPercent() != null)
            inv.setTaxAmount(inv.getSubtotal() * inv.getTaxPercent() / 100);
        if (inv.getTotalAmount() == null && inv.getSubtotal() != null)
            inv.setTotalAmount((inv.getSubtotal() != null ? inv.getSubtotal() : 0) + (inv.getTaxAmount() != null ? inv.getTaxAmount() : 0));
        if (inv.getStatus() == null) inv.setStatus("UNPAID");
        inv.setCreatedAt(LocalDateTime.now());
        inv.setCreatedBy(auth != null ? auth.getName() : "system");
        Invoice saved = repo.save(inv);
        auditRepo.save(new AuditLog("CREATE", "Invoice", saved.getId(), saved.getInvoiceNumber(), auth != null ? auth.getName() : "system", "", "Created invoice"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Invoice> update(@PathVariable String id, @RequestBody Invoice inv, Authentication auth) {
        return repo.findById(id).map(existing -> {
            inv.setId(id);
            if (inv.getTaxAmount() == null && inv.getSubtotal() != null && inv.getTaxPercent() != null)
                inv.setTaxAmount(inv.getSubtotal() * inv.getTaxPercent() / 100);
            if (inv.getTotalAmount() == null && inv.getSubtotal() != null)
                inv.setTotalAmount((inv.getSubtotal() != null ? inv.getSubtotal() : 0) + (inv.getTaxAmount() != null ? inv.getTaxAmount() : 0));
            Invoice saved = repo.save(inv);
            auditRepo.save(new AuditLog("UPDATE", "Invoice", id, inv.getInvoiceNumber(), auth != null ? auth.getName() : "system", "", "Updated invoice"));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        return repo.findById(id).map(inv -> {
            repo.deleteById(id);
            auditRepo.save(new AuditLog("DELETE", "Invoice", id, inv.getInvoiceNumber(), auth != null ? auth.getName() : "system", "", "Deleted invoice"));
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
