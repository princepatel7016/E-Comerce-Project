import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";
import { PAGINATION } from "../constants/index.js";

// Helper function to create URL-safe slug
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * @desc    Create a new Product
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    brand,
    category,
    price,
    discountPrice,
    stock,
    sku,
    specifications,
    isFeatured
  } = req.body;

  // 1. Validation
  if (!name?.trim() || !description?.trim() || !brand?.trim() || !category || price === undefined) {
    throw new ApiError(400, "Name, description, brand, category, and price are required fields");
  }

  // 2. Validate Category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    throw new ApiError(404, "Selected category not found");
  }

  // 3. Generate unique slug
  let slug = createSlug(name);
  const existingSlug = await Product.findOne({ slug });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  // 4. Handle multiple image uploads via Cloudinary
  const images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const uploadRes = await uploadOnCloudinary(file.path, "products");
      if (uploadRes) {
        images.push(uploadRes.secure_url || uploadRes.url);
      }
    }
  }

  // If thumbnail file passed separately or default to first uploaded image
  const thumbnail = images.length > 0 ? images[0] : "";

  // 5. Parse specifications if passed as JSON string
  let parsedSpecs = [];
  if (specifications) {
    try {
      parsedSpecs = typeof specifications === "string" ? JSON.parse(specifications) : specifications;
    } catch {
      parsedSpecs = [];
    }
  }

  const numPrice = Number(price);
  const numDiscountPrice = discountPrice !== undefined && discountPrice !== "" ? Number(discountPrice) : null;
  const numStock = stock !== undefined ? Number(stock) : 0;

  if (numDiscountPrice !== null && numDiscountPrice >= numPrice) {
    throw new ApiError(400, "Discount price must be less than the regular price");
  }

  const product = await Product.create({
    name: name.trim(),
    slug,
    description: description.trim(),
    brand: brand.trim(),
    category: categoryExists._id,
    images,
    thumbnail,
    price: numPrice,
    discountPrice: numDiscountPrice,
    stock: numStock,
    sku: sku ? sku.trim().toUpperCase() : undefined,
    specifications: parsedSpecs,
    isFeatured: isFeatured === "true" || isFeatured === true,
    createdBy: req.user._id
  });

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product created successfully"));
});

/**
 * @desc    Get all products with Search, Filtering, Sorting & Pagination
 * @route   GET /api/v1/products
 * @access  Public
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    featured,
    sort,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT
  } = req.query;

  // Build MongoDB query filter
  const filter = { isActive: true };

  // 1. Keyword search (Name or Brand matching)
  if (keyword?.trim()) {
    filter.$or = [
      { name: { $regex: keyword.trim(), $options: "i" } },
      { brand: { $regex: keyword.trim(), $options: "i" } },
      { description: { $regex: keyword.trim(), $options: "i" } }
    ];
  }

  // 2. Filter by category (by ID or Slug)
  if (category) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
    if (isObjectId) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({ slug: category.toLowerCase() });
      if (catDoc) filter.category = catDoc._id;
    }
  }

  // 3. Filter by brand
  if (brand?.trim()) {
    filter.brand = { $regex: `^${brand.trim()}$`, $options: "i" };
  }

  // 4. Price range filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // 5. In-stock availability filter
  if (inStock === "true") {
    filter.stock = { $gt: 0 };
  }

  // 6. Featured filter
  if (featured === "true") {
    filter.isFeatured = true;
  }

  // 7. Sorting logic
  let sortOption = { createdAt: -1 }; // default newest first
  if (sort === "price-asc") {
    sortOption = { price: 1 };
  } else if (sort === "price-desc") {
    sortOption = { price: -1 };
  } else if (sort === "ratings") {
    sortOption = { ratings: -1 };
  } else if (sort === "newest") {
    sortOption = { createdAt: -1 };
  }

  // 8. Pagination calculation
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum),
    Product.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalProducts / limitNum);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      },
      "Products fetched successfully"
    )
  );
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:productId
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId).populate("category", "name slug");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * @desc    Get product by SEO-friendly Slug
 * @route   GET /api/v1/products/slug/:slug
 * @access  Public
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true })
    .populate("category", "name slug");

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

/**
 * @desc    Update an existing product
 * @route   PATCH /api/v1/products/:productId
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const updates = { ...req.body };

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  // If name changed, update slug
  if (updates.name && updates.name.trim() !== product.name) {
    updates.name = updates.name.trim();
    updates.slug = createSlug(updates.name);
  }

  // Handle uploaded images if any new files sent
  if (req.files && req.files.length > 0) {
    const uploadedImages = [];
    for (const file of req.files) {
      const uploadRes = await uploadOnCloudinary(file.path, "products");
      if (uploadRes) {
        uploadedImages.push(uploadRes.secure_url || uploadRes.url);
      }
    }
    if (uploadedImages.length > 0) {
      // Append new images or replace
      product.images = [...product.images, ...uploadedImages];
      product.thumbnail = product.images[0];
    }
  }

  // Validate discount vs price if updated
  const newPrice = updates.price !== undefined ? Number(updates.price) : product.price;
  const newDiscount =
    updates.discountPrice !== undefined
      ? Number(updates.discountPrice)
      : product.discountPrice;

  if (newDiscount !== null && newDiscount >= newPrice) {
    throw new ApiError(400, "Discount price must be less than regular price");
  }

  Object.assign(product, updates);
  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product updated successfully"));
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/v1/products/:productId
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findByIdAndDelete(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Product deleted successfully"));
});

/**
 * @desc    Get featured products
 * @route   GET /api/v1/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate("category", "name slug")
    .limit(8)
    .sort({ ratings: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Featured products fetched successfully"));
});

/**
 * @desc    Get related products from same category
 * @route   GET /api/v1/products/:productId/related
 * @access  Public
 */
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const currentProduct = await Product.findById(productId);
  if (!currentProduct) {
    throw new ApiError(404, "Product not found");
  }

  const relatedProducts = await Product.find({
    category: currentProduct.category,
    _id: { $ne: currentProduct._id },
    isActive: true
  })
    .populate("category", "name slug")
    .limit(6);

  return res
    .status(200)
    .json(new ApiResponse(200, relatedProducts, "Related products fetched successfully"));
});

export {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRelatedProducts
};

