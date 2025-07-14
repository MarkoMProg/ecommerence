package com.matchme.mapper;

import com.matchme.dto.BioDTO;
import com.matchme.model.Bio;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BioMapper {
    BioDTO toDTO(Bio bio);

   @Mapping(target = "userProfile", ignore = true)
    Bio toEntity(BioDTO dto);
}
