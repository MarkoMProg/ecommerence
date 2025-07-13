package com.matchme.mapper;

import com.matchme.dto.AuthRequestDTO;
import com.matchme.dto.UserDTO;
import com.matchme.dto.UserProfileDTO;
import com.matchme.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "passwordHash", source = "password") // Password hashing handled in service
    User toEntity(AuthRequestDTO dto);

    @Mapping(target = "email", expression = "java(user.getEmail())") // Email only for owner
    UserDTO toUserDTO(User user);

    UserProfileDTO toUserProfileDTO(User user);
}
