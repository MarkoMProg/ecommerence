package com.matchme.dto;

import java.util.UUID;

public record UserProfileDTO(UUID id, String name, String profileLink) {}
