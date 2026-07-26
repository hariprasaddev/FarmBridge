package com.farmbridge.repository;

import com.farmbridge.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerProfileRepository
        extends JpaRepository<FarmerProfile, Long> {
}