package com.farmbridge.service;

import com.farmbridge.dto.LoginRequest;
import com.farmbridge.dto.LoginResponse;
import com.farmbridge.dto.RegisterRequest;

public interface AuthService {

    String register(RegisterRequest request);

    LoginResponse login(LoginRequest request);
}