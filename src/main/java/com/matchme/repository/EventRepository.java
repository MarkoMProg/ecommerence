package com.matchme.repository;

import com.matchme.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, Long> {
    //Optional<Event> findByUserId(UUID userId); // For recommendations
}
