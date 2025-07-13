package com.matchme.mapper;

import com.matchme.dto.BioDTO;
import com.matchme.model.Bio;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BioMapper {
    BioDTO toDTO(Bio bio);

    Bio toEntity(BioDTO dto); // Reusing BioDTO for updates
}

