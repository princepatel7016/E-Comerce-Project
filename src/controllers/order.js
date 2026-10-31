import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";
import { Coupon } from "../models/coupon.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "../constants/index.js";

// Flipkart-style delivery charge: Free above ₹500, else ₹40
const calculateDeliveryCharge = (subtotal) => {
  return subtotal >= 500 ? 0 : 40;
};

/**
 * @desc    Create a new order from Cart items
 * @route   POST /api/v1/orders
 * @access  Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod = PAYMENT_METHODS.COD, couponCode } = req.body;

  if (!addressId) {
    throw new ApiError(400, "Shipping address is required to place an order");
  }

  // 1. Validate shipping address exists and belongs to user
  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) {
    throw new ApiError(404, "Selected shipping address not found");
  }

  // 2. Fetch User's Cart
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty. Add products before placing an order.");
  }

  // 3. Verify stock availability and build order items snapshot
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = cartItem.product;

    if (!product || !product.isActive) {
      throw new ApiError(
        400,
        `Product '${product?.name || "Unknown"}' is no longer available.`
      );
    }

    if (product.stock < cartItem.quantity) {
      throw new ApiError(
        400,
        `Insufficient stock for '${product.name}'. Available: ${product.stock}, in your cart: ${cartItem.quantity}`
      );
    }

    const itemPrice =
      product.discountPrice !== null && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.thumbnail || (product.images?.[0] || ""),
      price: itemPrice,
      quantity: cartItem.quantity
    });

    subtotal += itemPrice * cartItem.quantity;
  }

  // 4. Handle optional coupon discount
  let discount = 0;
  if (couponCode?.trim()) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase()
    });

    if (coupon && coupon.isValid(subtotal)) {
      discount = coupon.calculateDiscount(subtotal);
      // Increment coupon usage
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  // 5. Calculate final totals on server (tamper-proof)
  const deliveryCharge = calculateDeliveryCharge(subtotal);
  const totalAmount = Math.max(0, subtotal - discount + deliveryCharge);

  // 6. Generate Flipkart-style unique Order Number
  const orderNumber = `OD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 7. Deduct product inventory stock safely
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  // 8. Create Order Document
  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      pincode: address.pincode,
      houseNumber: address.houseNumber,
      street: address.street,
      city: address.city,
      state: address.state,
      landmark: address.landmark
    },
    subtotal,
    discount,
    deliveryCharge,
    totalAmount,
    paymentMethod,
    paymentStatus:
      paymentMethod === PAYMENT_METHODS.COD
        ? PAYMENT_STATUSES.PENDING
        : PAYMENT_STATUSES.PAID,
    orderStatus: ORDER_STATUSES.PENDING
  });

  // 9. Clear user's cart after successful order creation
  cart.items = [];
  cart.totalPrice = 0;
  cart.totalItems = 0;
  await cart.save();

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order placed successfully!"));
});

/**
 * @desc    Get order history for logged-in user
 * @route   GET /api/v1/orders/my-orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: orders.length, orders },
        "Order history fetched successfully"
      )
    );
});

/**
 * @desc    Get single order details by ID
 * @route   GET /api/v1/orders/:orderId
 * @access  Private
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId).populate("user", "fullName email phone");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Ensure customer can only view their own orders unless they are an admin
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Not authorized to view this order");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order details fetched successfully"));
});

/**
 * @desc    Cancel order and restore product stock
 * @route   PATCH /api/v1/orders/:orderId/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;

  const order = await Order.findOne({ _id: orderId, user: req.user._id });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Orders can only be cancelled before dispatch
  const cancellableStatuses = [
    ORDER_STATUSES.PENDING,
    ORDER_STATUSES.CONFIRMED,
    ORDER_STATUSES.PROCESSING
  ];

  if (!cancellableStatuses.includes(order.orderStatus)) {
    throw new ApiError(
      400,
      `Cannot cancel order. Current status is '${order.orderStatus}'. Orders already shipped or delivered cannot be cancelled.`
    );
  }

  // 1. Restore product inventory stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  // 2. Update order status
  order.orderStatus = ORDER_STATUSES.CANCELLED;
  order.cancelledAt = new Date();
  order.cancellationReason = reason || "Cancelled by customer";
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order cancelled successfully and stock restored"));
});

export {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
};

