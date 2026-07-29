package com.farmbridge.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ==========================================
    // HANDLE @Valid VALIDATION FAILURES
    // HTTP 400 — Bad Request
    // ==========================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed",
                fieldErrors
        );

        return ResponseEntity.badRequest().body(response);
    }

    // ==========================================
    // HANDLE RUNTIME EXCEPTIONS
    // Message-based HTTP status mapping
    // ==========================================

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(
            RuntimeException ex) {

        HttpStatus status = determineHttpStatus(ex.getMessage());
        String message = ex.getMessage();

        ErrorResponse response = new ErrorResponse(
                status.value(),
                message
        );

        return ResponseEntity.status(status).body(response);
    }

    // ==========================================
    // HANDLE ALL OTHER UNEXPECTED EXCEPTIONS
    // HTTP 500 — Internal Server Error
    // ==========================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex) {

        ErrorResponse response = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred"
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    // ==========================================
    // MAP EXCEPTION MESSAGE TO HTTP STATUS
    // ==========================================

    private HttpStatus determineHttpStatus(String message) {

        if (message == null) {
            return HttpStatus.BAD_REQUEST;
        }

        String msg = message.toLowerCase();

        // Resource not found → 404
        if (msg.contains("not found")) {
            return HttpStatus.NOT_FOUND;
        }

        // Duplicate / conflict → 409
        if (msg.contains("already exists") || msg.contains("already in use")) {
            return HttpStatus.CONFLICT;
        }

        // Everything else → 400
        return HttpStatus.BAD_REQUEST;
    }
}
