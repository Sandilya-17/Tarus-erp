package com.logistics.repository;
import com.logistics.model.Driver;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface DriverRepository extends MongoRepository<Driver, String> {
    List<Driver> findByStatus(String status);
    List<Driver> findByAssignedTruck(String truckNumber);
}
