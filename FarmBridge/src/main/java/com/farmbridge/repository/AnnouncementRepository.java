package com.farmbridge.repository;

import com.farmbridge.entity.Announcement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository
        extends JpaRepository<Announcement, Long> {

    // Announcement history, newest first
    List<Announcement> findAllByOrderByCreatedAtDesc();
}
