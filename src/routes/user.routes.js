import {Router} from "express"
import { signupUser , loginUser } from "../controllers/user.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.route("/signup").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    signupUser
)

router.route("/login").post(loginUser)

export default router