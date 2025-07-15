package com.matchme.service;

import com.matchme.dto.UserProfileDTO;
import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.BioDTO;
import com.matchme.dto.EventBioDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.dto.EventSelectionDTO;
import com.matchme.dto.MatchDTO;
import com.matchme.model.User;
import com.matchme.model.UserProfile;
import com.matchme.model.Event;
import com.matchme.model.Bio;
import com.matchme.model.EventBio;
import com.matchme.model.CommitmentLevel;
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

import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

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

    public List<BioDTO> getMyBios(UUID userId) {
        List<Bio> bios = bioRepository.findAllByUserProfileUserId(userId);
        return bios.stream().map(bioMapper::toDTO).collect(Collectors.toList());
    }

    public EventBioDTO getMyEventBio(UUID userId, Long eventId) {
        EventBio eventBio = eventBioRepository.findByUserProfileUserIdAndEventId(userId, eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event bio not found"));
        return eventBioMapper.toDTO(eventBio);
    }

    @Transactional
    public BioDTO createBio(UUID userId, BioDTO dto) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found"));
        Bio bio = bioMapper.toEntity(dto);
        bio.setUserProfile(userProfile);
        bioRepository.save(bio);
        return bioMapper.toDTO(bio);
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

    @Transactional
    public DetailedProfileDTO updateProfilePicture(UUID userId, ProfilePictureDTO dto) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        userProfileMapper.toEntity(dto, profile);
        profile.setUpdatedAt(LocalDateTime.now());
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
        Event event = eventRepository.findById(dto.eventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found"));

        // Check if event is already associated
        if (userProfile.getEvents().stream().anyMatch(e -> e.getId().equals(dto.eventId()))) {
                throw new IllegalArgumentException("User is already associated with this event");
        }

        // Add event to user profile
        userProfile.getEvents().add(event);

        // Set as active event if specified
        if (dto.isActive()) {
            userProfile.setActiveEvent(event);
        }

        // Create new EventBio
        EventBio eventBio = new EventBio();
        eventBio.setUserProfile(userProfile);
        eventBio.setEvent(event);
        eventBio.setMotivation(PrimaryMotivation.Social);
        eventBio.setCommitmentLevel(CommitmentLevel.Casual);
        eventBio.setRoles("");
        eventBio.setLookingRoles("");
        eventBioRepository.save(eventBio);

        userProfileRepository.save(userProfile);
    }

    @Transactional
    public void setActiveEvent(UUID userId, Long eventId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        // Check if event is associated with user
        if (!userProfile.getEvents().stream().anyMatch(e -> e.getId().equals(eventId))) {
            throw new IllegalArgumentException("Event not associated with user");
        }

        userProfile.setActiveEvent(event);
        userProfileRepository.save(userProfile);
    }

    public List<MatchDTO> getMatches(UUID userId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("UserProfile not found"));
        if (userProfile.getActiveEvent() == null) {
            return List.of(); // No active event, no matches
        }
        Long eventId = userProfile.getActiveEvent().getId();
        List<MatchDTO> matchedUsers = userProfileRepository.findByActiveEventId(eventId)
                .stream()
                .filter(profile -> !profile.getUser().getId().equals(userId)) // Exclude self
                .map(profile -> new MatchDTO(
                    userProfileMapper.longToUuid(profile.getId()),
                    profile.getName(),
                    profile.getActiveEvent().getId()
                ))
                .collect(Collectors.toList());
        return matchedUsers;
    }
}