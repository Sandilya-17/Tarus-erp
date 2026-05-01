package com.logistics.repository;

import com.logistics.model.Invoice;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface InvoiceRepository extends MongoRepository<Invoice, String> {
    List<Invoice> findByIssueDateBetween(LocalDate from, LocalDate to);
    List<Invoice> findByStatus(String status);
    List<Invoice> findByTripId(String tripId);
    List<Invoice> findByPartyNameContainingIgnoreCase(String name);
    List<Invoice> findByDueDateBefore(LocalDate date);
}
