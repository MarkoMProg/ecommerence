package com.matchme.controller;

import com.matchme.dto.ConnectionActionDTO;
import com.matchme.dto.UserIdListDTO;
import com.matchme.service.ConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


import java.util.UUID;

@RestController
@RequestMapping("/connections")
public class ConnectionsController {
    @Autowired
    private ConnectionService connectionService;

    @GetMapping
    public ResponseEntity<UserIdListDTO> getConnections(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(connectionService.getConnections(userId));
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<UserIdListDTO> getIncomingRequests(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(connectionService.getIncomingRequests(userId));
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<UserIdListDTO> getOutgoingRequests(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(connectionService.getOutgoingRequests(userId));
    }

    @PostMapping
    public ResponseEntity<Void> sendConnectionRequest(@AuthenticationPrincipal UUID userId, @RequestBody ConnectionActionDTO dto) {
        connectionService.sendConnectionRequest(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Void> acceptConnectionRequest(@AuthenticationPrincipal UUID userId, @PathVariable UUID id, @RequestBody ConnectionActionDTO dto) {
        connectionService.acceptConnectionRequest(userId, dto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> rejectConnectionRequest(@AuthenticationPrincipal UUID userId, @PathVariable UUID id, @RequestBody ConnectionActionDTO dto) {
        connectionService.rejectConnectionRequest(userId, dto);
        return ResponseEntity.noContent().build();
    }
}