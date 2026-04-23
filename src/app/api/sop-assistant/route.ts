import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // allow up to 60s for Claude generation + scoring

// ── Types ─────────────────────────────────────────────────────────────────────

interface GenerateBody {
  action: "generate";
  university: string;
  course: string;
  degree_level: string;
  applicant_type: string;
  opening_hook: string;
  academic_prep: string;
  work_experience: string;
  why_degree: string;
  career_goals: string;
  why_university: string;
  extracurriculars: string;
  additional_notes: string;
}

interface ScoreBody {
  action: "score";
  sop_text: string;
  university: string;
  course: string;
}

type RequestBody = GenerateBody | ScoreBody;

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SOP service not configured" }, { status: 503 });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    if (body.action === "generate") {
      const {
        university, course, degree_level, applicant_type,
        opening_hook, academic_prep, work_experience, why_degree,
        career_goals, why_university, extracurriculars, additional_notes,
      } = body;

      const prompt = `You are an expert SOP writer for international university admissions. Generate a compelling, authentic Statement of Purpose (SOP) for:
- University: ${university}
- Program: ${course}
- Degree Level: ${degree_level}
- Applicant Type: ${applicant_type}

Student inputs:
- Opening hook / key experience: ${opening_hook}
- Academic preparation: ${academic_prep}
- Work/internship experience: ${work_experience}
- Why this degree/why now: ${why_degree}
- Career goals: ${career_goals}
- Why this university specifically: ${why_university}
- Extracurriculars/personality: ${extracurriculars}
- Additional notes: ${additional_notes}

CRITICAL GUIDELINES:
- Do NOT use childhood stories, quotes, or clichés
- Make it specific and authentic, NOT generic
- Use a concrete opening hook, not "Since childhood I have been passionate..."
- Show reflection and insight, not just a resume walkthrough
- Keep sections: Opening (100-150 words), Academic Prep (250-350 words), Professional Experience (150-300 words if applicable), Why This Degree (120-180 words), Career Goals (150-220 words), Why This University (150-220 words), Conclusion (40-80 words)
- Total: 800-1000 words for taught masters; connect all sections with a clear narrative arc

Return ONLY the SOP text. No preamble, no commentary.`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2000,
            temperature: 0.7,
            messages: [{ role: "user", content: prompt }],
          });
          break;
        } catch (apiErr: unknown) {
          const status = (apiErr as { status?: number })?.status;
          if ((status === 529 || status === 500) && attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1500));
            continue;
          }
          throw apiErr;
        }
      }

      if (!response) throw new Error("No response after retries");
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      return NextResponse.json({ sop: text });
    }

    if (body.action === "score") {
      const { sop_text, university, course } = body;

      const prompt = `You are a senior admissions officer at a top 100 global university. Evaluate this Statement of Purpose for ${course} at ${university} across 7 dimensions using the exact criteria below.

--- DIMENSION 1: CLARITY OF PURPOSE (Max: 2) ---
Evaluate the SOP specifically for Clarity of Purpose.
Scoring Criteria:
- Clear explanation of why the applicant chose this field
- Clear explanation of why they are applying now
- Logical connection between past experiences and future direction
- Avoidance of generic statements
Penalty Triggers: "I am passionate about…", "Since childhood…", no clear motivation.
Be precise and objective. Do NOT be lenient. Penalize generic, vague, or cliché content. Reward specificity, clarity, and depth.

--- DIMENSION 2: ACADEMIC & PROFESSIONAL READINESS (Max: 2) ---
Evaluate the SOP specifically for Academic and Professional Readiness.
Scoring Criteria:
- Evidence of relevant academic preparation
- Evidence of relevant work/project experience
- Demonstration of technical or domain skills
- Alignment between past experience and chosen program
Bonus: Quantified achievements, use of tools/technologies.

--- DIMENSION 3: DEPTH OF REFLECTION (Max: 1.5) ---
Evaluate the SOP specifically for Depth of Reflection.
Scoring Criteria:
- Evidence of learning from experiences
- Insights beyond description
- Ability to articulate challenges and growth
- Demonstration of critical thinking
Penalty: Listing experiences without reflection.

--- DIMENSION 4: CAREER GOALS (Max: 1.5) ---
Evaluate the SOP specifically for Career Goals.
Scoring Criteria:
- Clear short-term goal (role + industry)
- Logical long-term progression
- Realistic and credible goals
- Alignment with background
Penalty: Vague goals ("learn", "explore"), unrealistic ambitions.

--- DIMENSION 5: PROGRAM FIT (Max: 1.5) ---
Evaluate the SOP specifically for Program Fit.
Scoring Criteria:
- Specific mention of courses, curriculum, or specialization
- Clear alignment between program and career goals
- Demonstration of research into the program
Penalty: Generic statements like "Top ranked university" or "Excellent faculty".

--- DIMENSION 6: IMPACT & ACHIEVEMENTS (Max: 1) ---
Evaluate the SOP specifically for Impact and Achievements.
Scoring Criteria:
- Evidence of measurable impact
- Ownership of work
- Quantified outcomes (%, revenue, efficiency, etc.)
Penalty: Purely descriptive content with no outcomes.

--- DIMENSION 7: ORIGINALITY & AUTHENTICITY (Max: 0.5) ---
Evaluate the SOP specifically for Originality and Authenticity.
Scoring Criteria:
- Unique narrative voice
- Absence of clichés
- Personal storytelling
Penalty: Template-like writing, overused phrases.

--- AGGREGATE SCORING ---
After scoring all dimensions:
1. Calculate total score (sum of all dimensions, out of 10)
2. Classify into verdict:
   - 9–10: "Top Tier"
   - 7–8: "Competitive"
   - 5–6: "Borderline"
   - Below 5: "Reject Risk"
3. Provide 3 key strengths
4. Provide 3 key weaknesses
5. Provide 3 high-impact improvements

Also detect these common mistakes if present:
- Resume disguised as SOP (listing without reflection)
- Generic motivation ("I am passionate about technology")
- Weak career goals (vague or unrealistic)
- Poor "Why This University" section (generic rankings language, no specific courses named)
- Overuse of clichés ("Since childhood", "Technology is evolving rapidly")
- No narrative arc (disconnected paragraphs)
- Copy-paste or template-like language

Return ONLY valid JSON in exactly this format — no markdown, no preamble:
{
  "total_score": number (0-10, one decimal),
  "verdict": "Top Tier" | "Competitive" | "Borderline" | "Reject Risk",
  "verdict_description": "one sentence explaining the verdict",
  "dimension_scores": {
    "clarity_of_purpose": { "score": number, "max": 2, "feedback": ["point 1", "point 2"] },
    "academic_readiness": { "score": number, "max": 2, "feedback": ["point 1", "point 2"] },
    "depth_of_reflection": { "score": number, "max": 1.5, "feedback": ["point 1", "point 2"] },
    "career_goals": { "score": number, "max": 1.5, "feedback": ["point 1", "point 2"] },
    "program_fit": { "score": number, "max": 1.5, "feedback": ["point 1", "point 2"] },
    "impact_achievements": { "score": number, "max": 1, "feedback": ["point 1", "point 2"] },
    "originality": { "score": number, "max": 0.5, "feedback": ["point 1"] }
  },
  "red_flags": ["string"],
  "common_mistakes_detected": ["string"],
  "strengths": ["string"],
  "improvements": ["string with specific actionable fix"],
  "section_feedback": {
    "opening": "string",
    "academic": "string",
    "professional": "string",
    "why_degree": "string",
    "career_goals": "string",
    "why_university": "string",
    "conclusion": "string"
  },
  "generic_phrases_detected": [
    { "original": "exact phrase from the SOP", "suggested_rewrite": "specific, concrete alternative" }
  ],
  "word_count_estimate": number,
  "ready_to_submit": boolean
}

SOP TO EVALUATE:
${sop_text}`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2500,
            temperature: 0.2,
            messages: [{ role: "user", content: prompt }],
          });
          break;
        } catch (apiErr: unknown) {
          const status = (apiErr as { status?: number })?.status;
          if ((status === 529 || status === 500) && attempt < 3) {
            await new Promise((r) => setTimeout(r, attempt * 1500));
            continue;
          }
          throw apiErr;
        }
      }

      if (!response) throw new Error("No response after retries");
      const raw = response.content[0].type === "text" ? response.content[0].text : "{}";

      // Robust JSON extraction: strip fences → direct parse → extract largest {...} block
      const extractJSON = (text: string): string | null => {
        const stripped = text
          .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
          .replace(/\s*```[\s\S]*$/i, "")
          .trim();
        try { JSON.parse(stripped); return stripped; } catch { /* fallthrough */ }
        const m = text.match(/\{[\s\S]*\}/);
        if (m) { try { JSON.parse(m[0]); return m[0]; } catch { /* fallthrough */ } }
        return null;
      };

      const jsonStr = extractJSON(raw);
      let parsed: unknown;
      try {
        if (!jsonStr) throw new Error("no JSON found");
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse SOP scoring response:", raw);
        return NextResponse.json({ error: "Failed to parse scoring response. Please try again." }, { status: 500 });
      }

      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    console.error("SOP assistant error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 529) {
      return NextResponse.json(
        { error: "AI service is busy right now. Please try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "SOP assistant failed" }, { status: 500 });
  }
}
