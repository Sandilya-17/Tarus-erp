package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "maintenance_records")
public class MaintenanceRecord {
    @Id private String id;
    private String truckNumber;
    private String serviceType;
    private String description;
    private String serviceDate;
    private Double odometerAtService;
    private Double cost;
    private String vendor;
    private String invoiceNumber;
    private String nextServiceDate;
    private Double nextServiceOdometer;
    private String status;
    private String performedBy;
    private String remarks;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTruckNumber() { return truckNumber; }
    public void setTruckNumber(String truckNumber) { this.truckNumber = truckNumber; }
    public String getServiceType() { return serviceType; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getServiceDate() { return serviceDate; }
    public void setServiceDate(String serviceDate) { this.serviceDate = serviceDate; }
    public Double getOdometerAtService() { return odometerAtService; }
    public void setOdometerAtService(Double odometerAtService) { this.odometerAtService = odometerAtService; }
    public Double getCost() { return cost; }
    public void setCost(Double cost) { this.cost = cost; }
    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getNextServiceDate() { return nextServiceDate; }
    public void setNextServiceDate(String nextServiceDate) { this.nextServiceDate = nextServiceDate; }
    public Double getNextServiceOdometer() { return nextServiceOdometer; }
    public void setNextServiceOdometer(Double nextServiceOdometer) { this.nextServiceOdometer = nextServiceOdometer; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
