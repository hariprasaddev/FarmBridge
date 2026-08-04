package com.farmbridge.repository;

import com.farmbridge.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FarmerProfileRepository
        extends JpaRepository<FarmerProfile, Long> {

    // Find a farmer profile by the associated user's email
    Optional<FarmerProfile> findByUserEmail(String email);

    // Batch lookup — used to avoid one query per product when
    // building ProductResponse lists (prevents N+1).
    List<FarmerProfile> findByUserEmailIn(Collection<String> emails);
}