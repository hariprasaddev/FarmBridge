package com.farmbridge.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BuyerController {

    @GetMapping("/api/buyer")
    public String buyerDashboard() {
        return "Welcome Buyer!";
    }
}