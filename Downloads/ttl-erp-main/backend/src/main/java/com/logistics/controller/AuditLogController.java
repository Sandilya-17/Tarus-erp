package com.logistics.controller;

import com.logistics.model.AuditLog;
import com.logistics.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/audit-log")
public class AuditLogController {

    @Autowired private AuditLogRepository repo;

    @GetMapping
    public List<AuditLog> getAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String entity,
            @RequestParam(required = false) String performedBy) {
        if (from != null && to != null) return repo.findByTimestampBetweenOrderByTimestampDesc(from, to);
        if (entity != null && !entity.isEmpty()) return repo.findByEntity(entity);
        if (performedBy != null && !performedBy.isEmpty()) return repo.findByPerformedBy(performedBy);
        return repo.findTop200ByOrderByTimestampDesc();
    }
}
