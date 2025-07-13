package com.matchme.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Chat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "id1", nullable = false)
    private User user1;

    @ManyToOne
    @JoinColumn(name = "id2", nullable = false)
    private User user2;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column
    private String message;

    @Column
    private LocalDateTime timestamp;

    @Column(name = "is_read")
    private Boolean isRead;
}
