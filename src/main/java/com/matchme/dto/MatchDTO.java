package com.matchme.dto;

import java.util.UUID;

public record MatchDTO(UUID userId, String name, Long activeEventId,int score) {
    public MatchDTO(UUID userId, String name, Long activeEventId) {
        this(userId, name, activeEventId, 0);
    }
}
