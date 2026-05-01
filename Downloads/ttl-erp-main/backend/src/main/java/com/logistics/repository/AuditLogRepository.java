package com.logistics.repository;

import com.logistics.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime from, LocalDateTime to);
    List<AuditLog> findByPerformedBy(String username);
    List<AuditLog> findByEntity(String entity);
    List<AuditLog> findTop200ByOrderByTimestampDesc();
}
