const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const mongoose = require('mongoose');
require('dotenv').config();

const Joi = require('joi');
const chatValidationSchema = Joi.object({
    message: Joi.string().optional().allow(''),
    userId: Joi.string().custom((value, helpers) => {   
        console.log("userId", value);

        if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.error("any.invalid");
        }
        return value;
    }).required().messages({ "any.invalid": `"userId" contains an invalid value`}),
    mode: Joi.string().valid('draft', 'completed').default('completed').optional(), // Optional, defaults to "completed"
});


async function loadAllChatMembers(req, res, _) {
    try {
        const ObjectId = mongoose.Types.ObjectId;
        const skip = req.query.skip ? Number(req.query.skip) : 0;
        const limit = req.query.limit ? Number(req.query.limit) : 50;       
        const totalCount = await User.countDocuments();
        const requestedUserId = req.user._id?new ObjectId(req.user._id):null;
        const result = await User.aggregate([
            {
                $match: {_id: {$ne:requestedUserId}}
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
        const ObjectId = mongoose.Types.ObjectId;     
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const userId = req.params.userId?new ObjectId(req.params.userId):null;
        const requestedUserId = req.user._id?new ObjectId(req.user._id):null;        
        const sortId = req.query.sortId?new ObjectId(req.query.sortId):null;
        const timeStamp = new Date();    
        await Chat.updateMany({user_id:userId, viewed_at: null},{viewed_at: timeStamp}); 
        const condition = {
            message_status: {$ne:"draft"},
            $or:[
                { sender_id:userId, receiver_id:requestedUserId },
                { receiver_id:userId, sender_id:requestedUserId }
            ]
        }; 
        const totalCount = await Chat.find(condition).countDocuments();   
        if(sortId){ 
            if(req.query.sort=="recent") condition['_id'] = {$gt:sortId}; 
            else condition['_id'] ={$lt:sortId}; 
        }       

        const result = await Chat.aggregate([       
            { $match: condition },     
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
            { $sort: { "_id": -1 } },         
            { $limit: limit },
            { $sort: { "_id": 1 } }
        ]);
      
        const draftCondition = {
            message_status: "draft",
            receiver_id: userId,
            sender_id: requestedUserId
        };
        
        const draftMessage = await Chat.findOne(draftCondition).lean();        
        if (draftMessage) {         
            if (Array.isArray(draftMessage.media_files) && draftMessage.media_files.length > 0) {   
                draftMessage.media_files = draftMessage.media_files.map((file) => { 
                    if (file && file.filename) {
                        file.preview = `${process.env.BASE_URL}/uploads/${file.filename}`;
                    } 
                    return file;
                });
            } 
        } 
        return res.json({
            totalCount: totalCount || 0,
            messages: result,
            draftMessage: draftMessage,
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
        const { message } = req.body;
        const { userId: userIdParam, mode } = req.params;
        const requestedUserId = req.user?._id;            
        const validation = chatValidationSchema.validate({ message, userId:userIdParam, mode }, { abortEarly: false });
        if (validation.error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors: validation.error.details.map(err => err.message),
            });
        }
        const ObjectId = mongoose.Types.ObjectId;     
        const userId = new ObjectId(userIdParam);    
        const condition = {
            message_status:  "draft",
            receiver_id: userId,
            sender_id: requestedUserId,
        };    

        // Handle uploaded files
        let uploadedFiles = [];
        let draftChat = await Chat.findOne(condition);
        if(mode === "draft"){
            uploadedFiles = req.files?.map(file => ({
                filename: file.filename, 
                original_name: file.originalname, 
                mime_type: file.mimetype,
                // url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`, // Construct the file URL
            })) || [];           
        }else{
            uploadedFiles = draftChat?(draftChat.media_files??[]):[]; 
        }

        console.log(draftChat);

        if (!((message??'').trim()) && uploadedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Either a message or at least one file upload is required.',
            });
        }

        const updateData = {
            message: message ? message.trim() : null,
            sender_id: new ObjectId(requestedUserId),
            receiver_id: userId,
            media_files: uploadedFiles,
            message_status: mode,
        };   
        const conversation = draftChat
        ? await Chat.findOneAndUpdate(condition, {$set:updateData}, { upsert: true, new: true })
        : await new Chat(updateData).save();  
        req.app.get('broadcast')('new-message', {
            type: 'conversation',
            message: conversation,
        }, `${userId}`);       
       
       
        return res.status(201).json({
            success: true,
            message: conversation,
        });

    } catch (error) {
        console.error("Error in newChat:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while creating the conversation.",
            error: error.message || error,
        });
    }
}

module.exports = {
    loadAllChatMembers,
    conversations,
    newChat
}