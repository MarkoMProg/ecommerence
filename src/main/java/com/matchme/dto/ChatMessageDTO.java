package com.matchme.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatMessageDTO(String message, LocalDateTime timestamp, UUID senderId, boolean isRead) {}