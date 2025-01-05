const User = require('../models/user.model');
const Chat = require('../models/chat.model');

async function loadAllChatMembers(req, res, _) {
    try {
        const ObjectId = require('mongoose').Types.ObjectId;
        const skip = req.query.skip ? Number(req.query.skip) : 0;
        const limit = req.query.limit ? Number(req.query.limit) : 50;       
        const totalCount = await User.countDocuments();
        const result = await User.aggregate([
            {
                $match: {_id: {$ne:(req.user.id?new ObjectId(req.user.id):null)}}
            },
            {
                $lookup: {
                    from: "chats", // The collection for chats
                    let: { sender_Id: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$sender_Id", "$$sender_Id"] } } },
                        { $sort: { created_at: -1 } }, // Sort chats by most recent first
                        { $limit: 1 } // Fetch only the most recent chat
                    ],
                    as: "recentChat"
                }
            },
            {
                $unwind: {
                    path: "$recentChat",
                    preserveNullAndEmptyArrays: true // If no chats, include user with null recentChat
                }
            },
            {
                $project: {
                    display_name:1,
                    email: 1,
                    name: 1,
                    mobile: 1,
                    recent_chat: {
                        message: "$recentChat.message",
                        created_at: "$recentChat.created_at",
                        media_files: "$recentChat.media_files"
                    }
                }
            },
            { $sort: { "recentChat.created_at": -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);     
        return res.json({
            totalCount: totalCount || 0,
            users: result,
            success: true
        });

    } catch (e) {       
        console.error(e); 
        return res.status(500).json({
            success: false,
            message: 'An error occurred while loading chat members.',
            error: e.message || e
        });
    }
}


async function conversations(req, res, _){
    try{
        const ObjectId = require('mongoose').Types.ObjectId;
        const skip = req.query.skip ? Number(req.query.skip) : 0;
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const userId = req.params.userId?new ObjectId(req.params.userId):null;
        const timeStamp = new Date();
        await Chat.updateMany({user_id:userId, viewed_at: null},{viewed_at: timeStamp}); 
        const totalCount = await Chat.countDocuments();
        const result = await Chat.aggregate([       
            {
                $match: {sender_id: req.user.id, receiver_id:userId}
            },     
            {
                $project: {
                    message: 1,
                    created_at: 1,
                    media_files: 1,
                    viewed_at: 1,
                    sender_Id: 1,
                    receiver_id: 1
                }
            },
            { $sort: { "created_at": -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);     
        return res.json({
            totalCount: totalCount || 0,
            messages: result,
            success: true
        });
    }catch(e){
        console.error(e); 
        return res.status(500).json({
            success: false,
            message: 'An error occurred.',
            error: e.message || e
        });
    }
}

async function newChat(req, res) {
    try {
        const ObjectId = require('mongoose').Types.ObjectId;
        const { message } = req.body;
        const userId = req.params.userId ? new ObjectId(req.params.userId) : null;

        // Validate message
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Message is required and must be a string.',
            });
        }

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Valid userId is required.',
            });
        }

        // Handle uploaded files
        const uploadedFiles = req.files?.map(file => ({
            path: file.path,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        })) || [];

        // Save the chat to the database
        const conversation = await new Chat({
            message: message.trim(),
            sender_id: req.user.id,
            receiver_id: userId,
            media_files: uploadedFiles, // Save file info if provided
        }).save();

        return res.status(201).json({
            success: true,
            message: conversation,
        });

    } catch (e) {
        console.error("Error in newChat:", e);
        return res.status(500).json({
            success: false,
            message: "An error occurred while creating the conversation.",
            error: e.message || e,
        });
    }
}


module.exports = {
    loadAllChatMembers,
    conversations,
    newChat
}