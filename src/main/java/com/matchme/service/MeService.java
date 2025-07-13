package com.matchme.service;

import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.dto.EventSelectionDTO;
import com.matchme.model.User;
import com.matchme.model.UserProfile;
import com.matchme.model.Event;
import com.matchme.model.Bio;
import com.matchme.model.CommitmentLevel;
import com.matchme.model.EventBio;
import com.matchme.model.PrimaryMotivation;
import com.matchme.mapper.UserMapper;
import com.matchme.mapper.UserProfileMapper;
import com.matchme.mapper.BioMapper;
import com.matchme.mapper.EventBioMapper;
import com.matchme.repository.UserRepository;
import com.matchme.repository.UserProfileRepository;
import com.matchme.repository.BioRepository;
import com.matchme.repository.EventBioRepository;
import com.matchme.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class MeService {
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

    public UserProfileDTO getMe(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return userMapper.toUserProfileDTO(user);
    }

    public DetailedProfileDTO getMyProfile(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        return userProfileMapper.toDTO(profile);
    }

    public BioDTO getMyBio(UUID userId) {
        Bio bio = bioRepository.findByUserProfileUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Bio not found"));
        return bioMapper.toDTO(bio);
    }

    public EventBioDTO getMyEventBio(UUID userId, Long eventId) {
        EventBio eventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event bio not found"));
        return eventBioMapper.toDTO(eventBio);
    }

    @Transactional
    public BioDTO updateBio(UUID userId, BioDTO dto) {
        Bio bio = bioRepository.findByUserProfileUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Bio not found"));
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

    @Transactional
    public DetailedProfileDTO updateProfilePicture(UUID userId, ProfilePictureDTO dto) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        profile = userProfileMapper.toEntity(dto, profile);
        userProfileRepository.save(profile);
        return userProfileMapper.toDTO(profile);
    }

    @Transactional
    public void deleteProfilePicture(UUID userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        profile.setImgLink(null);
        userProfileRepository.save(profile);
    }

        @Transactional
    public void setEvent(UUID userId, EventSelectionDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Event event = eventRepository.findById(dto.eventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found"));

        // Check if EventBio already exists
        Optional<EventBio> existingEventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userId, dto.eventId());
        if (existingEventBio.isPresent()) {
            throw new IllegalArgumentException("User is already associated with this event");
        }

        // Create new EventBio to associate user with event
        EventBio eventBio = new EventBio();
        eventBio.setUserProfile(userProfile);
        eventBio.setEvent(event);
        // Set default values for motivation, commitmentLevel, roles, lookingRoles
        eventBio.setMotivation(PrimaryMotivation.Social); // Default
        eventBio.setCommitmentLevel(CommitmentLevel.Casual); // Default
        eventBio.setRoles("");
        eventBio.setLookingRoles("");
        eventBioRepository.save(eventBio);
    }
}