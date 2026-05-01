package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "spare_parts")
public class SparePart {
    @Id private String id;
    private String partName;
    private String partCode;
    private String category;
    private String unit;
    private String vendor;
    private String location;
    private String hsCode;
    private Double vatPercent;
    private Double unitPrice;
    private Integer openingStock;
    private Integer purchasedStock = 0;
    private Integer issuedStock = 0;
    private Integer currentStock;
    private Integer reorderLevel;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public String getPartCode() { return partCode; }
    public void setPartCode(String partCode) { this.partCode = partCode; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getHsnCode() { return hsCode; }
    public void setHsnCode(String hsCode) { this.hsCode = hsCode; }
    public Double getVatPercent() { return vatPercent; }
    public void setVatPercent(Double vatPercent) { this.vatPercent = vatPercent; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public Integer getOpeningStock() { return openingStock; }
    public void setOpeningStock(Integer openingStock) { this.openingStock = openingStock; }
    public Integer getPurchasedStock() { return purchasedStock; }
    public void setPurchasedStock(Integer purchasedStock) { this.purchasedStock = purchasedStock; }
    public Integer getIssuedStock() { return issuedStock; }
    public void setIssuedStock(Integer issuedStock) { this.issuedStock = issuedStock; }
    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
