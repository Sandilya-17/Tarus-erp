package com.logistics.repository;
import com.logistics.model.MaintenanceRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface MaintenanceRepository extends MongoRepository<MaintenanceRecord, String> {
    List<MaintenanceRecord> findByTruckNumber(String truckNumber);
    List<MaintenanceRecord> findByStatus(String status);
}
