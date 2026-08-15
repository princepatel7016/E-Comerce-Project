import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
    name:{
        type: String,
        required: true,
        trim: true,
        },

    // slug:{
    //     type: String,
    //     required: true,
    //     unique: true,
    //     lowercase: true,
    //     trim: true,
    // },

    description:{
        type: String,
        required: true,
        trim: true,
    },

    price:{
        type: Number,
        required: true,
        min: 0,
    },

    discountPrice:{
        type: Number,
        default: null,
        min: 0,
    },

    images:[
        {
            type: String,
        },
    ],

    thumbnail:{
        type: String,
        required: true,
    },

    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    brand: {
        type: String,
        trim: true,
        default: "",
    },

    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },

    sku:{
        type: String,
        unique: true,
        trim: true,
        uppercase: true,
    },

    isActive:{
        //Product website par available hai ya nahi:
        type: Boolean,
        default: true,
    },

    isFeatured:{
        //Kuch products ko homepage par special section me dikhana ho:
        type: Boolean,
        default: false,
    },

    ratings:{
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },

    numReviews:{
        type: Number,
        default: 0,
        min: 0,
    },
    },

    {
    timestamps: true,
    }
);

export const Product = mongoose.model("Product", productSchema);