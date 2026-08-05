package com.farmbridge.dto;

import com.farmbridge.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class OrderStatusRequest {

    @NotNull(message = "Order status is required")
    private OrderStatus status;

    // Optional — used by the rejected-order email. Null/blank values
    // are allowed so existing clients keep working unchanged.
    private String reason;

    public OrderStatusRequest() {
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}