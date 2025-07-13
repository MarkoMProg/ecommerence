package com.matchme.service;

import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
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
import com.matchme.repository.EventBioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
    

    public UserProfileDTO getUserProfile(UUID id, UUID currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        // Check if user is allowed to see profile (connected, recommended, or self)
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

    public BioDTO getBio(UUID id, UUID currentUserId) {
        Bio bio = bioRepository.findByUserProfileUserId(id)
                .orElseThrow(() -> new IllegalArgumentException("Bio not found"));
        if (!isProfileAccessible(id, currentUserId)) {
            throw new IllegalArgumentException("Access denied");
        }
        return bioMapper.toDTO(bio);
    }

    public EventBioDTO getEventBio(UUID id, Long eventId, UUID currentUserId) {
        EventBio eventBio = eventBioRepository.findByUserProfileUserIdAndEventId(id, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event bio not found"));
        if (!isProfileAccessible(id, currentUserId)) {
            throw new IllegalArgumentException("Access denied");
        }
        return eventBioMapper.toDTO(eventBio);
    }

    @Transactional
    public BioDTO updateBio(UUID userId, BioDTO dto) {
        Bio bio = bioRepository.findByUserProfileUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Bio not found"));
        bio = bioMapper.toEntity(dto);
        bioRepository.save(bio);
        return bioMapper.toDTO(bio);
    }

    @Transactional
    public EventBioDTO updateEventBio(UUID userId, Long eventId, EventBioDTO dto) {
        EventBio eventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event bio not found"));
        eventBio = eventBioMapper.toEntity(dto);
        eventBioRepository.save(eventBio);
        return eventBioMapper.toDTO(eventBio);
    }

    private boolean isProfileAccessible(UUID targetId, UUID currentUserId) {
        // Implement logic: self, connected, recommended, or pending connection
        return targetId.equals(currentUserId) || isConnected(targetId, currentUserId);
    }

    private boolean isConnected(UUID user1Id, UUID user2Id) {
        // Check connection status in Connections table
        return false; // Placeholder
    }
}
