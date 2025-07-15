package com.matchme.service;

import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
public class PresenceService {
    private final Set<UUID> onlineUsers = new HashSet<>();

    public void setUserOnline(UUID userId) {
        onlineUsers.add(userId);
    }

    public void setUserOffline(UUID userId) {
        onlineUsers.remove(userId);
    }

    public boolean isUserOnline(UUID userId) {
        return onlineUsers.contains(userId);
    }
}
