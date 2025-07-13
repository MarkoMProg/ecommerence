package com.matchme.service;

import com.matchme.model.User;
import com.matchme.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User register(String email, String password){
        String hashed = passwordEncoder.encode(password);
        User user = User.builder()
                    .email(email)
                    .passwordHash(hashed)
                    .profileComplete(false)
                    .build();
        return userRepository.save(user);
    }

public Optional<User> validateCredentials(String email, String rawPassword){
    return userRepository.findByEmail(email)
        .filter(user -> passwordEncoder.matches(rawPassword, user.getPasswordHash()));
}

}



