package com.matchme.controller;

import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.dto.EventSelectionDTO;
import com.matchme.service.MeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/me")
public class MeController {
    @Autowired
    private MeService meService;

    @GetMapping
    public ResponseEntity<UserProfileDTO> getMe(@RequestHeader("User-Id") UUID userId) {
        return ResponseEntity.ok(meService.getMe(userId));
    }

    @GetMapping("/profile")
    public ResponseEntity<DetailedProfileDTO> getMyProfile(@RequestHeader("User-Id") UUID userId) {
        return ResponseEntity.ok(meService.getMyProfile(userId));
    }

    @GetMapping("/bio")
    public ResponseEntity<BioDTO> getMyBio(@RequestHeader("User-Id") UUID userId) {
        return ResponseEntity.ok(meService.getMyBio(userId));
    }

    @GetMapping("/event-bios/{eventId}")
    public ResponseEntity<EventBioDTO> getMyEventBio(@RequestHeader("User-Id") UUID userId, @PathVariable Long eventId) {
        return ResponseEntity.ok(meService.getMyEventBio(userId, eventId));
    }

    @PutMapping("/bio")
    public ResponseEntity<BioDTO> updateBio(@RequestHeader("User-Id") UUID userId, @RequestBody BioDTO dto) {
        return ResponseEntity.ok(meService.updateBio(userId, dto));
    }

    @PutMapping("/event-bios/{eventId}")
    public ResponseEntity<EventBioDTO> updateEventBio(@RequestHeader("User-Id") UUID userId, @PathVariable Long eventId, @RequestBody EventBioDTO dto) {
        return ResponseEntity.ok(meService.updateEventBio(userId, eventId, dto));
    }

    @PutMapping("/profile-picture")
    public ResponseEntity<DetailedProfileDTO> updateProfilePicture(@RequestHeader("User-Id") UUID userId, @RequestBody ProfilePictureDTO dto) {
        return ResponseEntity.ok(meService.updateProfilePicture(userId, dto));
    }

    @DeleteMapping("/profile-picture")
    public ResponseEntity<Void> deleteProfilePicture(@RequestHeader("User-Id") UUID userId) {
        meService.deleteProfilePicture(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/event")
    public ResponseEntity<Void> setEvent(@RequestHeader("User-Id") UUID userId, @RequestBody EventSelectionDTO dto) {
        meService.setEvent(userId, dto);
        return ResponseEntity.noContent().build();
    }
}