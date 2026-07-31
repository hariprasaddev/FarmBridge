package com.farmbridge.repository;

import com.farmbridge.entity.User;
import com.farmbridge.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository
        extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    // Find all users with a specific role
    List<User> findByRole(Role role);

    // Count users with a specific role
    long countByRole(Role role);
}