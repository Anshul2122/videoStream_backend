import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  cloud_apikey: process.env.CLOUDINARY_API_KEY,
  cloud_secret: process.env.CLOUDINARY_SECRET_KEY,
})

const uploadOnCloudinary = async (localFilePath)=>{
  try{
    if(!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {resource_type:"auto"});
    //file has been uploaded successfully
    console.log(response.url);
    console.log("file is uploaded on cloudinary!" );
    return response;
  } catch (e) {
    fs.unlinkSync(localFilePath); // remove the locally saved temp file as upload operation falied
    return null;
  }
}

export { uploadOnCloudinary };
