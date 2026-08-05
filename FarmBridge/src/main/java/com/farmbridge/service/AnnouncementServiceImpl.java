package com.farmbridge.service;

import com.farmbridge.dto.AnnouncementRequest;
import com.farmbridge.dto.AnnouncementResponse;
import com.farmbridge.entity.Announcement;
import com.farmbridge.entity.AnnouncementAudience;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.repository.AnnouncementRepository;
import com.farmbridge.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AnnouncementServiceImpl
        implements AnnouncementService {

    private static final Logger logger =
            LoggerFactory.getLogger(AnnouncementServiceImpl.class);

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public AnnouncementServiceImpl(
            AnnouncementRepository announcementRepository,
            UserRepository userRepository,
            EmailService emailService) {

        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // ==========================================
    // SEND ANNOUNCEMENT
    // ==========================================

    @Override
    @Transactional
    public AnnouncementResponse sendAnnouncement(
            AnnouncementRequest request,
            String adminEmail) {

        List<User> recipients = resolveRecipients(request.getAudience());

        // Email every matching user. Each send is best-effort inside
        // EmailService (logged, never thrown) — a failure for one user
        // must never stop the remaining emails.
        for (User user : recipients) {
            try {
                emailService.sendAnnouncement(
                        user,
                        request.getSubject(),
                        request.getMessage(),
                        request.getButtonText(),
                        request.getButtonUrl()
                );
            } catch (Exception ex) {
                // Extra safety net — EmailService already swallows mail
                // failures, but never let one recipient break the loop.
                logger.warn(
                        "Announcement to {} failed: {}",
                        user.getEmail(),
                        ex.getMessage()
                );
            }
        }

        // Record the broadcast for the admin history
        Announcement record = new Announcement();
        record.setAudience(request.getAudience());
        record.setSubject(request.getSubject());
        record.setMessage(request.getMessage());
        record.setButtonText(request.getButtonText());
        record.setButtonUrl(request.getButtonUrl());
        record.setRecipientCount(recipients.size());
        record.setSentBy(adminEmail);

        Announcement saved = announcementRepository.save(record);

        return toResponse(saved);
    }

    // ==========================================
    // HISTORY
    // ==========================================

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements() {

        return announcementRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ==========================================
    // HELPERS
    // ==========================================

    private List<User> resolveRecipients(AnnouncementAudience audience) {
        if (audience == AnnouncementAudience.BUYERS) {
            return userRepository.findByRole(Role.BUYER);
        }
        if (audience == AnnouncementAudience.FARMERS) {
            return userRepository.findByRole(Role.FARMER);
        }
        return userRepository.findAll();
    }

    private AnnouncementResponse toResponse(Announcement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getAudience().name(),
                a.getSubject(),
                a.getMessage(),
                a.getButtonText(),
                a.getButtonUrl(),
                a.getRecipientCount(),
                a.getSentBy(),
                a.getCreatedAt()
        );
    }
}
