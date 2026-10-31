import { Router } from "express";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "../controllers/address.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All address routes require authentication
router.use(verifyJWT);

router.route("/").get(getUserAddresses).post(createAddress);
router.route("/:addressId").get(getAddressById).patch(updateAddress).delete(deleteAddress);
router.patch("/:addressId/default", setDefaultAddress);

export default router;
