package com.matchme.model;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "event_bio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EventBio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserProfile userProfile;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Enumerated(EnumType.STRING)
    private CommitmentLevel commitmentLevel;

    @Enumerated(EnumType.STRING)
    private PrimaryMotivation motivation;

    @Column
    private String roles;

    @Column(name = "looking_roles")
    private String lookingRoles;
}
