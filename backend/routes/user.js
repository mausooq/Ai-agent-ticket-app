import express from 'express';
import { getUser, login, logout, signup, updateUser } from '../controllers/user.js';

import { authMiddleware } from '../middlewares/auth.js';
const router = express.Router();

router.get('/update-user',authMiddleware,updateUser)
router.get('/users',authMiddleware,getUser)

router.post('/signup',signup);
router.post('/login',login);
router.post('/logout',logout)


export default router;