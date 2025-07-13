package com.matchme.mapper;

import com.matchme.dto.EventDTO;
import com.matchme.dto.EventInputDTO;
import com.matchme.model.Event;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EventMapper {
    EventDTO toDTO(Event event);

    Event toEntity(EventInputDTO dto);

    @Mapping(target = "id", ignore = true) // Ignore ID for updates
    Event updateEntity(EventInputDTO dto, Event existingEvent);
}
