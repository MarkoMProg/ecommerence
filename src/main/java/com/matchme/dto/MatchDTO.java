package com.matchme.dto;

import java.util.UUID;

public record MatchDTO(UUID userId, String name, Long activeEventId) {}
