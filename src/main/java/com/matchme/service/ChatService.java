package com.matchme.service;

import com.matchme.dto.ChatHistoryDTO;
import com.matchme.dto.ChatMessageDTO;
import com.matchme.dto.ChatsDTO;
import com.matchme.model.Chat;
import com.matchme.model.User;
import com.matchme.mapper.ChatMapper;
import com.matchme.repository.ChatRepository;
import com.matchme.repository.UserRepository;
import com.matchme.repository.ConnectionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ChatService {
    @Autowired
    private ChatMapper chatMapper;
    @Autowired
    private ChatRepository chatRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ConnectionsRepository connectionsRepository;

    public ChatsDTO getChats(UUID currentUserId) {
        List<Chat> chats = chatRepository.findByUser1IdOrUser2Id(currentUserId, currentUserId);
        return chatMapper.toChatsDTO(chats, currentUserId);
    }

    public ChatHistoryDTO getChatHistory(UUID currentUserId, UUID otherUserId, int page, int size) {
        if (!isConnected(currentUserId, otherUserId)) {
            throw new IllegalArgumentException("Users not connected");
        }
        PageRequest pageRequest = PageRequest.of(page, size);
        List<Chat> chats = chatRepository.findByUserPair(currentUserId, otherUserId, pageRequest);
        return chatMapper.toChatHistoryDTO(chats);
    }

    @Transactional
    public ChatMessageDTO sendMessage(UUID currentUserId, UUID recipientId, ChatMessageDTO dto) {
        if (!isConnected(currentUserId, recipientId)) {
            throw new IllegalArgumentException("Users not connected");
        }
        User sender = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User user1 = sender;
        User user2 = userRepository.findById(recipientId)
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));
        Chat chat = chatMapper.toChatEntity(dto, sender, user1, user2);
        chatRepository.save(chat);
        return chatMapper.toChatMessageDTO(chat);
    }

    @Transactional
    public void markChatAsRead(UUID currentUserId, UUID otherUserId) {
        List<Chat> chats = chatRepository.findByUserPairAndIsReadFalse(currentUserId, otherUserId);
        chats.forEach(chat -> chat.setIsRead(true));
        chatRepository.saveAll(chats);
    }

    private boolean isConnected(UUID user1Id, UUID user2Id) {
        return connectionsRepository.findByUser1IdAndUser2IdAndStatus(user1Id, user2Id, "ACCEPTED")
                .isPresent();
    }
}
