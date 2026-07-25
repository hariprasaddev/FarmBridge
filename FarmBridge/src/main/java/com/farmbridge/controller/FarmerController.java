package com.farmbridge.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FarmerController {

    @GetMapping("/api/farmer")
    public String farmerDashboard() {
        return "Welcome Farmer!";
    }
}