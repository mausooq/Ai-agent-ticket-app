import express from 'express';
import { createTicket, deleteTicket, getTicket, getTickets } from "../controllers/ticket.js";
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/',authMiddleware,getTickets)
router.get('/:id',authMiddleware,getTicket)

router.post('/',authMiddleware,createTicket)
router.delete('/:id', authMiddleware, deleteTicket);

export default router;

