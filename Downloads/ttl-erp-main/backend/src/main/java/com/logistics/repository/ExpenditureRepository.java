package com.logistics.repository;

import com.logistics.model.Expenditure;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface ExpenditureRepository extends MongoRepository<Expenditure, String> {
    List<Expenditure> findByDateBetween(LocalDate from, LocalDate to);
    List<Expenditure> findByCategory(String category);
    List<Expenditure> findByTruckNumber(String truckNumber);
    List<Expenditure> findByCreatedBy(String createdBy);
}
