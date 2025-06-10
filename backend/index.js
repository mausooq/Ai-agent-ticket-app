import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { serve } from 'inngest/express';
import mongoose from 'mongoose';
import { inngest } from './inngest/client.js';
import { onUserSignup } from './inngest/functions/on-signup.js';
import { onTicketCreate } from './inngest/functions/on-ticket-create.js';
import ticketRoute from './routes/ticket.js';
import userRoute from './routes/user.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_ALT
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS policy violation'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/auth', userRoute);
app.use('/api/tickets', ticketRoute);
app.use('/api/inngest', serve({
    client: inngest,
    functions: [onUserSignup, onTicketCreate]
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        app.listen(PORT, () => {
            // Silent startup in production
        });
    } catch (err) {
        if (retries > 0) {
            setTimeout(() => connectDB(retries - 1), 5000);
        } else {
            process.exit(1);
        }
    }
};

connectDB();






