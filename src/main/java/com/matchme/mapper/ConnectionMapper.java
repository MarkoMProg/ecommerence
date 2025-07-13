package com.matchme.mapper;

import com.matchme.dto.ConnectionActionDTO;
import com.matchme.dto.UserIdListDTO;
import com.matchme.model.Connections;
import com.matchme.model.User;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface ConnectionMapper {
    default UserIdListDTO toConnectionsDTO(List<Connections> connections, UUID currentUserId) {
        List<UUID> userIds = connections.stream()
                .map(conn -> conn.getUser1().getId().equals(currentUserId) ? conn.getUser2().getId() : conn.getUser1().getId())
                .toList();
        return new UserIdListDTO(userIds);
    }

    default UserIdListDTO toRequestsDTO(List<Connections> connections) {
        List<UUID> userIds = connections.stream()
                .map(conn -> conn.getUser1().getId())
                .toList();
        return new UserIdListDTO(userIds);
    }

    default Connections toConnectionEntity(ConnectionActionDTO dto, UUID currentUserId) {
        Connections conn = new Connections();
        conn.setUser1(new User() {{ setId(currentUserId); }});
        conn.setUser2(new User() {{ setId(dto.userId()); }});
        conn.setUser1Status(dto.action() != null ? dto.action() : "REQUESTED");
        conn.setUser2Status("PENDING");
        conn.setDatetime(java.time.LocalDateTime.now());
        return conn;
    }
}
