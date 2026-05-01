package com.logistics.repository;
import com.logistics.model.FuelEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface FuelEntryRepository extends MongoRepository<FuelEntry, String> {
    List<FuelEntry> findByTruckNumber(String truckNumber);
    List<FuelEntry> findByMonthAndYear(int month, int year);
}
