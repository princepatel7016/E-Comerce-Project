import mongoose from "mongoose"

const userschema = new mongoose.Schema(
    {
        username:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim: true,
            index: true
        },

        email:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim: true,
        },

        password:{
            type: String,
            required:true
        },

        avatar: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            trim: true,
            required:true,
        },

        address: {
            street: {
                type: String,
                trim: true,
                default: "",
            }
        },

        city:{
            type: String,
            trim: true,
            default: "",
        },

        state:{
            type: String,
            trim: true,
            default: "",
        },

        pincode:{
            type: String,
            trim: true,
            default: "",
        },

        country:{
            type: String,
            trim: true,
            default: "INDIA",
        },


        refreshToken:{
            type: String
        }
    },
    {
        timestamps:true
    }
)


export const User = mongoose.model("User", userschema)