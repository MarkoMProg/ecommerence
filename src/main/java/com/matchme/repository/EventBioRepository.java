package com.matchme.repository;

import com.matchme.model.EventBio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventBioRepository extends JpaRepository<EventBio, Long> {
    Optional<EventBio> findByUserProfileUserIdAndEventId(UUID userId, Long eventId);

    @Query("SELECT eb FROM EventBio eb WHERE eb.userProfile.user.id = :userId")
    List<EventBio> findByUserProfileUserId(UUID userId);
}