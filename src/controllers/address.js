import { Address } from "../models/address.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @desc    Add a new delivery address
 * @route   POST /api/v1/addresses
 * @access  Private
 */
const createAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phoneNumber,
    pincode,
    houseNumber,
    street,
    city,
    state,
    landmark,
    addressType,
    isDefault
  } = req.body;

  if (!fullName || !phoneNumber || !pincode || !houseNumber || !street || !city || !state) {
    throw new ApiError(400, "All required address fields must be provided");
  }

  // Check if this is the user's first address
  const addressCount = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = addressCount === 0 || isDefault === true;

  // If new address is default, reset all existing addresses to non-default
  if (shouldBeDefault) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    user: req.user._id,
    fullName: fullName.trim(),
    phoneNumber: phoneNumber.trim(),
    pincode: pincode.trim(),
    houseNumber: houseNumber.trim(),
    street: street.trim(),
    city: city.trim(),
    state: state.trim(),
    landmark: landmark?.trim() || "",
    addressType: addressType || "home",
    isDefault: shouldBeDefault
  });

  return res
    .status(201)
    .json(new ApiResponse(201, address, "Delivery address added successfully"));
});

/**
 * @desc    Get all addresses for logged-in user
 * @route   GET /api/v1/addresses
 * @access  Private
 */
const getUserAddresses = asyncHandler(async (req, res) => {
  // Sort default address first, followed by newest
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    createdAt: -1
  });

  return res
    .status(200)
    .json(new ApiResponse(200, addresses, "Addresses fetched successfully"));
});

/**
 * @desc    Get single address by ID
 * @route   GET /api/v1/addresses/:addressId
 * @access  Private
 */
const getAddressById = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) {
    throw new ApiError(404, "Address not found or not authorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, address, "Address fetched successfully"));
});

/**
 * @desc    Update delivery address
 * @route   PATCH /api/v1/addresses/:addressId
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const updates = { ...req.body };

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  if (updates.isDefault === true) {
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  }

  Object.assign(address, updates);
  await address.save();

  return res
    .status(200)
    .json(new ApiResponse(200, address, "Address updated successfully"));
});

/**
 * @desc    Delete delivery address
 * @route   DELETE /api/v1/addresses/:addressId
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const address = await Address.findOneAndDelete({
    _id: addressId,
    user: req.user._id
  });

  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // If deleted address was default, promote another address to default
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Address deleted successfully"));
});

/**
 * @desc    Set specific address as default delivery address
 * @route   PATCH /api/v1/addresses/:addressId/default
 * @access  Private
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) {
    throw new ApiError(404, "Address not found");
  }

  // Set all to false, then target address to true
  await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  return res
    .status(200)
    .json(new ApiResponse(200, address, "Default delivery address updated"));
});

export {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};

