package com.farmbridge.service;

import com.farmbridge.entity.Order;
import com.farmbridge.entity.PasswordResetToken;
import com.farmbridge.entity.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

/**
 * Enterprise email service.
 *
 * Every notification is rendered from ONE reusable HTML template
 * (green FarmBridge branding, responsive, action button + footer).
 * All sending is best-effort: a mail outage is logged and swallowed,
 * exactly like the password-reset flow — business logic is never
 * rolled back because an email could not be delivered.
 */
@Service
public class EmailService {

    private static final Logger logger =
            LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    // Frontend base URL used to build deep links inside emails.
    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    // Support email shown in the footer of every template.
    @Value("${app.support-email:support@farmbridge.com}")
    private String supportEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ============================================================
    // LOW-LEVEL SEND — failure-safe, never throws
    // ============================================================

    private void sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, "UTF-8"
            );
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true); // true = HTML body
            mailSender.send(message);
            logger.info("Email '{}' sent to {}", subject, to);
        } catch (Exception ex) {
            // REQUIREMENT: an email failure must NEVER break business
            // logic, so every failure (mail outage, misconfiguration or
            // any unexpected runtime error from the mail stack) is logged
            // and swallowed. Exactly like the password-reset flow.
            logger.warn(
                    "Could not send email '{}' to {}: {}",
                    subject,
                    to,
                    ex.getMessage()
            );
        }
    }

    // ============================================================
    // REUSABLE HTML TEMPLATE (single source of truth)
    // ============================================================

    /**
     * Wraps a message block in the professional FarmBridge email shell:
     * header with logo, title, message, optional action button, footer
     * with support email + copyright + social placeholders.
     *
     * @param title      subject-line title shown in the header
     * @param messageHtml the body content (already HTML)
     * @param buttonText optional action-button label (null → no button)
     * @param buttonUrl  optional action-button target
     */
    private String buildTemplate(
            String title,
            String messageHtml,
            String buttonText,
            String buttonUrl) {

        String button = "";
        if (buttonText != null && buttonUrl != null) {
            button =
                    "<p style=\"text-align:center;margin:28px 0 8px;\">"
                    + "<a href=\"" + escapeHtml(buttonUrl) + "\" style=\""
                    + "display:inline-block;background:#16a34a;color:#ffffff;"
                    + "text-decoration:none;padding:12px 28px;border-radius:8px;"
                    + "font-size:14px;font-weight:600;"
                    + "box-shadow:0 2px 8px rgba(22,163,74,0.25);\">"
                    + escapeHtml(buttonText) + "</a></p>";
        }

        return "<!DOCTYPE html>"
                + "<html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">"
                + "<head><meta charset=\"utf-8\"/>"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>"
                + "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\"/>"
                + "<title>" + escapeHtml(title) + "</title></head>"
                + "<body style=\"margin:0;padding:0;background:#f3f6f4;"
                + "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"background:#f3f6f4;padding:24px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" width=\"600\" cellpadding=\"0\" cellspacing=\"0\" "
                + "style=\"max-width:600px;width:100%;background:#ffffff;border-radius:12px;"
                + "overflow:hidden;border:1px solid #e3e9e5;\">"
                // ---- header ----
                + "<tr><td style=\"background:#0f3d2e;padding:22px 32px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr><td align=\"left\">"
                + "<span style=\"color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.3px;\">"
                + "🌱 FarmBridge</span>"
                + "<span style=\"color:#7dd3a8;font-size:11px;display:block;margin-top:2px;"
                + "letter-spacing:1px;\">FRESH FROM THE FARM</span>"
                + "</td></tr></table></td></tr>"
                // ---- title ----
                + "<tr><td style=\"padding:30px 32px 4px;\">"
                + "<h1 style=\"margin:0;font-size:20px;color:#0f3d2e;font-weight:700;\">"
                + escapeHtml(title) + "</h1></td></tr>"
                // ---- message ----
                + "<tr><td style=\"padding:14px 32px 4px;color:#334155;font-size:14px;"
                + "line-height:1.65;\">" + messageHtml + "</td></tr>"
                // ---- button ----
                + (button.isEmpty() ? "" :
                        "<tr><td style=\"padding:0 32px;\">" + button + "</td></tr>")
                // ---- footer ----
                + "<tr><td style=\"padding:22px 32px 26px;\">"
                + "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">"
                + "<tr><td style=\"border-top:1px solid #eef2ef;padding-top:18px;text-align:center;\">"
                + "<p style=\"margin:0 0 6px;font-size:12px;color:#64748b;\">"
                + "Questions? Contact us at "
                + "<a href=\"mailto:" + supportEmail + "\" style=\"color:#16a34a;text-decoration:none;\">"
                + supportEmail + "</a></p>"
                + "<p style=\"margin:0 0 10px;font-size:11px;color:#94a3b8;\">"
                + "© " + java.time.Year.now().getValue() + " FarmBridge · "
                + "Fresh produce from verified farmers</p>"
                + "<p style=\"margin:0;font-size:16px;letter-spacing:6px;color:#94a3b8;\">"
                + "𝕏&nbsp;|&nbsp;📘&nbsp;|&nbsp;📸</p>"
                + "</td></tr></table></td></tr>"
                + "</table></td></tr></table></body></html>";
    }

    private static String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    // Small, safe inline helper for simple paragraph text.
    private static String para(String text) {
        return "<p style=\"margin:0 0 10px;\">"
                + escapeHtml(text == null ? "" : text) + "</p>";
    }

    // ============================================================
    // WELCOME
    // ============================================================

    public void sendWelcomeEmail(User user) {
        String message = para("Hello " + userName(user) + ",")
                + para("Welcome to FarmBridge — India's marketplace for fresh "
                        + "produce, straight from verified farmers.")
                + para("You can now explore the marketplace and discover "
                        + "farm-fresh fruits, vegetables, grains and more.");

        sendHtml(
                user.getEmail(),
                "Welcome to FarmBridge",
                buildTemplate(
                        "Welcome to FarmBridge 🌾",
                        message,
                        user.getRole() != null
                                && user.getRole().name().equals("FARMER")
                                ? "Go to My Dashboard"
                                : "Start Exploring",
                        baseUrl + "/login"
                )
        );
    }

    // ============================================================
    // FARMER VERIFICATION
    // ============================================================

    public void sendVerificationApproved(User user, String farmName) {
        String message = para("Congratulations " + userName(user) + "! 🎉")
                + para("Your farm account"
                        + (farmName != null && !farmName.isBlank()
                                ? " for <strong>" + escapeHtml(farmName) + "</strong>"
                                : "")
                        + " has been verified.")
                + para("You can now:")
                + "<ul style=\"margin:0 0 12px;padding-left:20px;color:#334155;\">"
                + "<li>Create and list products</li>"
                + "<li>Receive orders from buyers</li>"
                + "<li>Sell your fresh produce across the marketplace</li>"
                + "</ul>";

        sendHtml(
                user.getEmail(),
                "Your FarmBridge account has been approved",
                buildTemplate(
                        "Your FarmBridge account has been approved ✅",
                        message,
                        "Create Products",
                        baseUrl + "/farmer/dashboard"
                )
        );
    }

    public void sendVerificationRejected(User user, String reason) {
        String message = para("Hello " + userName(user) + ",")
                + para("We're sorry — your FarmBridge verification request "
                        + "was <strong>rejected</strong>.")
                + para("Reason: <strong style=\"color:#b45309;\">"
                        + escapeHtml(reason == null || reason.isBlank()
                                ? "No reason provided"
                                : reason)
                        + "</strong>")
                + para("Please update your information and resubmit your "
                        + "verification request. Our team is happy to help "
                        + "if you have questions.");

        sendHtml(
                user.getEmail(),
                "Farmer Verification Rejected",
                buildTemplate(
                        "Verification Rejected",
                        message,
                        "Resubmit Verification",
                        baseUrl + "/farmer/verification"
                )
        );
    }

    // ============================================================
    // ORDER EVENTS
    // ============================================================

    public void sendNewOrderEmail(User farmer, Order order) {
        String message = para("Hello " + userName(farmer) + ", you've got a "
                        + "new order! 🚚")
                + detailsTable(order)
                + para("Please review and accept or reject the order "
                        + "from your dashboard.");

        sendHtml(
                farmer.getEmail(),
                "New Order Received",
                buildTemplate(
                        "New Order Received 🛒",
                        message,
                        "View Orders",
                        baseUrl + "/farmer/orders"
                )
        );
    }

    public void sendOrderAcceptedEmail(User buyer, Order order) {
        String message = para("Hello " + userName(buyer) + ",")
                + para("Great news! Your order for "
                        + "<strong>" + escapeHtml(order.getProduct().getName()) + "</strong>"
                        + " has been accepted by "
                        + escapeHtml(order.getFarmer().getName()) + ".")
                + detailsTable(order)
                + para("The farmer will prepare your order and mark it "
                        + "completed once it's on its way.");

        sendHtml(
                buyer.getEmail(),
                "Order Accepted",
                buildTemplate(
                        "Your Order Was Accepted 🎉",
                        message,
                        "Track Order",
                        baseUrl + "/buyer/orders"
                )
        );
    }

    public void sendOrderRejectedEmail(User buyer, Order order, String reason) {
        String message = para("Hello " + userName(buyer) + ",")
                + para("Unfortunately, your order for "
                        + "<strong>" + escapeHtml(order.getProduct().getName()) + "</strong>"
                        + " was rejected.")
                + (reason != null && !reason.isBlank()
                        ? para("Reason: <strong style=\"color:#b45309;\">"
                                + escapeHtml(reason) + "</strong>")
                        : "")
                + para("You can browse the marketplace and place a new order "
                        + "with another verified farmer.");

        sendHtml(
                buyer.getEmail(),
                "Order Rejected",
                buildTemplate(
                        "Order Rejected",
                        message,
                        "Browse Products",
                        baseUrl + "/buyer/products"
                )
        );
    }

    public void sendOrderCompletedEmail(User buyer, Order order) {
        String message = para("Hello " + userName(buyer) + ",")
                + para("Thank you for shopping with FarmBridge! 🧡")
                + para("Your order of "
                        + "<strong>" + escapeHtml(order.getProduct().getName()) + "</strong>"
                        + " has been completed.")
                + para("We'd love to hear what you think — please leave a "
                        + "review for this product.");

        sendHtml(
                buyer.getEmail(),
                "Order Completed",
                buildTemplate(
                        "Your Order Is Complete 🧺",
                        message,
                        "Review Product",
                        baseUrl + "/buyer/products"
                )
        );
    }

    // ============================================================
    // ADMIN ANNOUNCEMENT
    // ============================================================

    public void sendAnnouncement(
            User user,
            String subject,
            String message,
            String buttonText,
            String buttonUrl) {

        String body = para("Hello " + userName(user) + ",")
                + para(message)
                + para("— The FarmBridge Team");

        sendHtml(
                user.getEmail(),
                subject,
                buildTemplate(
                        subject,
                        body,
                        buttonText,
                        buttonUrl
                )
        );
    }

    // ============================================================
    // PASSWORD RESET (HTML upgrade of the existing flow)
    // ============================================================

    public void sendPasswordResetEmail(User user, PasswordResetToken token) {

        String message = para("Hello " + userName(user) + ",")
                + para("We received a request to reset your FarmBridge "
                        + "password.")
                + para("Click the button below to choose a new password. "
                        + "This link expires in "
                        + "<strong>15 minutes</strong>.")
                + para("If you didn't request this, you can safely ignore "
                        + "this email — your password won't change.");

        String html = buildTemplate(
                "Reset your FarmBridge password",
                message,
                "Reset Password",
                baseUrl + "/reset-password?token=" + token.getToken()
        );

        sendHtml(user.getEmail(), "FarmBridge Password Reset", html);
    }

    // ============================================================
    // SHARED BODY FRAGMENTS
    // ============================================================

    private static String userName(User user) {
        String name = user.getName();
        return escapeHtml(name == null || name.isBlank() ? "there" : name);
    }

    private static String detailsTable(Order order) {
        return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" "
                + "cellspacing=\"0\" style=\"margin:6px 0 14px;border:1px solid #e3e9e5;"
                + "border-radius:8px;overflow:hidden;\">"
                + row("Order ID", "#" + order.getId())
                + row("Product", order.getProduct().getName())
                + row("Customer", order.getBuyer().getName())
                + row("Quantity", String.valueOf(order.getQuantity()))
                + row("Total", "₹" + String.format("%,.2f",
                        order.getTotalPrice() == null ? 0 : order.getTotalPrice()))
                + "</table>";
    }

    private static String row(String label, String value) {
        return "<tr><td style=\"padding:9px 14px;font-size:13px;color:#64748b;"
                + "border-bottom:1px solid #eef2ef;width:38%;\">"
                + escapeHtml(label) + "</td>"
                + "<td style=\"padding:9px 14px;font-size:13px;color:#1e293b;"
                + "font-weight:600;border-bottom:1px solid #eef2ef;\">"
                + escapeHtml(value == null ? "" : value) + "</td></tr>";
    }
}
