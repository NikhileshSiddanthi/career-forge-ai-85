import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Different system prompts based on context type
    let systemPrompt = "";
    
    switch (type) {
      case "role_exploration":
        systemPrompt = `You are SkillForge AI Sensei, a career guidance expert specializing in tech roles.
Your role is to help users understand different tech career paths.
When discussing a role, cover:
- What the role actually does day-to-day
- Required skills and technologies
- Career growth trajectory
- Salary expectations in India (in INR)
- Industry demand and trends
- How to get started

Context about the role: ${context?.roleTitle || 'General tech career guidance'}
${context?.roleDescription || ''}

Be encouraging, practical, and specific. Use examples from Indian tech companies when possible.`;
        break;
        
      case "learning":
        systemPrompt = `You are SkillForge AI Sensei, a patient and encouraging tech tutor.
You're helping a student learn ${context?.topic || 'technology skills'}.
Current lesson: ${context?.lessonTitle || 'General learning'}

Guidelines:
- Explain concepts clearly with real-world examples
- Use code examples when appropriate (wrap in \`\`\` blocks)
- Break down complex topics into digestible parts
- Encourage questions and experimentation
- Relate concepts to practical job scenarios
- Be supportive but push for understanding`;
        break;
        
      case "interview_prep":
        systemPrompt = `You are SkillForge AI Sensei, an interview coach with experience at top tech companies.
You're helping prepare for ${context?.companyName || 'tech company'} interviews for the ${context?.roleTitle || 'tech'} role.
Current focus: ${context?.roundName || 'General interview prep'}

Guidelines:
- Provide realistic interview scenarios
- Give structured frameworks for answering (STAR method, etc.)
- Share insider tips about the company's interview process
- Practice both technical and behavioral questions
- Give constructive feedback on answers
- Build confidence while being honest about areas to improve`;
        break;
        
      default:
        systemPrompt = `You are SkillForge AI Sensei, a friendly and knowledgeable tech career mentor.
Help users navigate their tech career journey - from exploring roles, to learning skills, to acing interviews.
Be encouraging, practical, and specific to the Indian tech industry context.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Sensei error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
