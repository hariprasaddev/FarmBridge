package com.farmbridge.service;

import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UserRequest request);

    void deleteUser(Long id);
}
