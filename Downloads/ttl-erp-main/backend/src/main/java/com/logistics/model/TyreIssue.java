package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "tyre_issues")
public class TyreIssue {
    @Id private String id;
    private String tyreId;
    private String tyreName;
    private String truckNumber;
    private Integer quantity;
    private String position;
    private String location;
    private String issuedBy;
    private String issuedDate;
    private String remarks;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTyreId() { return tyreId; }
    public void setTyreId(String tyreId) { this.tyreId = tyreId; }
    public String getTyreName() { return tyreName; }
    public void setTyreName(String tyreName) { this.tyreName = tyreName; }
    public String getTruckNumber() { return truckNumber; }
    public void setTruckNumber(String truckNumber) { this.truckNumber = truckNumber; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getIssuedBy() { return issuedBy; }
    public void setIssuedBy(String issuedBy) { this.issuedBy = issuedBy; }
    public String getIssuedDate() { return issuedDate; }
    public void setIssuedDate(String issuedDate) { this.issuedDate = issuedDate; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
