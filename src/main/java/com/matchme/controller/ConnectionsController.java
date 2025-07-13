package com.matchme.controller;

import com.matchme.dto.ConnectionActionDTO;
import com.matchme.dto.UserIdListDTO;
import com.matchme.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.UUID;

@RestController
@RequestMapping("/connections")
public class ConnectionsController {
    @Autowired
    private ConnectionService connectionService;

    @GetMapping
    public ResponseEntity<UserIdListDTO> getConnections(@RequestHeader("User-Id") UUID userId) {
        return ResponseEntity.ok(connectionService.getConnections(userId));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<UserIdListDTO> getIncomingRequests(@RequestHeader("User-Id") UUID userId) {
        return ResponseEntity.ok(connectionService.getIncomingRequests(userId));
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<UserIdListDTO> getOutgoingRequests(@RequestHeader("User-Id") UUID userId) {
        return ResponseEntity.ok(connectionService.getOutgoingRequests(userId));
    }

    @PostMapping
    public ResponseEntity<Void> sendConnectionRequest(@RequestHeader("User-Id") UUID userId, @RequestBody ConnectionActionDTO dto) {
        connectionService.sendConnectionRequest(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Void> acceptConnectionRequest(@RequestHeader("User-Id") UUID userId, @PathVariable UUID id, @RequestBody ConnectionActionDTO dto) {
        connectionService.acceptConnectionRequest(userId, dto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> rejectConnectionRequest(@RequestHeader("User-Id") UUID userId, @PathVariable UUID id, @RequestBody ConnectionActionDTO dto) {
        connectionService.rejectConnectionRequest(userId, dto);
        return ResponseEntity.noContent().build();
    }
}