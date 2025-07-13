package com.matchme.dto;

import java.time.LocalDateTime;

public record EventDTO(Long id, String name, String location, LocalDateTime time) {}