package com.matchme.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DetailedProfileDTO(
    UUID id,
    String name,
    String imgLink,
    String aboutMe,
    boolean isFurry,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
