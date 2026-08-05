package com.farmbridge.repository;

import com.farmbridge.dto.MonthlyMetric;
import com.farmbridge.entity.User;
import com.farmbridge.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
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

    // Newest farmer accounts (id order == registration order)
    List<User> findTop5ByRoleOrderByIdDesc(Role role);

    // ==========================================
    // ANALYTICS — REGISTRATIONS
    // ==========================================

    // Monthly FARMER registrations — one grouped query for the
    // farmer-registrations line chart (value = count).
    @Query("""
            SELECT NEW com.farmbridge.dto.MonthlyMetric(
                   YEAR(u.createdAt), MONTH(u.createdAt),
                   COUNT(u), COUNT(u))
            FROM User u
            WHERE u.role = com.farmbridge.entity.Role.FARMER
              AND u.createdAt IS NOT NULL
            GROUP BY YEAR(u.createdAt), MONTH(u.createdAt)
            """)
    List<MonthlyMetric> findMonthlyFarmerRegistrations();
}
