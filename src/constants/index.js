/**
 * Application Constants
 * Inspired by Flipkart E-Commerce Platform
 */

// Database Name
export const DB_NAME = "e-comerce";

// User Roles
export const USER_ROLES = Object.freeze({
  USER: "user",
  ADMIN: "admin"
});

// Order Workflow Statuses
export const ORDER_STATUSES = Object.freeze({
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
});

// Payment Methods
export const PAYMENT_METHODS = Object.freeze({
  COD: "COD",
  ONLINE: "ONLINE"
});

// Payment Statuses
export const PAYMENT_STATUSES = Object.freeze({
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed"
});

// Address Types
export const ADDRESS_TYPES = Object.freeze({
  HOME: "home",
  WORK: "work"
});

// Coupon Discount Types
export const COUPON_TYPES = Object.freeze({
  PERCENTAGE: "percentage",
  FIXED: "fixed"
});

// Default Pagination Configuration
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50
});
