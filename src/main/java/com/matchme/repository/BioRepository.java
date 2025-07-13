package com.matchme.repository;

import com.matchme.model.Bio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BioRepository extends JpaRepository<Bio, Long> {
    Optional<Bio> findByUserProfileUserId(UUID userId);
}

