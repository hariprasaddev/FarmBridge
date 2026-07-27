package com.farmbridge.repository;

import com.farmbridge.entity.Order;
import com.farmbridge.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository
        extends JpaRepository<Order, Long> {

    // Get all orders placed by a buyer
    List<Order> findByBuyerEmail(String email);

    // Get all orders received by a farmer
    List<Order> findByFarmerEmail(String email);

    // Get orders by status
    List<Order> findByStatus(OrderStatus status);

    // Get orders of a farmer by status
    List<Order> findByFarmerEmailAndStatus(
            String email,
            OrderStatus status
    );
}