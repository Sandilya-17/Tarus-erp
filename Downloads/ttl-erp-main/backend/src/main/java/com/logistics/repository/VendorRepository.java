package com.logistics.repository;

import com.logistics.model.Vendor;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface VendorRepository extends MongoRepository<Vendor, String> {
    List<Vendor> findByActiveTrue();
    List<Vendor> findByCategory(String category);
    List<Vendor> findByNameContainingIgnoreCase(String name);
}
