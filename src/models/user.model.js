import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({

  username:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password:{
    type: String,
    required: [true, 'Password is required'],
  },
  fullName:{
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  avatar:{
    type: String, // cloudinary url
    required: true,
  },
  coverImage:{
    type: String,
  },
  refreshToken:{
    type: String,
  },
  watchHistory:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
    }
  ]
  },
  {timestamps: true});

UserSchema.pre("save", async function(next){
  if(!this.isModified("password")){
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
})

UserSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateAccessToken = async function(){
  jwt.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

UserSchema.methods.generateRefreshToken = async function(){
  jwt.sign({
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", UserSchema);