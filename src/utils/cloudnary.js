 import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

dotenv.config({
    path: "./.env"
})

cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET
});


const uploadoncloudinary = async (localfilepath)=>{
    try{
        if(!localfilepath) return null
        //  uplod the file on clodinary
        const response = await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        //file hase been scussfully uploaded
        // console.log("file has uploaded on cloudinary", response.url);
        fs.unlinkSync(localfilepath)
        return response;

    }catch (error){
        
        console.log("========================");
        fs.unlinkSync(localfilepath)
        // remove the locally saved temporry file as the upload operation got failed
        return null;
    }

}

export{uploadoncloudinary}