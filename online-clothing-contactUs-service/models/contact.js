import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
    },

    name: {
        type: String,
        required: true, 
        trim: true, //in a Mongoose String field automatically removes leading and trailing whitespace from the value before it’s saved to MongoDB; it does not remove spaces inside the string ("KV Audio" stays "KV Audio").
        
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true, //lowercase: true in a Mongoose String field automatically converts the string to lowercase before saving.
    },

    phone: {
        type: String,
        default: "",
        trim: true,
    },

    subject: {
        type: String,
        required: true,
        trim: true,
    },

    message: {
        type: String,
        required: true,
        trim: true,
    },

    isResolved: {
        type: Boolean,
        required: true,
        default: false,
    },

    createdAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
});

const ContactMessage = mongoose.model("contact_messages", contactMessageSchema);

export default ContactMessage;
