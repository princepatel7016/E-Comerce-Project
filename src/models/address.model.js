import mongoose from "mongoose";
import { ADDRESS_TYPES } from "../constants/index.js";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    fullName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true
    },

    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true
    },

    pincode: {
      type: String,
      required: [true, "PIN Code is required"],
      trim: true,
      match: [/^[0-9]{6}$/, "Pincode must be exactly 6 digits"]
    },

    houseNumber: {
      type: String,
      required: [true, "Flat, House no., Building, Company, Apartment is required"],
      trim: true
    },

    street: {
      type: String,
      required: [true, "Area, Street, Sector, Village is required"],
      trim: true
    },

    city: {
      type: String,
      required: [true, "City/Town is required"],
      trim: true
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true
    },

    landmark: {
      type: String,
      default: "",
      trim: true
    },

    addressType: {
      type: String,
      enum: Object.values(ADDRESS_TYPES),
      default: ADDRESS_TYPES.HOME
    },

    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const Address = mongoose.model("Address", addressSchema);
export default Address;
