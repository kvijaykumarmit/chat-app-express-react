const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    media_files: {
        type: [String], // Array of file URLs or paths (images/videos)
        default: []
    },
    viewed_at: {
        type: Date,
        default: null
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },  versionKey: false});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
