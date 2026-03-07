import express from "express";
import { createContactMessage, getAllContactMessages, resolveContactMessage  } from "../controllers/contactController.js";

const contactRouter = express.Router();

contactRouter.post("/", createContactMessage);
contactRouter.get("/", verifyAdmin, getAllContactMessages);            
contactRouter.patch("/:id/resolve", verifyAdmin, resolveContactMessage);

export default contactRouter;