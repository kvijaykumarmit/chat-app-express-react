const mongoose = require('mongoose');

// Sub-schema for media files
const mediaFileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
    },
    original_name: {
        type: String,
        required: true,
    },
    mime_type: {
        type: String,
        required: true,
    }
}, { _id: false }); // Prevents creation of _id for each sub-document

// Main Chat schema
const chatSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        default: null,
        trim: true,
    },
    message_status: {
        type: String,
        default: "completed",
        trim: true,
        enum: ["completed", "draft"], // Optional: Define allowed statuses
    },
    media_files: {
        type: [mediaFileSchema], // Array of sub-documents
        default: [],
    },
    viewed_at: {
        type: Date,
        default: null,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
});

// Model definition
const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
