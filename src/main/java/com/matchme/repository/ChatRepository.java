package com.matchme.repository;

import com.matchme.model.Chat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ChatRepository extends JpaRepository<Chat, Long> {
    @Query("SELECT c FROM Chat c WHERE (c.user1.id = :user1Id AND c.user2.id = :user2Id) OR (c.user1.id = :user2Id AND c.user2.id = :user1Id)")
    List<Chat> findByUserPair(UUID user1Id, UUID user2Id, Pageable pageable);

    @Query("SELECT c FROM Chat c WHERE (c.user1.id = :user1Id OR c.user2.id = :user1Id)")
    List<Chat> findByUser1IdOrUser2Id(UUID user1Id, UUID user2Id);

    @Query("SELECT c FROM Chat c WHERE (c.user1.id = :user1Id AND c.user2.id = :user2Id) OR (c.user1.id = :user2Id AND c.user2.id = :user1Id) AND c.isRead = false")
    List<Chat> findByUserPairAndIsReadFalse(UUID user1Id, UUID user2Id);
}