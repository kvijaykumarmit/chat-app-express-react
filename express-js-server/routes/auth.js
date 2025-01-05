const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt =require('jsonwebtoken');
const User = require('../models/user.model');

require('dotenv').config();

router.post('/', async (req, res) => {
    const { email, password } = req.body;  
    try {
    
      const user = await User.findOne({email:email});      
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

      const accessToken = jwt.sign({ id: user._id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ id: user._id, email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  
      res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict' });
      res.status(200).json({ accessToken, user:{
        name: user.name,
        email: user.email
      }});  
      
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
      const accessToken = jwt.sign({  id: user._id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      res.json({ accessToken, user:{
        name: user.name,
        email: user.email
      } });
    });
});

router.get('/session', (req, res) => {
  const refreshToken = req.cookies.refreshToken;  
  if (refreshToken) {   
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = jwt.sign({  _id: user._id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
      res.json({ 
        accessToken, 
        user:{
          name: user.name,
          email: user.email
        } 
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