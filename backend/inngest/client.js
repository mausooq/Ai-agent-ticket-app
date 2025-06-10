import { Inngest } from "inngest";

export const inngest = new Inngest({
    id: "ticketing-system",
    apiKey: process.env.INNGEST_API_KEY
});

