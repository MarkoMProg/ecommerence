package com.matchme.repository;

import com.matchme.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUserId(UUID userId);
    List<UserProfile> findByActiveEventId(Long eventId);
}