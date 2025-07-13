package com.matchme.model;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    //just to test, add more fields laters like intrerests, name, bio, location, etc...
    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique=true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Builder.Default
    @Column(nullable = false)
    private boolean profileComplete = false;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private UserProfile userProfile;
  
}
