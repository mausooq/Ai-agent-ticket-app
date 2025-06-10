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
app.use(helmet()); // Adds various HTTP headers for security

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',  // Local development
    'http://localhost:80',    // Local production
    'https://ai-agent-ticket-app.vercel.app',  // Vercel deployment
    'https://www.ai-agent-ticket-app.vercel.app',  // Vercel deployment with www
    process.env.FRONTEND_URL, // Additional frontend URL if needed
    process.env.FRONTEND_URL_ALT // Alternative frontend URL if needed
].filter(Boolean); // Remove any undefined values

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('Request with no origin - allowing');
            return callback(null, true);
        }
        
        console.log('Checking CORS for origin:', origin);
        console.log('Allowed origins:', allowedOrigins);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Blocked by CORS:', origin);
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        console.log('Origin allowed:', origin);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10kb' })); // Limit body size

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
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : err.message
    });
});

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to MongoDB');
        
        // Start server only after DB connection
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        if (retries > 0) {
            console.log(`Retrying connection... (${retries} attempts left)`);
            setTimeout(() => connectDB(retries - 1), 5000);
        } else {
            console.error('Failed to connect to MongoDB after multiple attempts');
            process.exit(1);
        }
    }
};

connectDB();






