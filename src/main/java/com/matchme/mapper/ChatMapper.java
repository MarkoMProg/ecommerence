package com.matchme.mapper;

import com.matchme.dto.ChatHistoryDTO;
import com.matchme.dto.ChatMessageDTO;
import com.matchme.dto.ChatSummaryDTO;
import com.matchme.dto.ChatsDTO;
import com.matchme.model.Chat;
import com.matchme.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ChatMapper {
    @Mapping(target = "senderId", source = "sender.id")
    ChatMessageDTO toChatMessageDTO(Chat chat);

    default ChatHistoryDTO toChatHistoryDTO(List<Chat> chats) {
        List<ChatMessageDTO> messages = chats.stream()
                .map(this::toChatMessageDTO)
                .toList();
        return new ChatHistoryDTO(messages);
    }

    default ChatsDTO toChatsDTO(List<Chat> chats, UUID currentUserId) {
        List<ChatSummaryDTO> summaries = chats.stream()
                .collect(Collectors.groupingBy(
                        chat -> chat.getUser1().getId().equals(currentUserId) ? chat.getUser2().getId() : chat.getUser1().getId(),
                        Collectors.maxBy(Comparator.comparing(chat -> chat.getTimestamp() != null ? chat.getTimestamp() : LocalDateTime.MIN))
                ))
                .entrySet().stream()
                .map(entry -> {
                    Chat latestChat = entry.getValue().orElse(null);
                    return new ChatSummaryDTO(
                            entry.getKey(),
                            latestChat != null ? latestChat.getMessage() : "",
                            latestChat != null ? latestChat.getTimestamp() : null
                    );
                })
                .filter(summary -> summary.timestamp() != null)
                .sorted((a, b) -> b.timestamp().compareTo(a.timestamp()))
                .toList();
        return new ChatsDTO(summaries);
    }

    default Chat toChatEntity(ChatMessageDTO dto, User sender, User user1, User user2) {
        Chat chat = new Chat();
        chat.setMessage(dto.message());
        chat.setTimestamp(dto.timestamp() != null ? dto.timestamp() : LocalDateTime.now());
        chat.setSender(sender);
        chat.setUser1(user1);
        chat.setUser2(user2);
        chat.setIsRead(dto.isRead());
        return chat;
    }
}