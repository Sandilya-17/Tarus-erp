package com.logistics.repository;

import com.logistics.model.Payroll;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PayrollRepository extends MongoRepository<Payroll, String> {
    List<Payroll> findByMonthAndYear(Integer month, Integer year);
    List<Payroll> findByEmployeeId(String employeeId);
    List<Payroll> findByStatus(String status);
    List<Payroll> findByYear(Integer year);
    List<Payroll> findByEmployeeName(String employeeName);
}
