import { asyncHandler } from  "../utils/asynchandler.js";
import {ApiError} from "../utils/apiError.js"
import { User } from "../model/user.js";
import {uploadoncloudinary} from "../utils/cloudnary.js";
import {ApiResponse} from "../utils/apiResponse.js";
import {sendOtp, verifyOtp} from "../utils/twilio.js"

const genrateaccessandrefreshtoken = async(userid) => {
    try{
        const user = await User.findById(userid) // Database se pura user object aa gaya.
        const accesstoken = user.genrateAccessToken() //Access Token banana
        const refreshToken = user.genrateRefreshToken()

        
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})  //Refresh Token database me save karna

        return {accesstoken,refreshToken}

    }catch(error){
        throw new ApiError(500, "somthing went wrong while genrating refresh and acess token" )
    }
}

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


    let avatar = "";
    if (req.files?.avatar?.[0]?.path) {

    const avatarLocalPath = req.files.avatar[0].path;
    const avatarResponse = await uploadoncloudinary(avatarLocalPath);

    if (avatarResponse) {
        avatar = avatarResponse.url;
    }
}


    // Create user
    const user = await User.create({
        username: username.toLowerCase(), 
        email: email.toLowerCase(),
        password,
        phone,
        avatar
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


const loginUser = asyncHandler(async (req,res)=>{
    
    const {phone , otp } = req.body
    
    if (!phone || !otp) {
        throw new ApiError(400, "Phone and OTP are required");
    }

    const user = await User.findOne({phone})

    if(!user){
        throw new ApiError(404,"User not found")
    }

    
    const verification = await verifyOtp(phone, otp);

    if (verification.status !== "approved") {
        throw new ApiError(401, "Invalid OTP");
    }

    const {accesstoken,refreshToken} = await genrateaccessandrefreshtoken(user._id)

    const loggedinuser = await User.findById(user._id).
          select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true 
    }

    return res
    .status(200)
    .cookie("accessToken", accesstoken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedinuser,
                accesstoken
            },
            "User logged in successfully"
        )
    );

})


export {
   signupUser,
    loginUser
}