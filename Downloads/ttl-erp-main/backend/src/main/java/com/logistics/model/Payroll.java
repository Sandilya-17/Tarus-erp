package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "payroll")
public class Payroll {
    @Id private String id;
    private String employeeId;
    private String employeeName;
    private String designation;
    private String department;
    private Integer month;
    private Integer year;
    private Double basicSalary;
    private Double houseAllowance;
    private Double transportAllowance;
    private Double otherAllowances;
    private Double grossSalary;
    private Double taxDeduction;
    private Double otherDeductions;
    private Double netPay;
    private String status;   // PENDING, PAID, CANCELLED
    private LocalDate paidDate;
    private String paymentMode;
    private String processedBy;
    private String remarks;
    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Double getBasicSalary() { return basicSalary; }
    public void setBasicSalary(Double basicSalary) { this.basicSalary = basicSalary; }
    public Double getHouseAllowance() { return houseAllowance; }
    public void setHouseAllowance(Double houseAllowance) { this.houseAllowance = houseAllowance; }
    public Double getTransportAllowance() { return transportAllowance; }
    public void setTransportAllowance(Double transportAllowance) { this.transportAllowance = transportAllowance; }
    public Double getOtherAllowances() { return otherAllowances; }
    public void setOtherAllowances(Double otherAllowances) { this.otherAllowances = otherAllowances; }
    public Double getGrossSalary() { return grossSalary; }
    public void setGrossSalary(Double grossSalary) { this.grossSalary = grossSalary; }
    public Double getTaxDeduction() { return taxDeduction; }
    public void setTaxDeduction(Double taxDeduction) { this.taxDeduction = taxDeduction; }
    public Double getOtherDeductions() { return otherDeductions; }
    public void setOtherDeductions(Double otherDeductions) { this.otherDeductions = otherDeductions; }
    public Double getNetPay() { return netPay; }
    public void setNetPay(Double netPay) { this.netPay = netPay; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getProcessedBy() { return processedBy; }
    public void setProcessedBy(String processedBy) { this.processedBy = processedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
