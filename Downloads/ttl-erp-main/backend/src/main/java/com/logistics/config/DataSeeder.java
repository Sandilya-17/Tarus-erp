package com.logistics.config;

import com.logistics.model.User;
import com.logistics.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        // ── Remove old demo user if it exists ─────────────
        Optional<User> demo = userRepository.findByUsername("employee1");
        demo.ifPresent(u -> { userRepository.delete(u); System.out.println("🗑  Removed demo user: employee1"); });

        // ── Admin ─────────────────────────────────────────
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("admin123"));
            admin.setFullName("System Administrator");
            admin.setRole("ADMIN");
            admin.setDepartment("Administration");
            admin.setJobTitle("System Admin");
            admin.setEmployeeId("EMP-001");
            admin.setActive(true);
            admin.setCreatedAt(LocalDateTime.now().toString());
            userRepository.save(admin);
            System.out.println("✅ Admin user created: admin / admin123");
        }

        // ── Operations Manager ────────────────────────────
        if (!userRepository.existsByUsername("operations")) {
            User emp = new User();
            emp.setUsername("operations");
            emp.setPassword(encoder.encode("ops123"));
            emp.setFullName("Operations Manager");
            emp.setRole("EMPLOYEE");
            emp.setDepartment("Operations");
            emp.setJobTitle("Operations Manager");
            emp.setEmployeeId("EMP-002");
            emp.setActive(true);
            emp.setPermissions(List.of(
                "VIEW_TRUCKS","MANAGE_TRUCKS",
                "DRIVERS","MANAGE_DRIVERS",
                "TRIPS","CREATE_TRIPS",
                "FUEL_ENTRY","ADD_FUEL",
                "SPARE_PART_ISSUE","MANAGE_SPARE_PARTS",
                "TYRE_ISSUE","MANAGE_TYRES",
                "MAINTENANCE","MANAGE_MAINTENANCE",
                "FINANCE","VIEW_REPORTS"
            ));
            emp.setCreatedAt(LocalDateTime.now().toString());
            userRepository.save(emp);
            System.out.println("✅ Operations user created: operations / ops123");
        }

        // ── Finance Officer ───────────────────────────────
        if (!userRepository.existsByUsername("finance")) {
            User fin = new User();
            fin.setUsername("finance");
            fin.setPassword(encoder.encode("fin123"));
            fin.setFullName("Finance Officer");
            fin.setRole("EMPLOYEE");
            fin.setDepartment("Finance");
            fin.setJobTitle("Finance Officer");
            fin.setEmployeeId("EMP-003");
            fin.setActive(true);
            fin.setPermissions(List.of(
                "FINANCE","MANAGE_FINANCE","APPROVE_FINANCE","EXPORT_FINANCE",
                "VIEW_REPORTS","EXPORT_REPORTS"
            ));
            fin.setCreatedAt(LocalDateTime.now().toString());
            userRepository.save(fin);
            System.out.println("✅ Finance user created: finance / fin123");
        }
    }
}
