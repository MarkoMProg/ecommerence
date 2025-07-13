package com.matchme.controller;

import com.matchme.dto.ChatHistoryDTO;
import com.matchme.dto.ChatMessageDTO;
import com.matchme.dto.ChatsDTO;
import com.matchme.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/chats")
public class ChatsController {
    @Autowired
    private ChatService chatService;

    @GetMapping
    public ResponseEntity<ChatsDTO> getChats(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(chatService.getChats(userId));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ChatHistoryDTO> getChatHistory(
            @AuthenticationPrincipal UUID currentUserId,
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(chatService.getChatHistory(currentUserId, userId, page, size));
    }

    @PostMapping("/{userId}/messages")
    public ResponseEntity<ChatMessageDTO> sendMessage(
            @AuthenticationPrincipal UUID currentUserId,
            @PathVariable UUID userId,
            @RequestBody ChatMessageDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.sendMessage(currentUserId, userId, dto));
    }

    @PutMapping("/{userId}/read")
    public ResponseEntity<Void> markChatAsRead(
            @AuthenticationPrincipal UUID currentUserId,
            @PathVariable UUID userId) {
        chatService.markChatAsRead(currentUserId, userId);
        return ResponseEntity.noContent().build();
    }
}