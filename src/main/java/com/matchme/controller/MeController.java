package com.matchme.controller;

import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.dto.EventSelectionDTO;
import com.matchme.service.MeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;
@RestController
@RequestMapping("/me")
public class MeController {
    @Autowired
    private MeService meService;

    @GetMapping
    public ResponseEntity<UserProfileDTO> getMe(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(meService.getMe(userId));
    }

    @GetMapping("/profile")
    public ResponseEntity<DetailedProfileDTO> getMyProfile(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(meService.getMyProfile(userId));
    }

    @GetMapping("/bios")
    public ResponseEntity<List<BioDTO>> getMyBios(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(meService.getMyBios(userId));
    }

    @GetMapping("/event-bios/{eventId}")
    public ResponseEntity<EventBioDTO> getMyEventBio(@AuthenticationPrincipal UUID userId, @PathVariable Long eventId) {
        return ResponseEntity.ok(meService.getMyEventBio(userId, eventId));
    }

    @PostMapping("/bios")
    public ResponseEntity<BioDTO> createBio(@AuthenticationPrincipal UUID userId, @RequestBody BioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(meService.createBio(userId, dto));
    }

    @PutMapping("/bios/{bioId}")
    public ResponseEntity<BioDTO> updateBio(@AuthenticationPrincipal UUID userId, @PathVariable Long bioId, @RequestBody BioDTO dto) {
        return ResponseEntity.ok(meService.updateBio(userId, bioId, dto));
    }

    @PutMapping("/event-bios/{eventId}")
    public ResponseEntity<EventBioDTO> updateEventBio(@AuthenticationPrincipal UUID userId, @PathVariable Long eventId, @RequestBody EventBioDTO dto) {
        return ResponseEntity.ok(meService.updateEventBio(userId, eventId, dto));
    }

    @PutMapping("/profile-picture")
    public ResponseEntity<DetailedProfileDTO> updateProfilePicture(@AuthenticationPrincipal UUID userId, @RequestBody ProfilePictureDTO dto) {
        return ResponseEntity.ok(meService.updateProfilePicture(userId, dto));
    }

    @DeleteMapping("/profile-picture")
    public ResponseEntity<Void> deleteProfilePicture(@AuthenticationPrincipal UUID userId) {
        meService.deleteProfilePicture(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/event")
    public ResponseEntity<Void> setEvent(@AuthenticationPrincipal UUID userId, @RequestBody EventSelectionDTO dto) {
        meService.setEvent(userId, dto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/active-event/{eventId}")
    public ResponseEntity<Void> setActiveEvent(@AuthenticationPrincipal UUID userId, @PathVariable Long eventId) {
        meService.setActiveEvent(userId, eventId);
        return ResponseEntity.noContent().build();
    }
}