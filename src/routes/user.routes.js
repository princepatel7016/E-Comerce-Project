import {Router} from "express"
import { signupUser } from "../controllers/user.js"

const router = Router()

router.route("/signup").post(signupUser)

export default router