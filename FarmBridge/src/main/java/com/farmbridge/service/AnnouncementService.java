package com.farmbridge.service;

import com.farmbridge.dto.AnnouncementRequest;
import com.farmbridge.dto.AnnouncementResponse;

import java.util.List;

public interface AnnouncementService {

    /**
     * Emails every user matching the requested audience (ALL, BUYERS or
     * FARMERS) and records the announcement for the admin history.
     * A failure for one recipient never stops the remaining emails.
     *
     * @return the stored announcement record
     */
    AnnouncementResponse sendAnnouncement(
            AnnouncementRequest request,
            String adminEmail
    );

    /**
     * History of every announcement sent, newest first.
     */
    List<AnnouncementResponse> getAnnouncements();
}
