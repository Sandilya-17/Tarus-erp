package com.logistics.repository;
import com.logistics.model.SparePartIssue;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface SparePartIssueRepository extends MongoRepository<SparePartIssue, String> {
    List<SparePartIssue> findByTruckNumber(String truckNumber);
    List<SparePartIssue> findByPartId(String partId);
}
