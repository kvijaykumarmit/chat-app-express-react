var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const chatController = require('../controllers/chat.controller');

function uploadMiddleware(uploadDir = 'uploads/', fileSizeLimit = 50 * 1024 * 1024){   
    const multer = require('multer');
    const path = require('path');

    // Allowed MIME types
    const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', // Images
        'video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/webm', // Videos
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Documents
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
    ];

    // Multer configuration   
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file format: ${file.mimetype}`), false);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: fileSizeLimit },
    });
    
}
const upload = uploadMiddleware();



// Middleware to validate JWT
const validateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Unauthorized: Invalid or expired token' });
    }   
    req.user = user;
    next();
  });
};


router.get('/users', validateJWT,chatController.loadAllChatMembers);
router.get('/conversations/:userId',validateJWT, chatController.conversations);
router.post('/send/:userId',validateJWT, upload.array('files', 10), chatController.newChat);

module.exports = router;
