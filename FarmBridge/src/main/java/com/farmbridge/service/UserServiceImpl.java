package com.farmbridge.service;

import com.farmbridge.dto.UserRequest;
import com.farmbridge.dto.UserResponse;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserResponse getUserById(Long id) {

        User user = userRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + id)
                );

        return toUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {

        List<User> users = userRepository.findAll();

        return users.stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {

        User user = userRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + id)
                );

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {

            throw new RuntimeException(
                    "Email already in use: " + request.getEmail()
            );
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(request.getRole());

        User updatedUser = userRepository.save(user);

        return toUserResponse(updatedUser);
    }

    /**
     * ENTERPRISE SOFT DELETE.
     * The user is NEVER removed from the database. Their account is only
     * deactivated (active=false), which blocks login and every secured
     * endpoint while preserving all historical data (orders, reviews,
     * wishlist, notifications, products, analytics).
     */
    @Override
    @Transactional
    public void deleteUser(Long id) {

        deleteUser(id, null);
    }

    /**
     * Soft delete with the acting user's email for self-deactivation
     * protection. Admin policy: an admin cannot deactivate their own
     * account, and the last active ADMIN can never be deactivated —
     * otherwise the platform could be permanently locked out of /admin.
     */
    @Override
    @Transactional
    public void deleteUser(Long id, String actingEmail) {

        User user = userRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + id)
                );

        // Block self-deactivation
        if (actingEmail != null
                && user.getEmail().equalsIgnoreCase(actingEmail)) {
            throw new RuntimeException(
                    "You cannot deactivate your own account"
            );
        }

        // Block deactivating the last active admin
        if (user.getRole() == Role.ADMIN && user.isActive()) {

            long activeAdmins =
                    userRepository.countByRoleAndActive(
                            Role.ADMIN, true
                    );

            if (activeAdmins <= 1) {
                throw new RuntimeException(
                        "Cannot deactivate the last active admin account"
                );
            }
        }

        user.setActive(false);
        userRepository.save(user);
    }

    /**
     * Reactivate a previously deactivated account (active=true).
     * Restores full access — login and every secured endpoint.
     */
    @Override
    @Transactional
    public UserResponse activateUser(Long id) {

        User user = userRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found with id: " + id)
                );

        user.setActive(true);

        User updatedUser = userRepository.save(user);

        return toUserResponse(updatedUser);
    }

    // ==========================================
    // HELPER — Map entity to response DTO
    // ==========================================

    private UserResponse toUserResponse(User user) {

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive()
        );
    }
}
