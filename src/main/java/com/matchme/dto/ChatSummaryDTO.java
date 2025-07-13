package com.matchme.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatSummaryDTO(UUID userId, String lastMessage, LocalDateTime timestamp) {}
