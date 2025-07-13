package com.matchme.controller;

import com.matchme.dto.*;
import com.matchme.model.User;
import com.matchme.security.JwtService;
import com.matchme.service.AuthService;
import com.matchme.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor

public class AuthController {
    
    private final AuthService authService;
    private final JwtService jwtService;
    private final UserService userService;

    @PostMapping("/register")
    public AuthResponseDTO register(@RequestBody RegisterRequest request){
        User user = authService.register(request.email(), request.password());
        String token = jwtService.generateToken(user.getId());
        return new AuthResponseDTO(token);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequest request){
        User user = authService.validateCredentials(request.email(), request.password())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        String token = jwtService.generateToken(user.getId());
        return new AuthResponseDTO(token);
    }
    @GetMapping("/profile/{userId}")
    public UserProfileDTO getUserProfile(@PathVariable UUID userId, @RequestHeader("User-Id") UUID currentUserId) {
        return userService.getUserProfile(userId, currentUserId);
    }
    

}
