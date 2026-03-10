import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import contactRouter from "./routes/contactRouter.js";

dotenv.config();
const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
    throw new Error("MONGO_URL is missing. Set it in your environment (.env)");
}

mongoose.connect(mongoUrl);

let connection =  mongoose.connection
connection.once("open", ()=>{
    console.log("MongoDB connected successfully ✅")
});

app.use("/api/contact", contactRouter)

const port = Number(process.env.PORT || 3002);
app.listen(port,()=>{
    console.log(`Server is running on PORT ${port} 🚀`)
});
