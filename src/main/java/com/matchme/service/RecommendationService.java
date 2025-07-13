package com.matchme.service;

import com.matchme.dto.DismissRecommendationDTO;
import com.matchme.dto.RecommendationsDTO;
import com.matchme.model.Bio;
import com.matchme.model.EventBio;
import com.matchme.model.User;
import com.matchme.repository.BioRepository;
import com.matchme.repository.ConnectionsRepository;
import com.matchme.repository.EventBioRepository;
import com.matchme.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EventBioRepository eventBioRepository;
    @Autowired
    private BioRepository bioRepository;
    @Autowired
    private ConnectionsRepository connectionsRepository;


    public RecommendationsDTO getRecommendations(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<EventBio> userEventBios = eventBioRepository.findByUserProfileUserId(userId);
        if (userEventBios.isEmpty()) {
            return new RecommendationsDTO(List.of());
        }

        // Get all users in the same events, excluding existing connections
        List<UUID> connectedUserIds = connectionsRepository.findByUserIdAndStatus(userId, "ACCEPTED")
                .stream()
                .map(conn -> conn.getUser1().getId().equals(userId) ? conn.getUser2().getId() : conn.getUser1().getId())
                .collect(Collectors.toList());

        List<UUID> recommendedUserIds = userEventBios.stream()
                .flatMap(eventBio -> userRepository.findByEventId(eventBio.getEvent().getId()).stream())
                .map(User::getId)
                .filter(id -> !id.equals(userId) && !connectedUserIds.contains(id))
                .filter(otherUserId -> isGoodMatch(user, userRepository.findById(otherUserId).orElse(null)))
                .distinct()
                .collect(Collectors.toList());

        return new RecommendationsDTO(recommendedUserIds);
    }

    @Transactional
    public void dismissRecommendation(UUID userId, DismissRecommendationDTO dto) {
        // Logic to mark a recommendation as dismissed (e.g., store in a dismissals table)
        throw new UnsupportedOperationException("Dismiss recommendation not implemented");
    }

    private boolean isGoodMatch(User user1, User user2) {
        if (user1 == null || user2 == null) return false;

        // Fetch EventBio for both users
        List<EventBio> user1EventBios = eventBioRepository.findByUserProfileUserId(user1.getId());
        List<EventBio> user2EventBios = eventBioRepository.findByUserProfileUserId(user2.getId());
        if (user1EventBios.isEmpty() || user2EventBios.isEmpty()) return false;

        // Check if users share at least one event
        Set<Long> user1EventIds = user1EventBios.stream()
                .map(eb -> eb.getEvent().getId())
                .collect(Collectors.toSet());
        Set<Long> user2EventIds = user2EventBios.stream()
                .map(eb -> eb.getEvent().getId())
                .collect(Collectors.toSet());
        user1EventIds.retainAll(user2EventIds);
        if (user1EventIds.isEmpty()) return false;

        // Fetch Bios for furry check and skill evaluation
        Bio bio1 = bioRepository.findByUserProfileUserId(user1.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bio not found for user1"));
        Bio bio2 = bioRepository.findByUserProfileUserId(user2.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bio not found for user2"));

        // Furry compatibility: must both be furry or both non-furry
        if (bio1.getUserProfile().getIsFurry() != bio2.getUserProfile().getIsFurry()) return false;

        // Find EventBio for a shared event
        EventBio user1EventBio = user1EventBios.stream()
                .filter(eb -> user1EventIds.contains(eb.getEvent().getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("EventBio not found for shared event"));
        EventBio user2EventBio = user2EventBios.stream()
                .filter(eb -> user1EventIds.contains(eb.getEvent().getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("EventBio not found for shared event"));

        // Role overlap check: roles of one cannot completely match lookingRoles of the other
        Set<String> user1Roles = new HashSet<>(Arrays.asList(user1EventBio.getRoles().split(",\\s*")));
        Set<String> user2LookingRoles = new HashSet<>(Arrays.asList(user2EventBio.getLookingRoles().split(",\\s*")));
        Set<String> user2Roles = new HashSet<>(Arrays.asList(user2EventBio.getRoles().split(",\\s*")));
        Set<String> user1LookingRoles = new HashSet<>(Arrays.asList(user1EventBio.getLookingRoles().split(",\\s*")));

        if (user1Roles.equals(user2LookingRoles) || user2Roles.equals(user1LookingRoles)) return false;

        // Commitment compatibility
        int commitmentScore = GoalCompatibility.getCommitmentCompatibility(
                user1EventBio.getCommitmentLevel(),
                user2EventBio.getCommitmentLevel()
        );

        // Motivation compatibility
        int motivationScore = GoalCompatibility.getMotivationCompatibility(
                user1EventBio.getMotivation(),
                user2EventBio.getMotivation()
        );

        // Skill compatibility: ensure complementary skills based on roleSkills map
        Map<String, List<String>> roleSkills = GoalCompatibility.getRoleSkillMap();
        List<String> user1Skills = roleSkills.getOrDefault(bio1.getRole(), List.of());
        List<String> user2Skills = roleSkills.getOrDefault(bio2.getRole(), List.of());
        Set<String> commonSkills = new HashSet<>(user1Skills);
        commonSkills.retainAll(user2Skills);

        // Adjust score based on skill level difference
        int skillLevelDiff = Math.abs(bio1.getSkillLevel().ordinal() - bio2.getSkillLevel().ordinal());
        int skillScore = commonSkills.isEmpty() ? 3 : (skillLevelDiff <= 1 ? 2 : 1);

        // Total score: require at least 4 (adjustable threshold)
        int totalScore = commitmentScore + motivationScore + skillScore;
        return totalScore >= 4;
    }
}