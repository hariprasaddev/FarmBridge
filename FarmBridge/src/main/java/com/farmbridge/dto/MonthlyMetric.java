package com.farmbridge.dto;

/**
 * One point of a monthly time series. Produced by JPQL GROUP BY
 * YEAR/MONTH aggregation queries so charts never compute in the browser.
 * {@code value} carries the aggregated measure (revenue, average rating)
 * and {@code count} the row count (orders, registrations, reviews).
 */
public class MonthlyMetric {

    private int year;
    private int month;
    private double value;
    private long count;

    public MonthlyMetric() {
    }

    public MonthlyMetric(int year, int month, double value, long count) {
        this.year = year;
        this.month = month;
        this.value = value;
        this.count = count;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
