package com.matchme.mapper;

import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.model.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    @Mapping(target = "id", source = "id", qualifiedByName = "longToUuid")
    DetailedProfileDTO toDTO(UserProfile userProfile);

    @Mapping(target = "imgLink", source = "dto.image")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "name", ignore = true)
    @Mapping(target = "aboutMe", ignore = true)
    @Mapping(target = "isFurry", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "bio", ignore = true)
    UserProfile toEntity(ProfilePictureDTO dto, @MappingTarget UserProfile profile);

    @Named("longToUuid")
    default UUID longToUuid(Long id) {
        return id != null ? UUID.nameUUIDFromBytes(id.toString().getBytes()) : null;
    }
}