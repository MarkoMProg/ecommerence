package com.matchme.service;

import com.matchme.dto.ConnectionActionDTO;
import com.matchme.dto.UserIdListDTO;
import com.matchme.model.Connections;
import com.matchme.mapper.ConnectionMapper;
import com.matchme.repository.ConnectionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
public class ConnectionService {
    @Autowired
    private ConnectionMapper connectionMapper;
    @Autowired
    private ConnectionsRepository connectionsRepository;


    public UserIdListDTO getConnections(UUID userId) {
        List<Connections> connections = connectionsRepository.findByUserIdAndStatus(userId, "ACCEPTED");
        return connectionMapper.toConnectionsDTO(connections, userId);
    }

    public UserIdListDTO getIncomingRequests(UUID userId) {
        List<Connections> requests = connectionsRepository.findByUser2IdAndUser2Status(userId, "PENDING");
        return connectionMapper.toRequestsDTO(requests);
    }

    public UserIdListDTO getOutgoingRequests(UUID userId) {
        List<Connections> requests = connectionsRepository.findByUser1IdAndUser1Status(userId, "REQUESTED");
        return connectionMapper.toRequestsDTO(requests);
    }

    @Transactional
    public void sendConnectionRequest(UUID userId, ConnectionActionDTO dto) {
        Optional<Connections> existingConnection = connectionsRepository.findByUser1IdAndUser2Id(userId, dto.userId())
                .or(() -> connectionsRepository.findByUser1IdAndUser2Id(dto.userId(), userId));
        if (existingConnection.isPresent()) {
            throw new IllegalStateException("Connection already exists");
        }
        Connections connection = connectionMapper.toConnectionEntity(dto, userId);
        connectionsRepository.save(connection);
    }

    @Transactional
    public void acceptConnectionRequest(UUID userId, ConnectionActionDTO dto) {
        Connections connection = connectionsRepository.findByUser1IdAndUser2Id(dto.userId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        connection.setUser2Status("ACCEPTED");
        connectionsRepository.save(connection);
    }

    @Transactional
    public void rejectConnectionRequest(UUID userId, ConnectionActionDTO dto) {
        Connections connection = connectionsRepository.findByUser1IdAndUser2Id(dto.userId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        connection.setUser2Status("REJECTED");
        connectionsRepository.save(connection);
    }
    
}
