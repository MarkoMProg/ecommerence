package com.matchme.controller;


import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
import com.matchme.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UsersController {
    @Autowired
    private UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable UUID id, @RequestHeader("User-Id") UUID currentUserId) {
        return ResponseEntity.ok(userService.getUserProfile(id, currentUserId));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<DetailedProfileDTO> getDetailedProfile(@PathVariable UUID id, @RequestHeader("User-Id") UUID currentUserId) {
        return ResponseEntity.ok(userService.getDetailedProfile(id, currentUserId));
    }

    @GetMapping("/{id}/bio")
    public ResponseEntity<BioDTO> getBio(@PathVariable UUID id, @RequestHeader("User-Id") UUID currentUserId) {
        return ResponseEntity.ok(userService.getBio(id, currentUserId));
    }

    @GetMapping("/{id}/event-bios/{eventId}")
    public ResponseEntity<EventBioDTO> getEventBio(@PathVariable UUID id, @PathVariable Long eventId, @RequestHeader("User-Id") UUID currentUserId) {
        return ResponseEntity.ok(userService.getEventBio(id, eventId, currentUserId));
    }
}