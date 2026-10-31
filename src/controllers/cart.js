import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper to determine accurate current selling price from Product
const getProductPrice = (product) => {
  return product.discountPrice !== null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;
};

/**
 * @desc    Get current user's shopping cart
 * @route   GET /api/v1/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name slug thumbnail price discountPrice stock isActive"
  });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Filter out any deleted products and update current prices
  let hasChanges = false;
  cart.items = cart.items.filter((item) => item.product && item.product.isActive);

  cart.items.forEach((item) => {
    const currentPrice = getProductPrice(item.product);
    if (item.price !== currentPrice) {
      item.price = currentPrice;
      hasChanges = true;
    }
  });

  cart.calculateTotals();
  if (hasChanges) {
    await cart.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart fetched successfully"));
});

/**
 * @desc    Add product to shopping cart
 * @route   POST /api/v1/cart
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const numQuantity = Math.max(1, parseInt(quantity, 10));

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // 1. Fetch product from database to verify status and stock
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    throw new ApiError(404, "Product is currently unavailable");
  }

  if (product.stock < numQuantity) {
    throw new ApiError(
      400,
      `Only ${product.stock} unit(s) available in stock. Cannot add ${numQuantity}.`
    );
  }

  const effectivePrice = getProductPrice(product);

  // 2. Find or create user cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // 3. Check if product is already in the cart
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    // Product already exists in cart, increase quantity
    const newQuantity = cart.items[itemIndex].quantity + numQuantity;
    if (newQuantity > product.stock) {
      throw new ApiError(
        400,
        `Cannot add more. You already have ${cart.items[itemIndex].quantity} in cart and total stock is ${product.stock}.`
      );
    }
    cart.items[itemIndex].quantity = newQuantity;
    cart.items[itemIndex].price = effectivePrice;
  } else {
    // New item added to cart
    cart.items.push({
      product: product._id,
      quantity: numQuantity,
      price: effectivePrice
    });
  }

  // 4. Calculate total amount and items on server
  cart.calculateTotals();
  await cart.save();

  // Populate product details for the client
  await cart.populate({
    path: "items.product",
    select: "name slug thumbnail price discountPrice stock"
  });

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Product added to cart successfully"));
});

/**
 * @desc    Update quantity of a cart item
 * @route   PATCH /api/v1/cart/:productId
 * @access  Private
 */
const updateCartItemQuantity = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const numQuantity = parseInt(quantity, 10);

  if (!numQuantity || numQuantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found or inactive");
  }

  if (numQuantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} items currently in stock`);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId.toString()
  );

  if (itemIndex === -1) {
    throw new ApiError(404, "Item not found in cart");
  }

  cart.items[itemIndex].quantity = numQuantity;
  cart.items[itemIndex].price = getProductPrice(product);
  cart.calculateTotals();
  await cart.save();

  await cart.populate({
    path: "items.product",
    select: "name slug thumbnail price discountPrice stock"
  });

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Cart item updated successfully"));
});

/**
 * @desc    Remove an item from cart
 * @route   DELETE /api/v1/cart/:productId
 * @access  Private
 */
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );

  cart.calculateTotals();
  await cart.save();

  await cart.populate({
    path: "items.product",
    select: "name slug thumbnail price discountPrice stock"
  });

  return res
    .status(200)
    .json(new ApiResponse(200, cart, "Item removed from cart"));
});

/**
 * @desc    Clear all items from cart
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;
    await cart.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { items: [], totalPrice: 0, totalItems: 0 }, "Cart cleared successfully"));
});

export {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
};

