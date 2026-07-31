package com.farmbridge.service;

import com.farmbridge.dto.OrderRequest;
import com.farmbridge.dto.OrderResponse;
import com.farmbridge.dto.OrderStatusRequest;

import java.util.List;

public interface OrderService {

    OrderResponse placeOrder(OrderRequest request, String buyerEmail);

    List<OrderResponse> getMyOrders(String buyerEmail);

    List<OrderResponse> getFarmerOrders(String farmerEmail);

    OrderResponse updateOrderStatus(
            Long orderId,
            OrderStatusRequest request,
            String farmerEmail
    );
}
