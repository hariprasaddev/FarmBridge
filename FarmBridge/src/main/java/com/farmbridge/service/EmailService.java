package com.farmbridge.service;

import com.farmbridge.entity.PasswordResetToken;
import com.farmbridge.entity.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    // Frontend password-reset page URL (configurable, defaults to the
    // local dev server — see application.properties).
    @Value("${app.reset-password-url:http://localhost:5173/reset-password}")
    private String resetPasswordUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Sends the password reset email to the given user for the given token.
    // Failures are logged but never thrown: the forgot-password response
    // must stay identical whether or not the email exists, and a
    // temporary mail outage must not break the request.
    public void sendPasswordResetEmail(User user, PasswordResetToken token) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(user.getEmail());
        message.setSubject("FarmBridge Password Reset");

        message.setText(
                "Hello " + user.getName() + ",\n\n"
                + "Click below to reset your password.\n\n"
                + resetPasswordUrl + "?token=" + token.getToken() + "\n\n"
                + "This link expires in 15 minutes.\n\n"
                + "Ignore this email if you did not request it."
        );

        try {
            mailSender.send(message);
            logger.info("Password reset email sent to {}", user.getEmail());
        } catch (MailException ex) {
            logger.warn(
                    "Could not send password reset email to {}: {}",
                    user.getEmail(),
                    ex.getMessage()
            );
        }
    }
}
