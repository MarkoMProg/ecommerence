package com.matchme.repository;

import com.matchme.model.Connections;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConnectionsRepository extends JpaRepository<Connections, Long> {
    @Query("SELECT c FROM Connections c WHERE (c.user1.id = :userId OR c.user2.id = :userId) AND c.user1Status = :status AND c.user2Status = :status")
    List<Connections> findByUserIdAndStatus(UUID userId, String status);

    List<Connections> findByUser1IdAndUser1Status(UUID user1Id, String user1Status);
    List<Connections> findByUser2IdAndUser2Status(UUID user2Id, String user2Status);
    Optional<Connections> findByUser1IdAndUser2Id(UUID user1Id, UUID user2Id);
    Optional<Connections> findByUser1IdAndUser2IdAndUser1Status(UUID user1Id, UUID user2Id, String user1Status);
    Optional<Connections> findByUser1IdAndUser2IdAndStatus(UUID user1Id, UUID user2Id, String status);
}
