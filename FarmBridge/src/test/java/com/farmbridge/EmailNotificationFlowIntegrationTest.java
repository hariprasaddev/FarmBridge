package com.farmbridge;

import com.farmbridge.dto.AnnouncementRequest;
import com.farmbridge.dto.AnnouncementResponse;
import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderStatusRequest;
import com.farmbridge.dto.ProductRequest;
import com.farmbridge.dto.RegisterRequest;
import com.farmbridge.entity.AnnouncementAudience;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.OrderStatus;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.Role;
import com.farmbridge.entity.User;
import com.farmbridge.entity.VerificationStatus;
import com.farmbridge.repository.AnnouncementRepository;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.PasswordResetTokenRepository;
import com.farmbridge.repository.NotificationRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;
import com.farmbridge.service.AdminService;
import com.farmbridge.service.AnnouncementService;
import com.farmbridge.service.AuthService;
import com.farmbridge.service.OrderService;
import com.farmbridge.service.PasswordResetService;
import com.farmbridge.service.ProductService;

import jakarta.mail.Address;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * End-to-end verification of the enterprise email notification system.
 * A mocked JavaMailSender captures every MimeMessage so the tests can
 * assert recipients, subjects and the professional HTML bodies without
 * touching a real SMTP server.
 */
@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class EmailNotificationFlowIntegrationTest {

    private static final long TS = System.currentTimeMillis();

    private static final String BUYER_EMAIL = "email.buyer." + TS + "@example.com";
    private static final String FARMER_EMAIL = "email.farmer." + TS + "@example.com";
    private static final String APPROVE_FARMER_EMAIL = "email.approve." + TS + "@example.com";
    private static final String REJECT_FARMER_EMAIL = "email.reject." + TS + "@example.com";
    private static final String PASSWORD = "EmailPass123!";

    @MockitoBean
    private JavaMailSender mailSender;

    @Autowired private AuthService authService;
    @Autowired private AdminService adminService;
    @Autowired private OrderService orderService;
    @Autowired private ProductService productService;
    @Autowired private AnnouncementService announcementService;
    @Autowired private PasswordResetService passwordResetService;
    @Autowired private UserRepository userRepository;
    @Autowired private FarmerProfileRepository farmerProfileRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private AnnouncementRepository announcementRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private TransactionTemplate transactionTemplate;

    // Captured sent emails (reset before each test)
    private final List<MimeMessage> sentEmails = new ArrayList<>();
    private User farmer;
    private User buyer;
    private User approveFarmer;
    private User rejectFarmer;
    private Long productId;
    private FarmerProfile approveProfile;
    private FarmerProfile rejectProfile;

    @BeforeEach
    void captureSends() {
        sentEmails.clear();
        // Stub createMimeMessage to produce a real, inspectable message
        // and record every send for assertions.
        when(mailSender.createMimeMessage())
                .thenAnswer(inv -> new MimeMessage((Session) null));
        doAnswer(inv -> {
            sentEmails.add(inv.getArgument(0));
            return null;
        }).when(mailSender).send(any(MimeMessage.class));
    }

    @BeforeAll
    void seedUsers() {
        buyer = saveUser("Email Buyer", BUYER_EMAIL, Role.BUYER);
        farmer = saveUser("Email Farmer", FARMER_EMAIL, Role.FARMER);
        approveFarmer = saveUser("Approve Farmer", APPROVE_FARMER_EMAIL, Role.FARMER);
        rejectFarmer = saveUser("Reject Farmer", REJECT_FARMER_EMAIL, Role.FARMER);

        // Approved farmer profile so orders can be placed
        FarmerProfile profile = new FarmerProfile();
        profile.setUser(farmer);
        profile.setFarmName("Email Test Farm");
        profile.setLocation("Hyderabad");
        profile.setVerified(true);
        profile.setVerificationStatus(VerificationStatus.APPROVED);
        farmerProfileRepository.save(profile);

        // One pending profile per dedicated verification farmer
        approveProfile = pendingProfile(approveFarmer, "Email Approve Farm");
        rejectProfile = pendingProfile(rejectFarmer, "Email Reject Farm");

        Product product = new Product();
        product.setName("Email Test Rice");
        product.setDescription("Integration test product");
        product.setPrice(100.0);
        product.setQuantity(50);
        product.setCategory("Grains");
        product.setFarmer(farmer);
        productId = productRepository.save(product).getId();
    }

    private FarmerProfile pendingProfile(User user, String farmName) {
        FarmerProfile profile = new FarmerProfile();
        profile.setUser(user);
        profile.setFarmName(farmName);
        profile.setVerified(false);
        profile.setVerificationStatus(VerificationStatus.PENDING);
        return farmerProfileRepository.save(profile);
    }

    @AfterAll
    void cleanup() {
        transactionTemplate.executeWithoutResult(status -> {
            // Announcements created by this test (sentBy is always admin@test.com)
            announcementRepository.deleteAll(
                    announcementRepository.findAll().stream()
                            .filter(a -> "admin@test.com".equals(a.getSentBy()))
                            .toList()
            );

            // FK order: notifications/tokens → orders → products → profiles → users
            orderRepository.deleteAll(orderRepository.findByFarmerEmail(FARMER_EMAIL));
            productRepository.deleteAll(productRepository.findByFarmerEmail(FARMER_EMAIL));
            for (String email : List.of(
                    BUYER_EMAIL, FARMER_EMAIL, APPROVE_FARMER_EMAIL, REJECT_FARMER_EMAIL)) {
                notificationRepository.deleteByRecipientEmail(email);
                passwordResetTokenRepository.findByUserEmail(email)
                        .ifPresent(passwordResetTokenRepository::delete);
                farmerProfileRepository.findByUserEmail(email)
                        .ifPresent(farmerProfileRepository::delete);
                userRepository.findByEmail(email)
                        .ifPresent(userRepository::delete);
            }
        });
    }

    private User saveUser(String name, String email, Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(PASSWORD));
        user.setRole(role);
        return userRepository.save(user);
    }

    // ==========================================
    // HELPERS — inspect captured emails
    // ==========================================

    private MimeMessage lastSent() {
        assertFalse(sentEmails.isEmpty(), "Expected at least one email to be sent");
        return sentEmails.get(sentEmails.size() - 1);
    }

    private List<String> recipients(MimeMessage m) throws Exception {
        List<String> result = new ArrayList<>();
        Address[] all = m.getAllRecipients();
        if (all != null) {
            for (Address a : all) {
                result.add(((InternetAddress) a).getAddress());
            }
        }
        return result;
    }

    // Walks the (possibly nested) multipart tree and returns the first
    // text/html part's content — MimeMessageHelper may wrap the body in
    // multipart/alternative structures. Falls back to any string part so
    // the test can at least report what was actually produced.
    private String htmlBody(MimeMessage m) throws Exception {
        String html = extractHtml(m.getContent());
        assertNotNull(html, "Email must contain a text/html body — got: "
                + describeContent(m));
        return html;
    }

    private String extractHtml(Object content) throws Exception {
        if (content instanceof MimeMultipart mm) {
            for (int i = 0; i < mm.getCount(); i++) {
                MimeBodyPart part = (MimeBodyPart) mm.getBodyPart(i);
                String type = part.getContentType() == null ? "" : part.getContentType();
                Object partContent = part.getContent();
                if (partContent instanceof String s) {
                    if (type.toLowerCase().contains("text/html")
                            || s.contains("<!DOCTYPE html")
                            || s.contains("<html")) {
                        return s;
                    }
                } else if (partContent instanceof MimeMultipart nested) {
                    String found = extractHtml(nested);
                    if (found != null) return found;
                }
            }
            return null;
        }
        return content instanceof String s ? s : null;
    }

    private String describeContent(MimeMessage m) {
        try {
            Object c = m.getContent();
            if (c instanceof MimeMultipart mm) {
                StringBuilder sb = new StringBuilder("multipart(");
                for (int i = 0; i < mm.getCount(); i++) {
                    sb.append("[").append(i).append("]=")
                            .append(mm.getBodyPart(i).getContentType()).append(" ");
                }
                return sb.append(")").toString();
            }
            return String.valueOf(c).substring(0, Math.min(120, String.valueOf(c).length()));
        } catch (Exception e) {
            return "<unreadable: " + e.getMessage() + ">";
        }
    }

    private List<MimeMessage> emailsTo(String email) {
        return sentEmails.stream()
                .filter(m -> {
                    try {
                        return recipients(m).contains(email);
                    } catch (Exception e) {
                        return false;
                    }
                })
                .toList();
    }

    // ==========================================
    // WELCOME
    // ==========================================

    @Test
    @Order(1)
    @DisplayName("Registration sends a professional welcome email to the new user")
    void register_sendsWelcomeEmail() throws Exception {
        String email = "email.welcome." + TS + "@example.com";
        RegisterRequest request = new RegisterRequest();
        request.setName("Welcome Newbie");
        request.setEmail(email);
        request.setPassword(PASSWORD);
        request.setRole(Role.BUYER);

        try {
            authService.register(request);

            List<MimeMessage> sent = emailsTo(email);
            assertEquals(1, sent.size(), "Exactly one welcome email (no duplicates)");
            assertEquals("Welcome to FarmBridge", sent.get(0).getSubject());
            String html = htmlBody(sent.get(0));
            assertTrue(html.contains("Welcome to FarmBridge"));
            assertTrue(html.contains("Welcome Newbie"));
            assertTrue(html.contains("support@farmbridge.com"));
            assertTrue(html.contains("FarmBridge"));
            assertTrue(html.contains("<a"));
        } finally {
            userRepository.findByEmail(email).ifPresent(userRepository::delete);
        }
    }

    // ==========================================
    // VERIFICATION APPROVED / REJECTED
    // ==========================================

    @Test
    @Order(2)
    @DisplayName("Admin approval emails the farmer an approved notification")
    void verifyFarmer_sendsApprovedEmail() throws Exception {
        adminService.verifyFarmer(approveProfile.getId());

        List<MimeMessage> sent = emailsTo(APPROVE_FARMER_EMAIL);
        assertEquals(1, sent.size(), "Exactly one approval email (no duplicates)");
        assertEquals(
                "Your FarmBridge account has been approved",
                sent.get(0).getSubject()
        );
        String html = htmlBody(sent.get(0));
        assertTrue(html.contains("Email Approve Farm"));
        assertTrue(html.contains("Create Products"));
    }

    @Test
    @Order(3)
    @DisplayName("Admin rejection emails the farmer the stored reason")
    void rejectFarmer_sendsRejectedEmailWithReason() throws Exception {
        adminService.rejectFarmer(
                rejectProfile.getId(),
                "Land certificate is unclear — please re-upload"
        );

        List<MimeMessage> sent = emailsTo(REJECT_FARMER_EMAIL);
        assertEquals(1, sent.size(), "Exactly one rejection email (no duplicates)");
        assertEquals("Farmer Verification Rejected", sent.get(0).getSubject());
        String html = htmlBody(sent.get(0));
        assertTrue(
                html.contains("Land certificate is unclear"),
                "Rejection reason must appear in the email"
        );
        assertTrue(html.contains("Resubmit Verification"));
    }

    // ==========================================
    // ORDER EVENTS
    // ==========================================

    @Test
    @Order(4)
    @DisplayName("Placing an order emails the farmer a new-order notification with details")
    void placeOrder_sendsNewOrderEmailToFarmer() throws Exception {
        OrderRequest request = new OrderRequest();
        request.setProductId(productId);
        request.setQuantity(2);

        orderService.placeOrder(request, BUYER_EMAIL);

        List<MimeMessage> sent = emailsTo(FARMER_EMAIL);
        assertEquals(1, sent.size(), "Exactly one new-order email (no duplicates)");
        assertEquals("New Order Received", sent.get(0).getSubject());
        String html = htmlBody(sent.get(0));
        assertTrue(html.contains("Email Test Rice"));
        assertTrue(html.contains(BUYER_EMAIL.split("@")[0].replace('.', ' ') + " Email Buyer")
                || html.contains("Email Buyer"));
        assertTrue(html.contains("View Orders"));
    }

    @Test
    @Order(5)
    @DisplayName("Accepting an order emails the buyer an accepted notification")
    void acceptOrder_sendsAcceptedEmailToBuyer() throws Exception {
        com.farmbridge.entity.Order order =
                orderRepository.findByFarmerEmail(FARMER_EMAIL).get(0);

        OrderStatusRequest accept = new OrderStatusRequest();
        accept.setStatus(OrderStatus.ACCEPTED);
        orderService.updateOrderStatus(order.getId(), accept, FARMER_EMAIL);

        List<MimeMessage> sent = emailsTo(BUYER_EMAIL);
        assertEquals(1, sent.size(), "Exactly one acceptance email (no duplicates)");
        assertEquals("Order Accepted", sent.get(0).getSubject());
        String html = htmlBody(sent.get(0));
        assertTrue(html.contains("Email Test Rice"));
        assertTrue(html.contains("Track Order"));
    }

    @Test
    @Order(6)
    @DisplayName("Completing an order emails the buyer a completion notification with review CTA")
    void completeOrder_sendsCompletedEmailToBuyer() throws Exception {
        com.farmbridge.entity.Order order =
                orderRepository.findByFarmerEmail(FARMER_EMAIL).get(0);

        OrderStatusRequest complete = new OrderStatusRequest();
        complete.setStatus(OrderStatus.COMPLETED);
        orderService.updateOrderStatus(order.getId(), complete, FARMER_EMAIL);

        List<MimeMessage> sent = emailsTo(BUYER_EMAIL);
        assertEquals(1, sent.size(), "Exactly one completion email (no duplicates)");
        assertEquals("Order Completed", sent.get(0).getSubject());
        String html = htmlBody(sent.get(0));
        assertTrue(html.contains("Review Product"));
        assertTrue(html.contains("Thank you"));
    }

    @Test
    @Order(7)
    @DisplayName("Rejecting an order emails the buyer the supplied reason")
    void rejectOrder_sendsRejectedEmailWithReason() throws Exception {
        // Second order for the reject flow
        OrderRequest request = new OrderRequest();
        request.setProductId(productId);
        request.setQuantity(1);
        com.farmbridge.entity.Order order = orderRepository
                .findById(orderService.placeOrder(request, BUYER_EMAIL).getId())
                .orElseThrow();

        sentEmails.clear(); // drop the new-order email for the farmer

        OrderStatusRequest reject = new OrderStatusRequest();
        reject.setStatus(OrderStatus.REJECTED);
        reject.setReason("Crop failed this season — sincerely sorry");
        orderService.updateOrderStatus(order.getId(), reject, FARMER_EMAIL);

        List<MimeMessage> sent = emailsTo(BUYER_EMAIL);
        assertEquals(1, sent.size(), "Exactly one rejection email (no duplicates)");
        assertEquals("Order Rejected", sent.get(0).getSubject());
        String html = htmlBody(sent.get(0));
        assertTrue(html.contains("Crop failed this season"), "Reason must be in the email");
        assertTrue(html.contains("Browse Products"));
    }

    // ==========================================
    // PASSWORD RESET (HTML upgrade)
    // ==========================================

    @Test
    @Order(8)
    @DisplayName("Forgot password sends the upgraded HTML reset email with token link")
    void forgotPassword_sendsHtmlResetEmail() throws Exception {
        com.farmbridge.dto.ForgotPasswordRequest forgot =
                new com.farmbridge.dto.ForgotPasswordRequest();
        forgot.setEmail(FARMER_EMAIL);

        sentEmails.clear();
        passwordResetService.forgotPassword(forgot);

        List<MimeMessage> sent = emailsTo(FARMER_EMAIL);
        assertEquals(1, sent.size());
        assertEquals("FarmBridge Password Reset", sent.get(0).getSubject());
        String html = htmlBody(sent.get(0));
        assertTrue(html.contains("15 minutes"));
        assertTrue(html.contains("/reset-password?token="));
        assertTrue(html.contains("Reset Password"));
    }

    // ==========================================
    // ANNOUNCEMENTS
    // ==========================================

    @Test
    @Order(9)
    @DisplayName("Announcement to BUYERS reaches buyers but not farmers")
    void announcement_toBuyers_reachesOnlyBuyers() throws Exception {
        AnnouncementRequest request = new AnnouncementRequest();
        request.setAudience(AnnouncementAudience.BUYERS);
        request.setSubject("Buyers only — weekend sale!");
        request.setMessage("Get 10% off on all fresh produce this weekend.");

        sentEmails.clear();
        AnnouncementResponse response =
                announcementService.sendAnnouncement(request, "admin@test.com");

        List<MimeMessage> toBuyer = emailsTo(BUYER_EMAIL);
        assertEquals(1, toBuyer.size());
        assertEquals("Buyers only — weekend sale!", toBuyer.get(0).getSubject());
        assertTrue(htmlBody(toBuyer.get(0)).contains("10% off"));

        assertTrue(emailsTo(FARMER_EMAIL).isEmpty(),
                "Farmers must not receive a BUYERS-only announcement");
        assertTrue(response.getRecipientCount() >= 1);
    }

    @Test
    @Order(10)
    @DisplayName("Announcement to FARMERS reaches farmers but not buyers")
    void announcement_toFarmers_reachesOnlyFarmers() throws Exception {
        AnnouncementRequest request = new AnnouncementRequest();
        request.setAudience(AnnouncementAudience.FARMERS);
        request.setSubject("Farmers — harvest update");
        request.setMessage("Please keep your product stock levels updated.");

        sentEmails.clear();
        announcementService.sendAnnouncement(request, "admin@test.com");

        assertEquals(1, emailsTo(FARMER_EMAIL).size());
        assertTrue(emailsTo(BUYER_EMAIL).isEmpty(),
                "Buyers must not receive a FARMERS-only announcement");
    }

    @Test
    @Order(11)
    @DisplayName("Announcement to ALL reaches every user, and history records it")
    void announcement_toAll_reachesEveryone() throws Exception {
        AnnouncementRequest request = new AnnouncementRequest();
        request.setAudience(AnnouncementAudience.ALL);
        request.setSubject("Platform announcement");
        request.setMessage("FarmBridge is upgrading this weekend.");
        request.setButtonText("Learn More");
        request.setButtonUrl("http://localhost:5173/buyer/products");

        sentEmails.clear();
        AnnouncementResponse response =
                announcementService.sendAnnouncement(request, "admin@test.com");

        assertEquals(1, emailsTo(FARMER_EMAIL).size());
        assertEquals(1, emailsTo(BUYER_EMAIL).size());
        assertTrue(htmlBody(lastSent()).contains("Learn More"));

        // History is persisted
        assertTrue(
                announcementService.getAnnouncements().stream()
                        .anyMatch(a -> "Platform announcement".equals(a.getSubject()))
        );
        assertTrue(response.getRecipientCount() >= 2);
    }

    @Test
    @Order(12)
    @DisplayName("SMTP failure never rolls back the announcement and stops nothing")
    void smtpFailure_doesNotBreakAnnouncement() {
        // Force every send to fail
        doThrow(new MailSendException("Simulated SMTP outage"))
                .when(mailSender).send(any(MimeMessage.class));

        AnnouncementRequest request = new AnnouncementRequest();
        request.setAudience(AnnouncementAudience.ALL);
        request.setSubject("Outage resilience check");
        request.setMessage("This should still be recorded.");

        assertDoesNotThrow(() ->
                announcementService.sendAnnouncement(request, "admin@test.com")
        );

        // The announcement record is persisted despite all emails failing
        assertTrue(
                announcementRepository.findAll().stream()
                        .anyMatch(a -> "Outage resilience check".equals(a.getSubject()))
        );

        // Reset the mock for subsequent tests
        doAnswer(inv -> {
            sentEmails.add(inv.getArgument(0));
            return null;
        }).when(mailSender).send(any(MimeMessage.class));
    }

    @Test
    @Order(13)
    @DisplayName("SMTP failure never rolls back an order placement")
    void smtpFailure_orderStillPlaced() {
        doThrow(new MailSendException("Simulated SMTP outage"))
                .when(mailSender).send(any(MimeMessage.class));

        OrderRequest request = new OrderRequest();
        request.setProductId(productId);
        request.setQuantity(1);

        com.farmbridge.entity.Order placed = orderRepository
                .findById(orderService.placeOrder(request, BUYER_EMAIL).getId())
                .orElseThrow();

        assertEquals(OrderStatus.PENDING, placed.getStatus(),
                "Order must be created even when the email fails");

        doAnswer(inv -> {
            sentEmails.add(inv.getArgument(0));
            return null;
        }).when(mailSender).send(any(MimeMessage.class));
    }
}
