package com.matchme.model;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "bio")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Bio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserProfile userProfile;

    @Column
    private String role;

    @Column
    private String skill;

    @Enumerated(EnumType.STRING)
    private SkillLevel skillLevel;
}
