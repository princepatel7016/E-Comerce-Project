import { asyncHandler } from  "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.js";
import {uploadoncloudinary} from "../utils/cloudnary.js";
import {ApiResponse} from "../utils/apiResponse.js"

const signupUser = asyncHandler(async (req, res) => {

    const {username, email, password, phone,} = req.body;
    
    if (!username || !email || !password || !phone) {
        throw new ApiError(400, "All fields are required");
    }

    // Check user already exists
    const existingUser = await User.findOne({
        $or: [
            { phone },
            { email }
        ],
    });

    if (existingUser) {
        throw new ApiError( 409,  "phon no and email is already exists");
    }


    let avatarUrl = "";

    if (req.files?.avatar?.[0]?.path) {

    const avatarlocalpath = req.files.avatar[0].path;
    const avatar = await uploadoncloudinary(avatarlocalpath);

    if (avatar) {
         avatarUrl = avatar.url;
    }
}


    // Create user
    const user = await User.create({
        username: username.toLowerCase(), 
        email: email.toLowerCase(),
        password,
        phone,
        avatar: avatarUrl
    });

    // Remove sensitive fields from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {throw new ApiError(500, "Something went wrong while creating user");
    }

    return res.status(201).json(
        new ApiResponse( 201, createdUser,"User registered successfully")
    );
});



export {
   signupUser
}