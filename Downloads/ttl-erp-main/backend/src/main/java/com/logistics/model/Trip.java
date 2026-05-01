package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "trips")
public class Trip {
    @Id private String id;
    @Indexed(unique = true) private String lrNumber;
    private String truckNumber;
    private String driverName;
    private String consignor;
    private String consignee;
    private String from;
    private String to;
    private String startDate;
    private String endDate;
    private Double freight;
    private Double advance;
    private Double balance;
    private String paymentMode;
    private String status;
    private String remarks;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getLrNumber() { return lrNumber; }
    public void setLrNumber(String lrNumber) { this.lrNumber = lrNumber; }
    public String getTruckNumber() { return truckNumber; }
    public void setTruckNumber(String truckNumber) { this.truckNumber = truckNumber; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getConsignor() { return consignor; }
    public void setConsignor(String consignor) { this.consignor = consignor; }
    public String getConsignee() { return consignee; }
    public void setConsignee(String consignee) { this.consignee = consignee; }
    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public Double getFreight() { return freight; }
    public void setFreight(Double freight) { this.freight = freight; }
    public Double getAdvance() { return advance; }
    public void setAdvance(Double advance) { this.advance = advance; }
    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
