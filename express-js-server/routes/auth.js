const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const User = require('../models/user.model');

require('dotenv').config();

router.post('/', async (req, res) => {
    const { email, password } = req.body;  
    try {
    
      const user = await User.findOne({email:email},{_id:1, email:1, first_name:1, last_name:1, password:1}).lean();      
      if (!user) {
        return res.status(401).json({ message: 'Authentication failed: User not found' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);    
      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: 'Authentication failed: Incorrect password',
          error: { password: "INVALID PASSWORD" },
          errorType: "Validation Error" 
        });
      }

      const userTokenAuthData = { 
        _id: user._id, 
        email: user.email, 
        first_name: user.first_name, 
        last_name: user.last_name 
      };
      const accessToken = jwt.sign(userTokenAuthData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign(userTokenAuthData, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, sameSite: 'Lax' });
      res.status(200).json({ accessToken, user:userTokenAuthData});  
      
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Server error', error });
    }
});

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);  
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const userTokenAuthData = { _id: user._id, email: user.email, first_name:user.first_name, last_name:user.last_name };
      const accessToken = jwt.sign(userTokenAuthData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      res.json({ accessToken, user:userTokenAuthData });
    });
});

router.get('/session', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        console.error("JWT Error:", err);
        return res.status(403).json({ error: 'Invalid or expired refresh token' });
      }

      const userTokenAuthData = { 
        _id: user._id, 
        email: user.email, 
        first_name: user.first_name, 
        last_name: user.last_name 
      };

      const accessToken = jwt.sign(userTokenAuthData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

      // Optionally log access token details but remove in production 
      res.json({ 
        accessToken, 
        user: userTokenAuthData 
      });
    });
  } else {
    res.status(401).json({ error: 'No active session' });
  }
});


// Logout route
router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});

module.exports = router;