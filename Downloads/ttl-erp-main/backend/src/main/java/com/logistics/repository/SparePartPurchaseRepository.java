package com.logistics.repository;
import com.logistics.model.SparePartPurchase;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
public interface SparePartPurchaseRepository extends MongoRepository<SparePartPurchase, String> {
    List<SparePartPurchase> findByPartId(String partId);
}
