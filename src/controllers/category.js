import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

// Helper function to create URL-safe slug from name
const createSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * @desc    Create a new Category (Root or Subcategory)
 * @route   POST /api/v1/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Category name is required");
  }

  const slug = createSlug(name);

  // Check duplicate slug or name
  const existingCategory = await Category.findOne({
    $or: [{ name: name.trim() }, { slug }]
  });

  if (existingCategory) {
    throw new ApiError(409, "A category with this name or slug already exists");
  }

  // Handle category thumbnail image upload if present
  let imageUrl = "";
  const imageLocalPath = req.file?.path || req.files?.image?.[0]?.path;
  if (imageLocalPath) {
    const uploadResult = await uploadOnCloudinary(imageLocalPath, "categories");
    if (uploadResult) {
      imageUrl = uploadResult.secure_url || uploadResult.url;
    }
  }

  // Verify parentCategory if provided
  let parent = null;
  if (parentCategory) {
    const parentExists = await Category.findById(parentCategory);
    if (!parentExists) {
      throw new ApiError(404, "Parent category not found");
    }
    parent = parentExists._id;
  }

  const category = await Category.create({
    name: name.trim(),
    slug,
    description: description?.trim() || "",
    image: imageUrl,
    parentCategory: parent
  });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

/**
 * @desc    Get all active categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .populate("parentCategory", "name slug")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count: categories.length, categories },
        "Categories fetched successfully"
      )
    );
});

/**
 * @desc    Get category by ID or Slug
 * @route   GET /api/v1/categories/:idOrSlug
 * @access  Public
 */
const getCategoryByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;

  // Check if param is valid MongoDB ObjectId, else search by slug
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const query = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug.toLowerCase() };

  const category = await Category.findOne(query).populate("parentCategory", "name slug");

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

/**
 * @desc    Update an existing category
 * @route   PATCH /api/v1/categories/:categoryId
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { name, description, parentCategory, isActive } = req.body;

  const category = await Category.findById(categoryId);
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (name?.trim()) {
    category.name = name.trim();
    category.slug = createSlug(name);
  }

  if (description !== undefined) {
    category.description = description.trim();
  }

  if (isActive !== undefined) {
    category.isActive = Boolean(isActive);
  }

  if (parentCategory !== undefined) {
    category.parentCategory = parentCategory || null;
  }

  // Handle image update
  const imageLocalPath = req.file?.path || req.files?.image?.[0]?.path;
  if (imageLocalPath) {
    const uploadResult = await uploadOnCloudinary(imageLocalPath, "categories");
    if (uploadResult) {
      category.image = uploadResult.secure_url || uploadResult.url;
    }
  }

  await category.save();

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

/**
 * @desc    Delete category
 * @route   DELETE /api/v1/categories/:categoryId
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  // Check if any products are using this category
  const productsCount = await Product.countDocuments({ category: categoryId });
  if (productsCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. It is assigned to ${productsCount} product(s). Please reassign or delete the products first.`
    );
  }

  const deletedCategory = await Category.findByIdAndDelete(categoryId);
  if (!deletedCategory) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export {
  createCategory,
  getAllCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  deleteCategory
};

