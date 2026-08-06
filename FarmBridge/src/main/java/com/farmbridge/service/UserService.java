package com.farmbridge.service;

import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getUserById(Long id);

    List<UserResponse> getAllUsers();

    UserResponse updateUser(Long id, UserRequest request);

    void deleteUser(Long id);

    // Deactivates with the acting user's email so self-deactivation can be
    // blocked (admin policy: block self + last active admin).
    void deleteUser(Long id, String actingEmail);

    UserResponse activateUser(Long id);
}
