package com.logistics.repository;

import com.logistics.model.Revenue;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface RevenueRepository extends MongoRepository<Revenue, String> {
    List<Revenue> findByDateBetween(LocalDate from, LocalDate to);
    List<Revenue> findByCategory(String category);
    List<Revenue> findByTripId(String tripId);
    List<Revenue> findByCreatedBy(String createdBy);
}
