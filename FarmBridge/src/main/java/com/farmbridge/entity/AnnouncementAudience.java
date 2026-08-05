package com.farmbridge.entity;

/**
 * Target audience of an admin announcement email.
 * ALL = every registered user, BUYERS / FARMERS = that role only.
 */
public enum AnnouncementAudience {
    ALL,
    BUYERS,
    FARMERS
}
