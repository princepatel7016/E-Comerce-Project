import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true
    },

    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true
    },

    brand: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      index: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
      index: true
    },

    images: [
      {
        type: String // Cloudinary URLs
      }
    ],

    thumbnail: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      required: [true, "Product regular price is required"],
      min: [0, "Price cannot be negative"]
    },

    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (value) {
          // Discount price must be less than regular price if provided
          return !value || value < this.price;
        },
        message: "Discount price ({VALUE}) must be strictly less than the regular price"
      }
    },

    stock: {
      type: Number,
      required: [true, "Product stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },

    specifications: [
      {
        key: { type: String, trim: true },
        value: { type: String, trim: true }
      }
    ],

    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    numReviews: {
      type: Number,
      default: 0,
      min: 0
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Virtual field to get final effective selling price
productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice !== null && this.discountPrice < this.price
    ? this.discountPrice
    : this.price;
});

// Virtual field for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.discountPrice && this.discountPrice < this.price) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export const Product = mongoose.model("Product", productSchema);
export default Product;
