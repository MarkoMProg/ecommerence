package com.matchme.mapper;

import com.matchme.dto.DetailedProfileDTO;
import com.matchme.dto.ProfilePictureDTO;
import com.matchme.model.UserProfile;
import com.matchme.model.Bio;
import com.matchme.model.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    @Mapping(target = "id", source = "id", qualifiedByName = "longToUuid")
    @Mapping(target = "bioIds", source = "bios", qualifiedByName = "bioListToIds")
    @Mapping(target = "eventIds", source = "events", qualifiedByName = "eventListToIds")
    @Mapping(target = "activeEventId", source = "activeEvent.id")
    DetailedProfileDTO toDTO(UserProfile userProfile);

    @Mapping(target = "imgLink", source = "dto.image")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "name", ignore = true)
    @Mapping(target = "aboutMe", ignore = true)
    @Mapping(target = "isFurry", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "bios", ignore = true)
    @Mapping(target = "events", ignore = true)
    @Mapping(target = "activeEvent", ignore = true)
    UserProfile toEntity(ProfilePictureDTO dto, @MappingTarget UserProfile profile);

    @Named("longToUuid")
    default UUID longToUuid(Long id) {
        return id != null ? UUID.nameUUIDFromBytes(id.toString().getBytes()) : null;
    }

    @Named("bioListToIds")
    default List<Long> bioListToIds(List<Bio> bios) {
        return bios.stream().map(Bio::getId).collect(Collectors.toList());
    }

    @Named("eventListToIds")
    default List<Long> eventListToIds(List<Event> events) {
        return events.stream().map(Event::getId).collect(Collectors.toList());
    }
}