import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({path:".env"});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
  try{
    localFilePath= localFilePath.replace(/\\/g, "/");
    if(!localFilePath) return null;
    // console.log("localFilePath: ", localFilePath);
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {resource_type:"auto"});

    //file has been uploaded successfully
    console.log("file is uploaded on cloudinary!" );
    return response;
  } catch (e) {
    console.error(e);
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as upload operation failed
    return null;
  }
}

const deleteFromCloudinary = async (cloudinaryFilePath)=>{
  try{
    if(!cloudinaryFilePath) return null;
    const fileName = cloudinaryFilePath.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(fileName);
    console.log(response);
    return response;
  } catch (e) {
    console.log("deleteFromCloudinary error: ",e);
    return null;
  }
}

export { uploadOnCloudinary, deleteFromCloudinary };
