package com.logistics.repository;
import com.logistics.model.Tyre;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface TyreRepository extends MongoRepository<Tyre, String> {}
