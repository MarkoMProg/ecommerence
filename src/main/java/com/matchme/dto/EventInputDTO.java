package com.matchme.dto;

import java.time.LocalDateTime;

public record EventInputDTO(String name, String location, LocalDateTime time) {}
