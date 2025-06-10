import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import analyzeTicket from "../../utils/ai.js";
import { sendEmail } from "../../utils/mailer.js";
import { inngest } from "../client.js";

export const onTicketCreate = inngest.createFunction(
    {id: "on-ticket-created"},
    { event: "ticket/created" },
    async ({ event, step }) => {
        try {
            const { ticketId } = event.data;

            const ticket = await step.run("fetch-ticket", async () => {
                const ticketObj = await Ticket.findById(ticketId);
                
                if (!ticketObj) {
                    throw new Error("Ticket not found");
                }
                return ticketObj;
            });
           
            await step.run("update-ticket-status", async () => {
                await Ticket.findByIdAndUpdate(ticket._id, {
                    status: "TODO"
                });
            });

            const aiResponse = await analyzeTicket(ticket);
            console.log("AI Response:", aiResponse); // Debug log

            const relatedSkills = await step.run("ai-processing", async () => {
                let skills = [];
                if (aiResponse && typeof aiResponse === 'object') {
                    await Ticket.findByIdAndUpdate(ticket._id, {
                        priority: !["low", "medium", "high"].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
                        helpfulNotes: aiResponse.helpfulNotes || "",
                        status: "IN_PROGRESS",
                        relatedSkills: Array.isArray(aiResponse.relatedSkills) ? aiResponse.relatedSkills : []
                    });
                    skills = Array.isArray(aiResponse.relatedSkills) ? aiResponse.relatedSkills : [];
                }
                return skills;
            });

            const moderator = await step.run("assign-moderator", async () => {
                let user = null;
                
                if (relatedSkills && relatedSkills.length > 0) {
                    user = await User.findOne({
                        role: "moderator",
                        skills: {
                            $in: relatedSkills
                        }
                    });
                }

                if (!user) {
                    user = await User.findOne({
                        role: 'admin'
                    });
                }

                if (user) {
                    await Ticket.findByIdAndUpdate(ticket._id, {
                        assignedTo: user._id
                    });
                }
                return user;
            });

            if (moderator) {
                await step.run("send-email-notification", async () => {
                    const finalTicket = await Ticket.findById(ticket._id);
                    await sendEmail({
                        to: moderator.email,
                        subject: "Ticket Assigned",
                        text: `A new ticket has been assigned to you:\n\nTitle: ${finalTicket.title}\nDescription: ${finalTicket.description}\nPriority: ${finalTicket.priority}\nStatus: ${finalTicket.status}`
                    });
                });
            }

            return { success: true, ticketId: ticket._id };

        } catch (error) {
            console.error("Error in ticket processing:", error.message);
            return { success: false, error: error.message };
        }
    }
);