package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tyres")
public class Tyre {
    @Id private String id;
    private String tyreName;
    private String tyreCode;
    private String brand;
    private String size;
    private String type;
    private String vendor;
    private Double unitPrice;
    private Integer openingStock;
    private Integer purchased = 0;
    private Integer issued = 0;
    private Integer currentStock;
    private Integer reorderLevel;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTyreName() { return tyreName; }
    public void setTyreName(String tyreName) { this.tyreName = tyreName; }
    public String getTyreCode() { return tyreCode; }
    public void setTyreCode(String tyreCode) { this.tyreCode = tyreCode; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getVendor() { return vendor; }
    public void setVendor(String vendor) { this.vendor = vendor; }
    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
    public Integer getOpeningStock() { return openingStock; }
    public void setOpeningStock(Integer openingStock) { this.openingStock = openingStock; }
    public Integer getPurchased() { return purchased; }
    public void setPurchased(Integer purchased) { this.purchased = purchased; }
    public Integer getIssued() { return issued; }
    public void setIssued(Integer issued) { this.issued = issued; }
    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
