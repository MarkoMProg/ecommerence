package com.matchme.service;

import com.matchme.dto.AuthRequestDTO;
import com.matchme.dto.AuthResponseDTO;
import com.matchme.model.User;
import com.matchme.mapper.UserMapper;
import com.matchme.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponseDTO register(AuthRequestDTO dto) {
        if (userRepository.findByEmail(dto.email()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        User user = userMapper.toEntity(dto);
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        user.setProfileComplete(false); // New users start with incomplete profiles
        userRepository.save(user);
        return new AuthResponseDTO(generateToken(user));
    }

    public AuthResponseDTO login(AuthRequestDTO dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        return new AuthResponseDTO(generateToken(user));
    }

    private String generateToken(User user) {
        // Implement JWT or other token generation logic
        return "jwt-token-placeholder";
    }
}
