package com.matchme.service;

import com.matchme.dto.DismissRecommendationDTO;
import com.matchme.dto.RecommendationsDTO;
import com.matchme.dto.MatchDTO;
import com.matchme.model.Bio;
import com.matchme.model.EventBio;
import com.matchme.model.User;
import com.matchme.model.UserProfile;
import com.matchme.repository.BioRepository;
import com.matchme.repository.ConnectionsRepository;
import com.matchme.repository.EventBioRepository;
import com.matchme.repository.UserProfileRepository;
import com.matchme.repository.UserRepository;
import com.matchme.mapper.UserProfileMapper;
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
    private UserProfileRepository userProfileRepository;
    @Autowired
    private UserProfileMapper userProfileMapper;
    @Autowired
    private EventBioRepository eventBioRepository;
    @Autowired
    private BioRepository bioRepository;
    @Autowired
    private ConnectionsRepository connectionsRepository;

    public RecommendationsDTO getRecommendations(UUID userId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found"));
        if (userProfile.getActiveEvent() == null) {
            return new RecommendationsDTO(List.of());
        }

        // Get connected user IDs to exclude them
        List<UUID> connectedUserIds = connectionsRepository.findByUserIdAndStatus(userId, "ACCEPTED")
                .stream()
                .map(conn -> conn.getUser1().getId().equals(userId) ? conn.getUser2().getId() : conn.getUser1().getId())
                .collect(Collectors.toList());

        // Find users with the same active event
        Long activeEventId = userProfile.getActiveEvent().getId();
        List<MatchDTO> recommendedUsers = userProfileRepository.findByActiveEventId(activeEventId)
                .stream()
                .filter(profile -> !profile.getUser().getId().equals(userId) && !connectedUserIds.contains(profile.getUser().getId()))
                .filter(profile -> isGoodMatch(userProfile, profile))
                .map(profile -> new MatchDTO(
                    userProfileMapper.longToUuid(profile.getId()),
                    profile.getName(),
                    profile.getActiveEvent().getId()
                ))
                .collect(Collectors.toList());

        return new RecommendationsDTO(recommendedUsers.stream()
                .map(MatchDTO::userId)
                .collect(Collectors.toList()));
    }

    @Transactional
    public void dismissRecommendation(UUID userId, DismissRecommendationDTO dto) {
        // Logic to mark a recommendation as dismissed (e.g., store in a dismissals table)
        throw new UnsupportedOperationException("Dismiss recommendation not implemented");
    }

    private boolean isGoodMatch(UserProfile userProfile1, UserProfile userProfile2) {
        if (userProfile1 == null || userProfile2 == null || userProfile1.getActiveEvent() == null || userProfile2.getActiveEvent() == null) {
            return false;
        }

        // Ensure they share the same active event
        if (!userProfile1.getActiveEvent().getId().equals(userProfile2.getActiveEvent().getId())) {
            return false;
        }

        // Fetch EventBio for the active event
        Long eventId = userProfile1.getActiveEvent().getId();
        EventBio user1EventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userProfile1.getUser().getId(), eventId)
                .orElseThrow(() -> new IllegalArgumentException("EventBio not found for user1"));
        EventBio user2EventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userProfile2.getUser().getId(), eventId)
                .orElseThrow(() -> new IllegalArgumentException("EventBio not found for user2"));

        // Fetch Bios (use first bio for simplicity; can be extended to check all bios)
        List<Bio> user1Bios = bioRepository.findAllByUserProfileUserId(userProfile1.getUser().getId());
        List<Bio> user2Bios = bioRepository.findAllByUserProfileUserId(userProfile2.getUser().getId());
        if (user1Bios.isEmpty() || user2Bios.isEmpty()) {
            return false;
        }
        Bio bio1 = user1Bios.get(0); // Use first bio; adjust if multiple bios are relevant
        Bio bio2 = user2Bios.get(0);

        // Furry compatibility: must both be furry or both non-furry
        if (userProfile1.getIsFurry() != userProfile2.getIsFurry()) {
            return false;
        }

        // Role overlap check: roles of one cannot completely match lookingRoles of the other
        Set<String> user1Roles = new HashSet<>(Arrays.asList(user1EventBio.getRoles().split(",\\s*")));
        Set<String> user2LookingRoles = new HashSet<>(Arrays.asList(user2EventBio.getLookingRoles().split(",\\s*")));
        Set<String> user2Roles = new HashSet<>(Arrays.asList(user2EventBio.getRoles().split(",\\s*")));
        Set<String> user1LookingRoles = new HashSet<>(Arrays.asList(user1EventBio.getLookingRoles().split(",\\s*")));

        if (user1Roles.equals(user2LookingRoles) || user2Roles.equals(user1LookingRoles)) {
            return false;
        }

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