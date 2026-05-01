package com.logistics.repository;

import com.logistics.model.Fuel;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FuelRepository extends MongoRepository<Fuel, String> {
    List<Fuel> findByMonthAndYear(int month, int year);
    List<Fuel> findByTruckNumber(String truckNumber);
    List<Fuel> findByTruckNumberAndMonthAndYear(String truckNumber, int month, int year);
}
