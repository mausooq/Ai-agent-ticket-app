import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";
import analyzeTicket from "../utils/ai.js";

export const createTicket = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title || !description) {
            return res.status(400).json({ message: "title and description required" });
        }

        // Create the ticket first
        const newTicket = await Ticket.create({
            title,
            description,
            createdBy: req.user._id,
            status: "TODO"
        });

        // Send the event to Inngest
        await inngest.send({
            name: "ticket/created",
            data: {
                ticketId: newTicket._id,
                title,
                description,
                createdBy: req.user._id
            }
        });

        // Process AI analysis immediately
        try {
            const aiResponse = await analyzeTicket(newTicket);
            if (aiResponse) {
                await Ticket.findByIdAndUpdate(newTicket._id, {
                    priority: aiResponse.priority || "medium",
                    helpfulNotes: aiResponse.helpfulNotes || "",
                    relatedSkills: aiResponse.relatedSkills || [],
                    status: "IN_PROGRESS"
                });
            }
        } catch (aiError) {
            console.error("AI processing error:", aiError);
            // Continue with the response even if AI processing fails
        }

        // Fetch the updated ticket
        const updatedTicket = await Ticket.findById(newTicket._id)
            .populate("createdBy", "email")
            .populate("assignedTo", "email");

        return res.json({ 
            message: "ticket created and processing started", 
            ticket: updatedTicket 
        });
    } catch (err) {
        console.error("ticket creating error:", err.message);
        return res.status(500).json({ message: "Internal server Error" });
    }
}

export const getTickets = async (req,res) => {
    try {
        const user = req.user;
        let tickets = [];
        if(user.role !== "user"){
            tickets = await Ticket.find({})
            .populate("assignedTo", ["email","_id"])
            .sort({createdAt : -1});
        } else {
            tickets = await Ticket.find({createdBy : user._id})
            .select("title description status createdAt")
            .sort({createdAt : -1});
        }   
        return res.status(200).json({ tickets });
    } catch (err) {
        console.log("ERROR fetching Tickets ", err.message);
        return res.status(500).json({ message: "Internal server Error" });
    }
}

export const getTicket = async (req,res) => {
    try {
        const user = req.user;
        let ticket;
        if(user.role !== "user"){
            ticket = await Ticket.findById(req.params.id)
            .populate("assignedTo", ["email","_id"]);
        } else {
            ticket = await Ticket.findOne({createdBy : user._id, _id : req.params.id})
            .select("title description status createdAt");
        }   
        if(!ticket){
            return res.status(404).json({ message: "ticket not found" });
        }
        return res.status(200).json({ ticket });
    } catch (err) {
        console.log("ERROR fetching ticket", err.message);
        return res.status(500).json({ message: "Internal server Error" });
    }
}