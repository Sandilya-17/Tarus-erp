package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "spare_part_issues")
public class SparePartIssue {
    @Id private String id;
    private String partId;
    private String partName;
    private String partCode;
    private String truckNumber;
    private Integer quantity;
    private Double totalValue;
    private String jobCardNumber;
    private String mechanicName;
    private String location;
    private String issuedBy;
    private String issuedAt;
    private String remarks;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPartId() { return partId; }
    public void setPartId(String partId) { this.partId = partId; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getPartCode() { return partCode; }
    public void setPartCode(String partCode) { this.partCode = partCode; }
    public String getTruckNumber() { return truckNumber; }
    public void setTruckNumber(String truckNumber) { this.truckNumber = truckNumber; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getTotalValue() { return totalValue; }
    public void setTotalValue(Double totalValue) { this.totalValue = totalValue; }
    public String getJobCardNumber() { return jobCardNumber; }
    public void setJobCardNumber(String jobCardNumber) { this.jobCardNumber = jobCardNumber; }
    public String getMechanicName() { return mechanicName; }
    public void setMechanicName(String mechanicName) { this.mechanicName = mechanicName; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getIssuedBy() { return issuedBy; }
    public void setIssuedBy(String issuedBy) { this.issuedBy = issuedBy; }
    public String getIssuedAt() { return issuedAt; }
    public void setIssuedAt(String issuedAt) { this.issuedAt = issuedAt; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
