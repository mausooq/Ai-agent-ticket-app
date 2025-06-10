dotenv.config();
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { serve } from 'inngest/express';
import userRoute from './routes/user.js';
import ticketRoute from './routes/ticket.js';
import { inngest } from './inngest/client.js';
import { onUserSignup } from './inngest/functions/on-signup.js';
import { onTicketCreate } from './inngest/functions/on-ticket-create.js';

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', userRoute)
app.use('/api/tickets', ticketRoute)

app.use('/api/inngest', serve({
    client:inngest,
    functions :[onUserSignup, onTicketCreate ]
}));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}
).catch((err) => {
    console.error('MongoDB connection error:', err);
}
);






