import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
   title: { type: String, required: true },
   description: { type: String, required: true },
   status: { type: String, default: 'TODO' },
   createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    priority: String,
    deadline: Date,
    helpfulNotes: { type: String, default: '' },
    relatedSkills: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
})

export default  mongoose.model('Ticket', ticketSchema);