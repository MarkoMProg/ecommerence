package com.matchme.service;

import com.matchme.dto.EventDTO;
import com.matchme.dto.EventInputDTO;
import com.matchme.dto.EventsDTO;
import com.matchme.model.Event;
import com.matchme.mapper.EventMapper;
import com.matchme.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {
    @Autowired
    private EventMapper eventMapper;
    @Autowired
    private EventRepository eventRepository;

    public EventsDTO getEvents() {
        List<Event> events = eventRepository.findAll();
        return new EventsDTO(events.stream().map(eventMapper::toDTO).collect(Collectors.toList()));
    }

    @Transactional
    public EventDTO createEvent(EventInputDTO dto) {
        Event event = eventMapper.toEntity(dto);
        eventRepository.save(event);
        return eventMapper.toDTO(event);
    }

    @Transactional
    public EventDTO updateEvent(Long id, EventInputDTO dto) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        eventMapper.updateEntity(dto, event);
        eventRepository.save(event);
        return eventMapper.toDTO(event);
    }

    @Transactional
    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        eventRepository.delete(event);
    }
}
