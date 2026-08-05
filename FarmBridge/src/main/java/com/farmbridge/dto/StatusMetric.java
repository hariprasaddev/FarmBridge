package com.farmbridge.dto;

/**
 * One order-status bucket of a GROUP BY status aggregation
 * (order-status donut chart).
 */
public class StatusMetric {

    private String status;
    private long count;

    public StatusMetric() {
    }

    public StatusMetric(String status, long count) {
        this.status = status;
        this.count = count;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
