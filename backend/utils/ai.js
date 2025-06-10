import { createAgent, gemini } from "@inngest/agent-kit";

const analyzeTicket = async (ticket) => {
  try {
    console.log("Starting AI analysis for ticket:", ticket.title);
    
    const supportAgent = createAgent({
      model: gemini({
        model: "gemini-1.5-flash-8b",
        apiKey: process.env.GEMINI_API_KEY,
      }),
      name: "AI Ticket Triage Assistant",
      system: `You are an expert AI assistant that processes technical support tickets. 
      Your job is to analyze tickets and return a JSON object with the following structure:
      {
        "summary": "Brief summary of the issue",
        "priority": "low/medium/high",
        "helpfulNotes": "Technical explanation and resources",
        "relatedSkills": ["skill1", "skill2"]
      }`,
    });

    const prompt = `Analyze this support ticket and return a JSON object:
    Title: ${ticket.title}
    Description: ${ticket.description}
    
    Return ONLY a JSON object with these fields:
    - summary: Brief summary of the issue
    - priority: One of "low", "medium", or "high"
    - helpfulNotes: Technical explanation and resources
    - relatedSkills: Array of relevant technical skills`;

    console.log("Sending prompt to AI:", prompt);
    
    const response = await supportAgent.run(prompt);
    console.log("Raw AI Response:", response);

    // Get the raw response text from the first output
    const rawResponse = response.output[0]?.content || '';
    console.log("Raw Response Text:", rawResponse);

    // Extract JSON from markdown code blocks
    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1].trim();
        console.log("Extracted JSON string:", jsonStr);
        const parsedResponse = JSON.parse(jsonStr);
        console.log("Successfully parsed JSON response:", parsedResponse);
        return parsedResponse;
      } catch (e) {
        console.log("Failed to parse extracted JSON:", e.message);
      }
    }

    // If no code blocks found, try direct parsing
    try {
      const parsedResponse = JSON.parse(rawResponse);
      console.log("Successfully parsed direct JSON response:", parsedResponse);
      return parsedResponse;
    } catch (e) {
      console.log("Direct parse failed:", e.message);
    }

    // If all parsing attempts fail, return a default response
    console.log("All parsing attempts failed, returning default response");
    return {
      summary: "Failed to analyze ticket",
      priority: "medium",
      helpfulNotes: "AI analysis failed. Please review manually.",
      relatedSkills: []
    };
  } catch (error) {
    console.error("Error in analyzeTicket:", error);
    return {
      summary: "Failed to analyze ticket",
      priority: "medium",
      helpfulNotes: "AI analysis failed. Please review manually.",
      relatedSkills: []
    };
  }
};

export default analyzeTicket;