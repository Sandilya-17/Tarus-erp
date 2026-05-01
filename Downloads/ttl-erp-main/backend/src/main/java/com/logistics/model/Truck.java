package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "trucks")
public class Truck {
    @Id private String id;
    @Indexed(unique = true) private String truckNumber;
    private String vehicleType;
    private String make;
    private String model;
    private Integer year;
    private Double odometer;
    private String owner;
    private Double fuelLimit;
    private String rcExpiry;
    private String insuranceExpiry;
    private String fitnessExpiry;
    private String permitExpiry;
    private boolean active = true;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTruckNumber() { return truckNumber; }
    public void setTruckNumber(String truckNumber) { this.truckNumber = truckNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getMake() { return make; }
    public void setMake(String make) { this.make = make; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public Double getOdometer() { return odometer; }
    public void setOdometer(Double odometer) { this.odometer = odometer; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public Double getFuelLimit() { return fuelLimit; }
    public void setFuelLimit(Double fuelLimit) { this.fuelLimit = fuelLimit; }
    public String getRcExpiry() { return rcExpiry; }
    public void setRcExpiry(String rcExpiry) { this.rcExpiry = rcExpiry; }
    public String getInsuranceExpiry() { return insuranceExpiry; }
    public void setInsuranceExpiry(String insuranceExpiry) { this.insuranceExpiry = insuranceExpiry; }
    public String getFitnessExpiry() { return fitnessExpiry; }
    public void setFitnessExpiry(String fitnessExpiry) { this.fitnessExpiry = fitnessExpiry; }
    public String getPermitExpiry() { return permitExpiry; }
    public void setPermitExpiry(String permitExpiry) { this.permitExpiry = permitExpiry; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
