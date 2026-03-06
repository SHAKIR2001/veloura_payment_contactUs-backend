import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

let mongoUrl = process.env.MONGO_URL;
mongoose.connect(mongoUrl);

let connection =  mongoose.connection
connection.once("open", ()=>{
    console.log("MongoDB connected successfully ✅")
});

app.listen(3002,()=>{
    console.log("Server is running on PORT 3002 🚀")
});
