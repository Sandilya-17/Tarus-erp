package com.logistics.repository;
import com.logistics.model.SparePart;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface SparePartRepository extends MongoRepository<SparePart, String> {
    List<SparePart> findByCategory(String category);
}
