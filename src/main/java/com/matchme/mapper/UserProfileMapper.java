package com.matchme.mapper;

import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.model.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    DetailedProfileDTO toDTO(UserProfile userProfile);

    @Mapping(target = "imgLink", source = "image")
    @Mapping(target = "id", ignore = true) // ID set by DB or existing entity
    @Mapping(target = "name", ignore = true)
    @Mapping(target = "aboutMe", ignore = true)
    @Mapping(target = "isFurry", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    UserProfile toEntity(ProfilePictureDTO dto, UserProfile existingProfile);
}

