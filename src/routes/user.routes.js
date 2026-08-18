import {Router} from "express"
import { signupUser } from "../controllers/user.js"
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

export default router