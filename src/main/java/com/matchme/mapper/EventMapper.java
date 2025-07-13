package com.matchme.mapper;

import com.matchme.dto.EventDTO;
import com.matchme.dto.EventInputDTO;
import com.matchme.model.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface EventMapper {
    // Remove all explicit mappings - MapStruct will auto-map identical field names
    EventDTO toDTO(Event event);

    @Mapping(target = "id", ignore = true)
    Event toEntity(EventInputDTO dto);

    @Mapping(target = "id", ignore = true)
    void updateEntity(EventInputDTO dto, @MappingTarget Event existingEvent);
}
