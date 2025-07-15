package com.matchme.repository;

import com.matchme.model.Bio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface BioRepository extends JpaRepository<Bio, Long> {
    List<Bio> findAllByUserProfileUserId(UUID userId);
    Optional<Bio> findById(Long id);
}

