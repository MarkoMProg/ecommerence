package com.matchme.dto;

import java.util.UUID;
import java.util.List;


public record DetailedProfileDTO(
    UUID id,
    String name,
    String imgLink,
    String aboutMe,
    Boolean isFurry,
    List<Long> bioIds,
    List<Long> eventIds,
    Long activeEventId
) {}
