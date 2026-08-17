import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
    // User who placed the order
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    // Products in the order
    items:[
        {
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        name:{
            type: String,
            required: true,
        },

        image:{
            type: String,
            default: "",
        },

        price:{
            type: Number,
            required: true,
            min: 0,
        },

        quantity:{
            type: Number,
            required: true,
            min: 1,
        },
        },
    ],

    // Total amount of products
    subtotal:{
        type: Number,
        required: true,
        min: 0,
    },

    // Shipping charges mins Delivery charge
    shippingPrice:{
        type: Number,
        default: 0,
        min: 0,
    },

    // Tax
    taxPrice:{
        type: Number,
        default: 0,
        min: 0,
    },

    // Final amount
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Delivery address
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      address: {
        type: String,
        required: true,
        trim: true,
      },

      city: {
        type: String,
        required: true,
        trim: true,
      },

      state: {
        type: String,
        required: true,
        trim: true,
      },

      postalCode: {
        type: String,
        required: true,
        trim: true,
      },

      country: {
        type: String,
        required: true,
        default: "India",
        trim: true,
      },
    },

    // Payment information
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // Order status
    orderStatus: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PLACED",
    },

    // Payment transaction/order ID
    paymentId: {
      type: String,
      default: "",
    },

    // When order was delivered
    deliveredAt: {
      type: Date,
      default: null,
    },

    // When order was cancelled
    cancelledAt: {
      type: Date,
      default: null,
    },

    // Optional cancellation reason
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model("Order", orderSchema);