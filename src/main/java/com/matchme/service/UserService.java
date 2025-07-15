package com.matchme.service;

import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
import com.matchme.dto.RecommendationsDTO;
import com.matchme.model.User;
import com.matchme.model.UserProfile;
import com.matchme.model.Bio;
import com.matchme.model.EventBio;
import com.matchme.mapper.UserMapper;
import com.matchme.mapper.UserProfileMapper;
import com.matchme.mapper.BioMapper;
import com.matchme.mapper.EventBioMapper;
import com.matchme.repository.UserRepository;
import com.matchme.repository.UserProfileRepository;
import com.matchme.repository.BioRepository;
import com.matchme.repository.ConnectionsRepository;
import com.matchme.repository.EventBioRepository;
import com.matchme.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private UserProfileMapper userProfileMapper;
    @Autowired
    private BioMapper bioMapper;
    @Autowired
    private EventBioMapper eventBioMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;
    @Autowired
    private BioRepository bioRepository;
    @Autowired
    private EventBioRepository eventBioRepository;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
private ConnectionsRepository connectionsRepository;
@Autowired
private RecommendationService recommendationService;

    public UserProfileDTO getUserProfile(UUID id, UUID currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!isProfileAccessible(id, currentUserId)) {
            throw new IllegalArgumentException("Access denied");
        }
        return userMapper.toUserProfileDTO(user);
    }

    public DetailedProfileDTO getDetailedProfile(UUID id, UUID currentUserId) {
        UserProfile profile = userProfileRepository.findByUserId(id)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        if (!isProfileAccessible(id, currentUserId)) {
            throw new IllegalArgumentException("Access denied");
        }
        return userProfileMapper.toDTO(profile);
    }

    public List<BioDTO> getBios(UUID id, UUID currentUserId) {
        if (!isProfileAccessible(id, currentUserId)) {
            throw new IllegalArgumentException("Access denied");
        }
        List<Bio> bios = bioRepository.findAllByUserProfileUserId(id);
        return bios.stream().map(bioMapper::toDTO).collect(Collectors.toList());
    }

    public EventBioDTO getEventBio(UUID id, Long eventId, UUID currentUserId) {
        if (!isProfileAccessible(id, currentUserId)) {
            throw new IllegalArgumentException("Access denied");
        }
        EventBio eventBio = eventBioRepository.findByUserProfileUserIdAndEventId(id, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event bio not found"));
        return eventBioMapper.toDTO(eventBio);
    }

    @Transactional
    public BioDTO updateBio(UUID userId, Long bioId, BioDTO dto) {
        Bio bio = bioRepository.findById(bioId)
                .orElseThrow(() -> new IllegalArgumentException("Bio not found"));
        if (!bio.getUserProfile().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bio does not belong to user");
        }
        bio = bioMapper.toEntity(dto);
        bio.setUserProfile(userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found")));
        bioRepository.save(bio);
        return bioMapper.toDTO(bio);
    }

    @Transactional
    public EventBioDTO updateEventBio(UUID userId, Long eventId, EventBioDTO dto) {
        EventBio eventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event bio not found"));
        eventBio = eventBioMapper.toEntity(dto);
        eventBio.setUserProfile(userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found")));
        eventBio.setEvent(eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found")));
        eventBioRepository.save(eventBio);
        return eventBioMapper.toDTO(eventBio);
    }

    private boolean isProfileAccessible(UUID targetId, UUID currentUserId) {
        if (targetId.equals(currentUserId)) {
            return true;
        }
        // Check if connected
        if (connectionsRepository.findByUser1IdAndUser2IdAndUser1StatusAndUser2Status(currentUserId, targetId, "ACCEPTED", "ACCEPTED")
                .isPresent()) {
            return true;
        }
        // Check pending request
        if (connectionsRepository.findByUser1IdAndUser2IdAndUser1Status(currentUserId, targetId, "REQUESTED")
                .isPresent() ||
            connectionsRepository.findByUser1IdAndUser2IdAndUser1Status(targetId, currentUserId, "REQUESTED")
                .isPresent()) {
            return true;
        }
        // Check if recommended
        RecommendationsDTO recommendations = recommendationService.getRecommendations(currentUserId);
        return recommendations.userIds().contains(targetId);
    }

    private boolean isConnected(UUID user1Id, UUID user2Id) {
        return connectionsRepository.findByUser1IdAndUser2IdAndUser1StatusAndUser2Status(user1Id, user2Id, "ACCEPTED", "ACCEPTED")
                .isPresent();
    }
}