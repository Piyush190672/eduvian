import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp } from "@/lib/rate-limit";

export const maxDuration = 90; // allow up to 90s for program context + generation + scoring

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgramContext {
  university: string;
  course: string;
  department?: string;
  faculty: { name: string; research: string }[];
  labs: { name: string; focus: string }[];
  research_areas: string[];
  curriculum_highlights: string[];
  distinctive_features: string[];
  recent_work: string[];
  confidence: "high" | "medium" | "low";
  disclaimer: string;
}

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
  program_context?: ProgramContext | null;
}

interface ScoreBody {
  action: "score";
  sop_text: string;
  university: string;
  course: string;
  program_context?: ProgramContext | null;
}

interface ProgramContextBody {
  action: "program_context";
  university: string;
  course: string;
  department?: string;
}

type RequestBody = GenerateBody | ScoreBody | ProgramContextBody;

// ── Static prompts (cached via system block + cache_control: ephemeral) ──────

const SOP_PROGRAM_CONTEXT_SYSTEM = `You are an expert on global higher-education programs. You always respond with ONLY valid JSON — no markdown, no preamble, no trailing text.

Given a target program (university + program name + optional department), return a structured "program intelligence" card the applicant can cite in their SOP.

Rules:
- Return ONLY real faculty, labs, research areas, and curriculum items you have reasonable confidence about. Never invent a faculty name, lab, or course you cannot recall. Prefer fewer high-confidence items over many low-confidence ones.
- Use last-name + first-initial format for faculty if unsure of spelling, and describe their research area in one short phrase.
- "Curriculum highlights" should be actual module/course names when known — not generic topics.
- "Distinctive features" are pedagogy, industry partnerships, cohort structure, compute/resources, thesis structure — items a generic SOP would NOT know.
- Set "confidence" to:
    • "high" if this is a well-known program you can recall specifics for
    • "medium" if you can recall the department and a few specifics
    • "low" if you can only infer from general field conventions
- Always include a short "disclaimer" telling the applicant to verify details on the program's official site.

Return ONLY valid JSON in exactly this shape — no markdown, no preamble:
{
  "university": "string",
  "course": "string",
  "department": "string or empty",
  "faculty": [
    { "name": "Prof. Jane Smith", "research": "one-line research focus" }
  ],
  "labs": [
    { "name": "Lab/Group name", "focus": "one-line focus" }
  ],
  "research_areas": ["string"],
  "curriculum_highlights": ["string"],
  "distinctive_features": ["string"],
  "recent_work": ["string (paper / initiative / industry collab)"],
  "confidence": "high" | "medium" | "low",
  "disclaimer": "string"
}`;

const SOP_GENERATE_SYSTEM = `You are an expert SOP writer for international university admissions. You generate compelling, authentic Statements of Purpose tailored to a specific applicant and program.

CRITICAL GUIDELINES:
- Do NOT use childhood stories, quotes, or clichés
- Make it specific and authentic, NOT generic
- Use a concrete opening hook, not "Since childhood I have been passionate..."
- Show reflection and insight, not just a resume walkthrough
- Keep sections: Opening (100-150 words), Academic Prep (250-350 words), Professional Experience (150-300 words if applicable), Why This Degree (120-180 words), Career Goals (150-220 words), Why This University (150-220 words), Conclusion (40-80 words)
- Total: 800-1000 words for taught masters; connect all sections with a clear narrative arc

PROGRAM-FIT REQUIREMENTS (hard rules):
- In "Why This University" and anywhere relevant, cite AT LEAST TWO specifics from the PROGRAM CONTEXT supplied — a named faculty member, a lab/group, a signature course, or a distinctive feature. Tie each specific to the applicant's goals or background — do not name-drop.
- Do NOT use generic praise ("top-ranked", "world-class faculty", "prestigious", "excellent facilities").
- If a faculty/lab/course from the context is not relevant to the applicant's story, skip it rather than shoehorn it in.
- If program context confidence is "low" or no context was supplied, lean on the student's own "Why this university" input and the program name — still avoid generic praise.

Return ONLY the SOP text. No preamble, no commentary.`;

const SOP_SCORE_SYSTEM = `You are a senior admissions officer at a top 100 global university. You always respond with ONLY valid JSON — no markdown, no preamble, no trailing text.

Evaluate a Statement of Purpose across 7 dimensions AND perform a paragraph-level program-specific fit audit using the exact criteria below.

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

--- DIMENSION 5: PROGRAM FIT (Max: 1.5) — PROGRAM-SPECIFIC ---
Score STRICTLY against the PROGRAM CONTEXT block in the user message.
Scoring Criteria:
- Does the SOP name ACTUAL faculty, labs, research groups, or signature courses from this specific program?
- Does it connect those specifics to the applicant's own background/goals (not just name-drop)?
- Does it reference distinctive features (pedagogy, industry links, cohort structure) that are genuinely specific to this program?
Penalty Triggers (hard caps — do not exceed these if triggered):
- Uses ONLY generic phrases ("top-ranked", "world-class faculty", "excellent facilities", "prestigious", "renowned"): cap at 0.3 / 1.5
- Names 0 actual faculty/labs/courses from the program context (even when context was provided): cap at 0.6 / 1.5
- Names faculty/labs/courses but does not tie them to applicant's goals (name-drop only): cap at 1.0 / 1.5
- Full 1.5 requires 2+ real program-specifics, each tied to applicant's goals or background
If PROGRAM CONTEXT confidence is "low" or absent, relax the cap by +0.3 but still penalise pure generic praise.

--- DIMENSION 6: IMPACT & ACHIEVEMENTS (Max: 1) ---
Scoring Criteria:
- Evidence of measurable impact
- Ownership of work
- Quantified outcomes (%, revenue, efficiency, etc.)
Penalty: Purely descriptive content with no outcomes.

--- DIMENSION 7: ORIGINALITY & AUTHENTICITY (Max: 0.5) ---
Scoring Criteria:
- Unique narrative voice
- Absence of clichés
- Personal storytelling
Penalty: Template-like writing, overused phrases.

--- PROGRAM-SPECIFIC FIT AUDIT (paragraph level) ---
Split the SOP into paragraphs (by blank lines or clear breaks). For EACH paragraph, judge whether it could be cut-and-pasted into an SOP for a DIFFERENT university without changes (= generic), or whether it is tied to THIS specific program (= specific).

A paragraph is "generic" if it:
- Contains no faculty name, lab, course, or distinctive feature from the program context
- Could equally describe any school in the same tier (e.g., "XYZ is a top university known for excellence")
- Talks about the field or career in a way untied to this program

A paragraph is "specific" if it:
- Names a real faculty/lab/course/feature from the program context AND ties it to the applicant

A paragraph is "partial" if it mentions the program/university by name but does not cite real specifics.

Also compute:
- school_specificity_score: 0–100, weighted heavily by "specific" paragraphs in Why-This-University and career-goals sections.
- program_elements_referenced: list the actual faculty/labs/courses from the PROGRAM CONTEXT that the SOP correctly references.
- missing_elements: up to 5 items from the PROGRAM CONTEXT that would strengthen the SOP if woven in naturally.
- swap_test_verdict: ONE sentence — "If we replaced the university name with another school, would this SOP still read as plausible?" Yes / No / Partially + brief why.

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
    { "original": "exact phrase from the SOP", "suggested_rewrite": "specific, concrete alternative using program context if possible" }
  ],
  "program_specific_fit": {
    "school_specificity_score": number (0-100),
    "swap_test_verdict": "string (Yes / No / Partially + brief why)",
    "paragraph_flags": [
      {
        "paragraph_snippet": "first 120 chars of the paragraph",
        "verdict": "generic" | "partial" | "specific",
        "reason": "one-line why",
        "rewrite_hint": "one-line concrete suggestion referencing PROGRAM CONTEXT when possible"
      }
    ],
    "program_elements_referenced": ["string (actual element from PROGRAM CONTEXT)"],
    "missing_elements": ["string (element from PROGRAM CONTEXT not yet woven in)"]
  },
  "word_count_estimate": number,
  "ready_to_submit": boolean
}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function formatProgramContext(ctx: ProgramContext | null | undefined): string {
  if (!ctx) return "(No program context available — treat 'program fit' strictly on generalities.)";
  const faculty = ctx.faculty?.length
    ? ctx.faculty.map((f) => `  • ${f.name} — ${f.research}`).join("\n")
    : "  (none listed)";
  const labs = ctx.labs?.length
    ? ctx.labs.map((l) => `  • ${l.name} — ${l.focus}`).join("\n")
    : "  (none listed)";
  const areas = ctx.research_areas?.length ? ctx.research_areas.map((a) => `  • ${a}`).join("\n") : "  (none listed)";
  const curriculum = ctx.curriculum_highlights?.length ? ctx.curriculum_highlights.map((c) => `  • ${c}`).join("\n") : "  (none listed)";
  const distinctive = ctx.distinctive_features?.length ? ctx.distinctive_features.map((d) => `  • ${d}`).join("\n") : "  (none listed)";
  const recent = ctx.recent_work?.length ? ctx.recent_work.map((r) => `  • ${r}`).join("\n") : "  (none listed)";
  return `PROGRAM CONTEXT (confidence: ${ctx.confidence})
University: ${ctx.university}
Program: ${ctx.course}${ctx.department ? ` (${ctx.department})` : ""}

Faculty & active researchers:
${faculty}

Labs / research groups:
${labs}

Research areas the program emphasises:
${areas}

Curriculum highlights / signature courses:
${curriculum}

Distinctive features (pedagogy, industry links, cohort, resources):
${distinctive}

Recent work / publications / projects associated with the program:
${recent}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const gate = await checkBetaAccess(user?.email ?? null, "sop-assistant");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason },
        { status: gate.reason === "no_user" ? 401 : 403 }
      );
    }

    const body = (await req.json()) as RequestBody;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SOP service not configured" }, { status: 503 });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    // ── program_context: extract faculty / labs / curriculum specifics ──────
    if (body.action === "program_context") {
      const { university, course, department } = body;

      const userContent = `Target program:
- University: ${university}
- Program: ${course}${department ? `\n- Department/school: ${department}` : ""}

Return the program intelligence card now (JSON only).`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2000,
            temperature: 0.2,
            system: [
              {
                type: "text",
                text: SOP_PROGRAM_CONTEXT_SYSTEM,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [{ role: "user", content: userContent }],
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
      const jsonStr = extractJSON(raw);
      if (!jsonStr) {
        return NextResponse.json({ error: "Could not extract program context. Try again." }, { status: 500 });
      }
      try {
        const parsed = JSON.parse(jsonStr) as ProgramContext;
        if (user) await logToolUsage(user.email, "sop-assistant", getClientIp(req.headers));
        return NextResponse.json({ program_context: parsed });
      } catch {
        return NextResponse.json({ error: "Malformed program context response." }, { status: 500 });
      }
    }

    // ── generate ────────────────────────────────────────────────────────────
    if (body.action === "generate") {
      const {
        university, course, degree_level, applicant_type,
        opening_hook, academic_prep, work_experience, why_degree,
        career_goals, why_university, extracurriculars, additional_notes,
        program_context,
      } = body;

      const ctxBlock = formatProgramContext(program_context);

      const userContent = `Generate the SOP for:
- University: ${university}
- Program: ${course}
- Degree Level: ${degree_level}
- Applicant Type: ${applicant_type}

${ctxBlock}

Student inputs:
- Opening hook / key experience: ${opening_hook}
- Academic preparation: ${academic_prep}
- Work/internship experience: ${work_experience}
- Why this degree/why now: ${why_degree}
- Career goals: ${career_goals}
- Why this university specifically: ${why_university}
- Extracurriculars/personality: ${extracurriculars}
- Additional notes: ${additional_notes}`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2000,
            temperature: 0.7,
            system: [
              {
                type: "text",
                text: SOP_GENERATE_SYSTEM,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [{ role: "user", content: userContent }],
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
      if (user) await logToolUsage(user.email, "sop-assistant", getClientIp(req.headers));
      return NextResponse.json({ sop: text });
    }

    // ── score ───────────────────────────────────────────────────────────────
    if (body.action === "score") {
      const { sop_text, university, course, program_context } = body;

      const ctxBlock = formatProgramContext(program_context);

      const userContent = `Evaluate this Statement of Purpose for ${course} at ${university}.

${ctxBlock}

SOP TO EVALUATE:
${sop_text}`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 4000,
            temperature: 0.2,
            system: [
              {
                type: "text",
                text: SOP_SCORE_SYSTEM,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [{ role: "user", content: userContent }],
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

      const jsonStr = extractJSON(raw);
      let parsed: unknown;
      try {
        if (!jsonStr) throw new Error("no JSON found");
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error("Failed to parse SOP scoring response:", raw);
        return NextResponse.json({ error: "Failed to parse scoring response. Please try again." }, { status: 500 });
      }

      if (user) await logToolUsage(user.email, "sop-assistant", getClientIp(req.headers));
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
