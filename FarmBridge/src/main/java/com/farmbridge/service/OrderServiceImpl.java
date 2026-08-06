package com.farmbridge.service;

import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.OrderStatusRequest;
import com.farmbridge.entity.FarmerProfile;
import com.farmbridge.entity.NotificationType;
import com.farmbridge.entity.Order;
import com.farmbridge.entity.OrderStatus;
import com.farmbridge.entity.Product;
import com.farmbridge.entity.User;
import com.farmbridge.repository.FarmerProfileRepository;
import com.farmbridge.repository.OrderRepository;
import com.farmbridge.repository.ProductRepository;
import com.farmbridge.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private static final Logger logger =
            LoggerFactory.getLogger(OrderServiceImpl.class);

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            UserRepository userRepository,
            FarmerProfileRepository farmerProfileRepository,
            NotificationService notificationService,
            EmailService emailService) {

        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    // ==========================================
    // PLACE ORDER
    // ==========================================

    @Override
    @Transactional
    public OrderResponse placeOrder(
            OrderRequest request,
            String buyerEmail) {

        // Find buyer using email from JWT
        User buyer = userRepository
                .findByEmail(buyerEmail)
                .orElseThrow(() ->
                        new RuntimeException("Buyer not found")
                );

        // SOFT DELETE: deactivated buyers cannot place orders
        if (!buyer.isActive()) {
            throw new RuntimeException(
                    "Your account has been deactivated. Please contact the administrator."
            );
        }

        // Find product
        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        // Only APPROVED farmers may receive buyer orders
        assertFarmerApproved(product.getFarmer().getEmail());

        // Buyers cannot order their own products
        if (product.getFarmer().getEmail().equals(buyerEmail)) {

            throw new RuntimeException(
                    "You cannot order your own product"
            );
        }

        // Check available quantity
        if (request.getQuantity() > product.getQuantity()) {

            throw new RuntimeException(
                    "Insufficient product quantity"
            );
        }

        // Get farmer who owns the product
        User farmer = product.getFarmer();

        // Calculate total price
        Double totalPrice =
                product.getPrice()
                        * request.getQuantity();

        // Create order
        Order order = new Order();

        order.setProduct(product);
        order.setBuyer(buyer);
        order.setFarmer(farmer);
        order.setQuantity(request.getQuantity());
        order.setTotalPrice(totalPrice);

        // New orders start with PENDING status
        order.setStatus(OrderStatus.PENDING);

        // Save order
        Order savedOrder =
                orderRepository.save(order);

        // Notify the farmer about the new order
        notifyUser(
                farmer.getEmail(),
                "New Order",
                "New order placed for " + product.getName(),
                NotificationType.NEW_ORDER,
                savedOrder.getId()
        );

        // Best-effort new-order email to the farmer (failure is logged)
        emailService.sendNewOrderEmail(farmer, savedOrder);

        // Reduce product quantity
        product.setQuantity(
                product.getQuantity()
                        - request.getQuantity()
        );

        productRepository.save(product);

        // Return response
        return convertToResponse(savedOrder);
    }

    // ==========================================
    // VERIFICATION HELPER
    // ==========================================

    private void assertFarmerApproved(String farmerEmail) {

        // SOFT DELETE: deactivated farmers cannot receive new orders or
        // manage received orders.
        User farmer = userRepository
                .findByEmail(farmerEmail)
                .orElse(null);

        if (farmer == null || !farmer.isActive()) {
            throw new RuntimeException(
                    "Your account has been deactivated. Please contact the administrator."
            );
        }

        FarmerProfile profile = farmerProfileRepository
                .findByUserEmail(farmerEmail)
                .orElse(null);

        if (profile == null || !profile.isApproved()) {
            throw new RuntimeException(
                    "Your farmer account has not been verified yet."
            );
        }
    }

    // ==========================================
    // NOTIFICATION HELPER
    // A notification failure must never break the
    // order flow, so every creation is guarded.
    // ==========================================

    private void notifyUser(
            String recipientEmail,
            String title,
            String message,
            NotificationType type,
            Long referenceId) {

        try {
            notificationService.createNotification(
                    recipientEmail,
                    title,
                    message,
                    type,
                    referenceId
            );
        } catch (Exception ex) {
            logger.warn(
                    "Failed to create notification for {}: {}",
                    recipientEmail,
                    ex.getMessage()
            );
        }
    }

    // ==========================================
    // CONVERT ORDER TO RESPONSE
    // ==========================================

    private OrderResponse convertToResponse(
            Order order) {

        return new OrderResponse(
                order.getId(),
                order.getProduct().getId(),
                order.getProduct().getName(),
                order.getBuyer().getName(),
                order.getFarmer().getName(),
                order.getQuantity(),
                order.getTotalPrice(),
                order.getStatus().name()
        );
    }

    // ==========================================
    // GET BUYER ORDERS
    // ==========================================

    @Override
    public List<OrderResponse> getMyOrders(
            String buyerEmail) {

        List<Order> orders =
                orderRepository
                        .findByBuyerEmail(buyerEmail);

        return orders.stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ==========================================
    // GET FARMER ORDERS
    // ==========================================

    @Override
    public List<OrderResponse> getFarmerOrders(
            String farmerEmail) {

        List<Order> orders =
                orderRepository
                        .findByFarmerEmail(farmerEmail);

        return orders.stream()
                .map(this::convertToResponse)
                .toList();
    }

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(
            Long orderId,
            OrderStatusRequest request,
            String farmerEmail) {

        // Only APPROVED farmers may manage received orders
        assertFarmerApproved(farmerEmail);

        // Find the order
        Order order = orderRepository
                .findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found")
                );

        // Check if the logged-in farmer owns this order
        if (!order.getFarmer()
                .getEmail()
                .equals(farmerEmail)) {

            throw new RuntimeException(
                    "You are not allowed to update this order"
            );
        }

        // Get current status
        OrderStatus currentStatus =
                order.getStatus();

        // Get requested status
        OrderStatus newStatus =
                request.getStatus();

        // Only PENDING orders can be ACCEPTED or REJECTED
        if (currentStatus == OrderStatus.PENDING) {

            if (newStatus != OrderStatus.ACCEPTED &&
                    newStatus != OrderStatus.REJECTED) {

                throw new RuntimeException(
                        "Pending order can only be ACCEPTED or REJECTED"
                );
            }

            // Rejecting an order restores the reserved stock
            if (newStatus == OrderStatus.REJECTED) {

                Product product = order.getProduct();

                product.setQuantity(
                        product.getQuantity()
                                + order.getQuantity()
                );

                productRepository.save(product);
            }
        }

        // Only ACCEPTED orders can be COMPLETED
        else if (currentStatus == OrderStatus.ACCEPTED) {

            if (newStatus != OrderStatus.COMPLETED) {

                throw new RuntimeException(
                        "Accepted order can only be COMPLETED"
                );
            }
        }

        // REJECTED orders cannot be changed
        else if (currentStatus == OrderStatus.REJECTED) {

            throw new RuntimeException(
                    "Rejected order cannot be updated"
            );
        }

        // COMPLETED orders cannot be changed
        else if (currentStatus == OrderStatus.COMPLETED) {

            throw new RuntimeException(
                    "Completed order cannot be updated"
            );
        }

        // Update status
        order.setStatus(newStatus);

        // Save order
        Order updatedOrder =
                orderRepository.save(order);

        // Notify the buyer about the outcome of their order
        if (newStatus == OrderStatus.ACCEPTED) {

            notifyUser(
                    order.getBuyer().getEmail(),
                    "Order Accepted",
                    "Your order for " + order.getProduct().getName()
                            + " was accepted.",
                    NotificationType.ORDER_ACCEPTED,
                    order.getId()
            );

            // Best-effort acceptance email to the buyer
            emailService.sendOrderAcceptedEmail(order.getBuyer(), updatedOrder);
        } else if (newStatus == OrderStatus.REJECTED) {

            notifyUser(
                    order.getBuyer().getEmail(),
                    "Order Rejected",
                    "Your order for " + order.getProduct().getName()
                            + " was rejected.",
                    NotificationType.ORDER_REJECTED,
                    order.getId()
            );

            // Best-effort rejection email to the buyer (with the reason
            // the farmer supplied, when present)
            emailService.sendOrderRejectedEmail(
                    order.getBuyer(),
                    updatedOrder,
                    request.getReason()
            );
        } else if (newStatus == OrderStatus.COMPLETED) {

            notifyUser(
                    order.getBuyer().getEmail(),
                    "Order Completed",
                    "Your order for " + order.getProduct().getName()
                            + " has been completed.",
                    NotificationType.ORDER_COMPLETED,
                    order.getId()
            );

            // Best-effort completion email to the buyer
            emailService.sendOrderCompletedEmail(order.getBuyer(), updatedOrder);
        }

        // Return response
        return convertToResponse(updatedOrder);
    }
}
