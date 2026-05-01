package com.logistics.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "audit_logs")
public class AuditLog {
    @Id private String id;
    private String action;        // CREATE, UPDATE, DELETE, LOGIN, EXPORT, IMPORT
    private String entity;        // Trip, Truck, Fuel, RawMaterial, etc.
    private String entityId;
    private String entityRef;     // Human-readable reference (e.g. LR number, truck number)
    private String performedBy;   // username
    private String performedByRole;
    private LocalDateTime timestamp;
    private String details;       // JSON or human-readable change summary
    private String ipAddress;

    public AuditLog() {}
    public AuditLog(String action, String entity, String entityId, String entityRef,
                    String performedBy, String performedByRole, String details) {
        this.action = action; this.entity = entity; this.entityId = entityId;
        this.entityRef = entityRef; this.performedBy = performedBy;
        this.performedByRole = performedByRole; this.details = details;
        this.timestamp = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEntity() { return entity; }
    public void setEntity(String entity) { this.entity = entity; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getEntityRef() { return entityRef; }
    public void setEntityRef(String entityRef) { this.entityRef = entityRef; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public String getPerformedByRole() { return performedByRole; }
    public void setPerformedByRole(String performedByRole) { this.performedByRole = performedByRole; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
