package com.matchme.dto;

import com.matchme.model.PrimaryMotivation;
import com.matchme.model.CommitmentLevel;

public record EventBioDTO(
        //Long id,
        PrimaryMotivation motivation,
        CommitmentLevel commitmentLevel,
        String roles,
        String lookingRoles
) {
}