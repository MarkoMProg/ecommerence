package com.matchme.dto;

import java.util.List;
import java.util.UUID;

public record RecommendationsDTO(List<UUID> userIds) {}