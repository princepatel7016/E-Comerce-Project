import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../constants/index.js";

/**
 * @desc    Get Admin Dashboard KPI metrics and summary
 * @route   GET /api/v1/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalOrders,
    totalProducts,
    outOfStockProducts,
    revenueAggregation,
    recentOrders
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Order.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ stock: 0 }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: ORDER_STATUSES.CANCELLED } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]),
    Order.find()
      .populate("user", "fullName email")
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalOrders,
        totalProducts,
        outOfStockProducts,
        totalRevenue,
        recentOrders
      },
      "Admin dashboard metrics fetched successfully"
    )
  );
});

/**
 * @desc    Get all users with search and pagination
 * @route   GET /api/v1/admin/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;

  const query = {};
  if (search?.trim()) {
    query.$or = [
      { fullName: { $regex: search.trim(), $options: "i" } },
      { email: { $regex: search.trim(), $options: "i" } },
      { username: { $regex: search.trim(), $options: "i" } }
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [users, totalUsers] = await Promise.all([
    User.find(query)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(query)
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers
        }
      },
      "Users fetched successfully"
    )
  );
});

/**
 * @desc    Toggle user active/inactive account status
 * @route   PATCH /api/v1/admin/users/:userId/status
 * @access  Private/Admin
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Cannot change status of an administrator account");
  }

  user.isActive = !user.isActive;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { userId: user._id, isActive: user.isActive },
      `User account ${user.isActive ? "activated" : "deactivated"} successfully`
    )
  );
});

/**
 * @desc    Get all orders with filter and pagination
 * @route   GET /api/v1/admin/orders
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (status) {
    query.orderStatus = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [orders, totalOrders] = await Promise.all([
    Order.find(query)
      .populate("user", "fullName email phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(query)
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalOrders / limitNum),
          totalOrders
        }
      },
      "All orders fetched successfully"
    )
  );
});

/**
 * @desc    Update order workflow status (e.g., Shipped, Delivered, Cancelled)
 * @route   PATCH /api/v1/admin/orders/:orderId/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(ORDER_STATUSES).includes(status)) {
    throw new ApiError(
      400,
      `Invalid order status. Allowed statuses: ${Object.values(ORDER_STATUSES).join(", ")}`
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // If transitioning to CANCELLED from an active order, restore product stock!
  if (
    status === ORDER_STATUSES.CANCELLED &&
    order.orderStatus !== ORDER_STATUSES.CANCELLED
  ) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
    order.cancelledAt = new Date();
  }

  // If transitioning to DELIVERED:
  if (status === ORDER_STATUSES.DELIVERED) {
    order.deliveredAt = new Date();
    order.paymentStatus = PAYMENT_STATUSES.PAID; // COD collected upon delivery
  }

  order.orderStatus = status;
  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, `Order status updated to '${status}'`));
});

export {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getAllOrders,
  updateOrderStatus
};

