import User from "../../models/user.js";
import { sendEmail } from "../../utils/mailer.js";
import { inngest } from "../client.js";


export const onUserSignup = inngest.createFunction(
    {id : "on-user-signup",retries:2},
    { event: "user/signup" },
    async ({event,step}) => {
        try {
            const {email} = event.data;
            const user =  await step.run("get-user-email",async ()=>{

               const userObj = await User.findOne({email});

               if(!userObj) {
                   throw new Error("User not found");
               }
                    return userObj;
                })

                await step.run("send-welcome-email", async () => {
                    const subject = "Welcome to Ticket AI System";
                    const text = `Hello,\n\nWelcome to our Ticket AI System! We're excited to have you on board.\n\nYour account has been successfully created with the email: ${user.email}\n\nBest regards,\nThe Ticket AI Team`;

                    await sendEmail({
                        to: user.email,
                        subject,
                        text,
                    });

                    console.log(`Sending welcome email to ${user.email}`);
                });
                return {success: true, user};
            }

        catch (error) {
            console.error("Error handling user signup:", error);
            throw new Error("Failed to handle user signup");
        }
    }
)