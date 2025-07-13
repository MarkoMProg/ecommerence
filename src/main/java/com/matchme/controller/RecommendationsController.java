package com.matchme.controller;


import com.matchme.dto.RecommendationsDTO;
import com.matchme.dto.DismissRecommendationDTO;
import com.matchme.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/recommendations")
public class RecommendationsController {
    @Autowired
    private RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<RecommendationsDTO> getRecommendations(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(userId));
    }

    @PostMapping("/dismiss")
    public ResponseEntity<Void> dismissRecommendation(@AuthenticationPrincipal UUID userId, @RequestBody DismissRecommendationDTO dto) {
        recommendationService.dismissRecommendation(userId, dto);
        return ResponseEntity.noContent().build();
    }
}