package com.logistics.controller;

import com.logistics.model.Payroll;
import com.logistics.repository.PayrollRepository;
import com.logistics.model.AuditLog;
import com.logistics.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    @Autowired private PayrollRepository repo;
    @Autowired private AuditLogRepository auditRepo;

    @GetMapping
    public List<Payroll> getAll(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        if (month != null && year != null) return repo.findByMonthAndYear(month, year);
        if (year != null) return repo.findByYear(year);
        return repo.findAll();
    }

    @GetMapping("/summary")
    public Map<String, Object> getSummary(@RequestParam(required = false) Integer month, @RequestParam(required = false) Integer year) {
        List<Payroll> list = (month != null && year != null) ? repo.findByMonthAndYear(month, year) : repo.findAll();
        double totalGross = list.stream().mapToDouble(p -> p.getGrossSalary() != null ? p.getGrossSalary() : 0).sum();
        double totalNet = list.stream().mapToDouble(p -> p.getNetPay() != null ? p.getNetPay() : 0).sum();
        double totalDeductions = list.stream().mapToDouble(p -> (p.getTaxDeduction() != null ? p.getTaxDeduction() : 0) + (p.getOtherDeductions() != null ? p.getOtherDeductions() : 0)).sum();
        long paidCount = list.stream().filter(p -> "PAID".equals(p.getStatus())).count();
        Map<String, Object> result = new HashMap<>();
        result.put("totalGross", totalGross); result.put("totalNet", totalNet);
        result.put("totalDeductions", totalDeductions); result.put("paidCount", paidCount);
        result.put("totalEmployees", list.size());
        return result;
    }

    @PostMapping
    public ResponseEntity<Payroll> add(@RequestBody Payroll p, Authentication auth) {
        double basic = p.getBasicSalary() != null ? p.getBasicSalary() : 0;
        double allowances = (p.getHouseAllowance() != null ? p.getHouseAllowance() : 0)
                + (p.getTransportAllowance() != null ? p.getTransportAllowance() : 0)
                + (p.getOtherAllowances() != null ? p.getOtherAllowances() : 0);
        double gross = basic + allowances;
        double deductions = (p.getTaxDeduction() != null ? p.getTaxDeduction() : 0) + (p.getOtherDeductions() != null ? p.getOtherDeductions() : 0);
        p.setGrossSalary(gross);
        p.setNetPay(gross - deductions);
        if (p.getStatus() == null) p.setStatus("PENDING");
        p.setCreatedAt(LocalDateTime.now());
        p.setProcessedBy(auth != null ? auth.getName() : "system");
        Payroll saved = repo.save(p);
        auditRepo.save(new AuditLog("CREATE", "Payroll", saved.getId(), saved.getEmployeeName(), auth != null ? auth.getName() : "system", "", "Created payroll record"));
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Payroll> update(@PathVariable String id, @RequestBody Payroll p, Authentication auth) {
        return repo.findById(id).map(existing -> {
            p.setId(id);
            double basic = p.getBasicSalary() != null ? p.getBasicSalary() : 0;
            double allowances = (p.getHouseAllowance() != null ? p.getHouseAllowance() : 0)
                    + (p.getTransportAllowance() != null ? p.getTransportAllowance() : 0)
                    + (p.getOtherAllowances() != null ? p.getOtherAllowances() : 0);
            double gross = basic + allowances;
            double deductions = (p.getTaxDeduction() != null ? p.getTaxDeduction() : 0) + (p.getOtherDeductions() != null ? p.getOtherDeductions() : 0);
            p.setGrossSalary(gross);
            p.setNetPay(gross - deductions);
            Payroll saved = repo.save(p);
            auditRepo.save(new AuditLog("UPDATE", "Payroll", id, p.getEmployeeName(), auth != null ? auth.getName() : "system", "", "Updated payroll"));
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        return repo.findById(id).map(p -> {
            repo.deleteById(id);
            auditRepo.save(new AuditLog("DELETE", "Payroll", id, p.getEmployeeName(), auth != null ? auth.getName() : "system", "", "Deleted payroll record"));
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
