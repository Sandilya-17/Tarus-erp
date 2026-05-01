package com.logistics.repository;

import com.logistics.model.RawMaterial;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDate;
import java.util.List;

public interface RawMaterialRepository extends MongoRepository<RawMaterial, String> {
    List<RawMaterial> findByEntryDateBetween(LocalDate from, LocalDate to);
    List<RawMaterial> findByCategory(String category);
    List<RawMaterial> findBySupplierNameContainingIgnoreCase(String name);
    List<RawMaterial> findByStatus(String status);
    List<RawMaterial> findByTruckNumber(String truckNumber);
    List<RawMaterial> findByAssignedTo(String assignedTo);
}
