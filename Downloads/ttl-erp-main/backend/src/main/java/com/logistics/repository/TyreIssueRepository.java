package com.logistics.repository;
import com.logistics.model.TyreIssue;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface TyreIssueRepository extends MongoRepository<TyreIssue, String> {
    List<TyreIssue> findByTruckNumber(String truckNumber);
    List<TyreIssue> findByTyreId(String tyreId);
}
