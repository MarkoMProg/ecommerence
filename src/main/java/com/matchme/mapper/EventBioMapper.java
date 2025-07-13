package com.matchme.mapper;

import com.matchme.dto.EventBioDTO;
import com.matchme.model.EventBio;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EventBioMapper {
    EventBioDTO toDTO(EventBio eventBio);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userProfile", ignore = true)
    @Mapping(target = "event", ignore = true)
    EventBio toEntity(EventBioDTO dto);
}