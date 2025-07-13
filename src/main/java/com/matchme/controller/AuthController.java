package com.matchme.controller;

import com.matchme.dto.*;
import com.matchme.model.User;
import com.matchme.security.JwtService;
import com.matchme.service.UserServiceOLD;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor

public class AuthController {
    
    private final UserServiceOLD userService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public AuthResponseDTO register(@RequestBody RegisterRequest request){
        User user = userService.register(request.email(), request.password());
        String token = jwtService.generateToken(user.getId());
        return new AuthResponseDTO(token);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@RequestBody LoginRequest request){
        User user = userService.validateCredentials(request.email(), request.password())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        String token = jwtService.generateToken(user.getId());
        return new AuthResponseDTO(token);
    }
    

}
