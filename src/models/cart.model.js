import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity cannot be less than 1"],
      default: 1
    },

    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    items: [cartItemSchema],

    totalPrice: {
      type: Number,
      default: 0,
      min: 0
    },

    totalItems: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Method to recalculate totals
cartSchema.methods.calculateTotals = function () {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
