import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express"
import {app} from './app.js'



//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./.env'
})

connectDB()  //ye async use kiye hai to promise bhi return karega isliye
.then(()=>{
    app.listen(process.env.PORT || 8080,()=>{
        console.log(`Server is running at port :${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!!",err);
    
})
