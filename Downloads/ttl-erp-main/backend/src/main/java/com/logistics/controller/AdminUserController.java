package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.User;
import com.logistics.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {
    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder encoder;

    @GetMapping("/users")
    public List<User> getUsers() {
        List<User> users = userRepo.findAll();
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody User user) {
        if (userRepo.existsByUsername(user.getUsername()))
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists: " + user.getUsername()));
        if (user.getPassword() == null || user.getPassword().isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        user.setPassword(encoder.encode(user.getPassword()));
        user.setCreatedAt(LocalDateTime.now().toString());
        if ("ADMIN".equals(user.getRole())) user.setPermissions(null);
        User saved = userRepo.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        return userRepo.findById(id).map(existing -> {
            updatedUser.setId(id);
            updatedUser.setCreatedAt(existing.getCreatedAt());
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
                updatedUser.setPassword(encoder.encode(updatedUser.getPassword()));
            } else {
                updatedUser.setPassword(existing.getPassword());
            }
            if ("ADMIN".equals(updatedUser.getRole())) updatedUser.setPermissions(null);
            User saved = userRepo.save(updatedUser);
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}/assign-modules")
    public ResponseEntity<?> assignModules(@PathVariable String id, @RequestBody Map<String, List<String>> body) {
        return userRepo.findById(id).map(user -> {
            user.setPermissions(body.get("permissions"));
            userRepo.save(user);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Hard delete — permanently removes the user ──────────
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        if (!userRepo.existsById(id))
            return ResponseEntity.notFound().build();
        userRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }
}
