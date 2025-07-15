package com.matchme.controller;

import com.matchme.dto.ChatMessageDTO;
import com.matchme.service.ChatService;
import com.matchme.service.PresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
public class ChatWebSocketController {
    @Autowired
    private ChatService chatService;
    @Autowired
    private PresenceService presenceService;

    @MessageMapping("/chat/{userId}")
    @SendTo("/topic/chat/{userId}")
    public ChatMessageDTO sendMessage(@DestinationVariable UUID userId, 
                                     ChatMessageDTO dto, 
                                     SimpMessageHeaderAccessor headerAccessor) {
        UUID currentUserId = UUID.fromString(headerAccessor.getUser().getName());
        return chatService.sendMessage(currentUserId, userId, dto);
    }

    @MessageMapping("/presence/online")
    @SendTo("/topic/presence")
    public String setOnline(SimpMessageHeaderAccessor headerAccessor) {
        UUID userId = UUID.fromString(headerAccessor.getUser().getName());
        presenceService.setUserOnline(userId);
        return userId.toString();
    }

    @MessageMapping("/presence/offline")
    @SendTo("/topic/presence")
    public String setOffline(SimpMessageHeaderAccessor headerAccessor) {
        UUID userId = UUID.fromString(headerAccessor.getUser().getName());
        presenceService.setUserOffline(userId);
        return userId.toString();
    }

    @MessageMapping("/chat/{userId}/typing")
    @SendTo("/topic/chat/{userId}/typing")
    public String sendTyping(@DestinationVariable UUID userId, SimpMessageHeaderAccessor headerAccessor) {
        UUID currentUserId = UUID.fromString(headerAccessor.getUser().getName());
        return currentUserId.toString();
    }
}
