package com.logistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import com.logistics.model.User;
import com.logistics.repository.UserRepository;
import com.logistics.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired private UserRepository userRepository;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private PasswordEncoder encoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        return userRepository.findByUsername(username)
            .filter(u -> u.isActive() && encoder.matches(password, u.getPassword()))
            .map(u -> {
                String token = jwtUtil.generateToken(u.getUsername(), u.getRole());
                // Clear password before sending
                u.setPassword(null);
                return ResponseEntity.ok(Map.of("token", token, "user", u));
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid credentials or account inactive")));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        User user = (User) auth.getPrincipal();
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        User user = (User) auth.getPrincipal();
        return userRepository.findById(user.getId()).map(u -> {
            if (!encoder.matches(body.get("currentPassword"), u.getPassword()))
                return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
            u.setPassword(encoder.encode(body.get("newPassword")));
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
