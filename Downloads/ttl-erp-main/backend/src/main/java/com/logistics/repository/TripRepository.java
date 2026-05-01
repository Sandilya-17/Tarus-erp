package com.logistics.repository;
import com.logistics.model.Trip;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;
public interface TripRepository extends MongoRepository<Trip, String> {
    Optional<Trip> findByLrNumber(String lrNumber);
    boolean existsByLrNumber(String lrNumber);
    List<Trip> findByTruckNumber(String truckNumber);
    List<Trip> findByStatus(String status);
}
