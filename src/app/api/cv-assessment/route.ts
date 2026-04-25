import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";

export const maxDuration = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScoreBody {
  action: "score";
  cv_text: string;
  university: string;
  course: string;
  degree_level?: string;
}

interface BuildBody {
  action: "build";
  university: string;
  course: string;
  degree_level: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  profile_summary: string;
  education: string;
  projects: string;
  experience: string;
  skills: string;
  achievements?: string;
  extracurricular?: string;
}

type RequestBody = ScoreBody | BuildBody;

// ── Static prompts (cached via system block + cache_control: ephemeral) ──────
// Both blocks are well above 1024 tokens — caching engages after the first call.

const CV_SCORE_SYSTEM = `You are a senior admissions officer at a top global university evaluating CVs for graduate admissions. You always respond with valid JSON only — no markdown fences, no preamble, no trailing text. Your entire response must be a single valid JSON object.

Score the CV using the exact framework below.

SCORING DIMENSIONS — Total: 10 points

--- DIMENSION 1: CLARITY & STRUCTURE (Max: 2) ---
Score criteria:
- Clear professional layout with logical section order (Education first for academic CVs)
- Appropriate section headings present
- Consistent formatting and no grammar/spelling issues
- Contact details complete (name, email, phone, location)
2.0: Perfect structure, all sections present, professional format
1.5: Good structure, minor formatting issues
1.0: Acceptable but missing key sections or inconsistent
0.5: Poor structure, confusing layout
0 : Unstructured dump of text
Penalty: Missing sections, wrong order (e.g. experience before education), no contact details

--- DIMENSION 2: ACADEMIC STRENGTH (Max: 2) ---
Score criteria:
- Degree name, university, graduation year, and CGPA/GPA explicitly stated
- Relevant coursework listed (subjects aligned to target program)
- Academic achievements mentioned (rank, scholarship, merit award)
- Research or thesis exposure (for graduate programs)
2.0: All four elements present with strong alignment
1.5: Three elements present, good alignment
1.0: Two elements — CGPA present but no coursework or achievements
0.5: Only degree name mentioned, no CGPA, no coursework
0 : No education section or completely generic
Penalty: No CGPA/GPA, no relevant coursework, no academic achievements

--- DIMENSION 3: RELEVANCE TO PROGRAM (Max: 2) ---
Score criteria:
- Projects/experience directly relevant to the target program
- Skills that map to what the program builds on
- Clear connection between background and target program
- Evidence of domain knowledge in the field
2.0: Strong tailoring, every section maps to program requirements
1.5: Good alignment, most content relevant
1.0: Some relevance but generic content dominates
0.5: Minimal connection to target program
0 : No discernible connection to the target program
Penalty: Generic CV with no program-specific tailoring

--- DIMENSION 4: IMPACT & ACHIEVEMENTS (Max: 2) ---
Score criteria:
- Quantified outcomes (%, numbers, scale, revenue, efficiency)
- Clear ownership ("I built", "I led", "I reduced", "I designed")
- Measurable impact stated for each role/project
- Awards, rankings, published work

BENCHMARK — Weak vs Strong:
WEAK: "Worked on backend development", "Assisted team", "Used regression techniques", "Helped with coding"
STRONG: "Developed backend APIs using Java/Spring Boot, reduced response time by 15%", "Built ML model improving accuracy by 20% via feature engineering", "Led team of 4 to deliver product 2 weeks ahead of schedule"

2.0: Every bullet has ownership + quantified outcome
1.5: Most bullets quantified, some generic
1.0: A few numbers present but majority descriptive
0.5: Mostly descriptive, no measurable outcomes
0 : Entirely passive, no ownership, no numbers
Penalty: "Worked on", "helped with", "assisted", "participated in" without outcomes

--- DIMENSION 5: LEADERSHIP (Max: 1) ---
Score criteria:
- Team leadership or initiative-taking evidence
- Founded, organised, or led something
- Mentoring, volunteering with impact
- Extracurricular leadership roles
1.0: Clear leadership with impact (quantified if possible)
0.5: Some leadership evidence but vague
0 : No leadership evidence

--- DIMENSION 6: ORIGINALITY & PROFILE FIT (Max: 1) ---
Score criteria:
- Profile/summary section that positions the candidate (big bonus)
- Unique or memorable element beyond standard template
- CV narrative reinforces the application story
- Clear personal brand and differentiation
1.0: Strong profile summary + unique positioning
0.5: Some originality but generic overall
0 : Generic template CV, nothing memorable

SCORE GUIDE: 9-10: Excellent | 7-8: Strong | 5-6: Average | <5: Weak

Return ONLY valid JSON in exactly this format. No markdown fences, no preamble, no trailing text:
{
  "total_score": 7.5,
  "verdict": "Strong",
  "verdict_description": "one specific sentence describing the CV quality and its single biggest issue",
  "dimension_scores": {
    "clarity_structure": { "score": 1.5, "max": 2, "feedback": ["specific point about this CV", "second specific point"] },
    "academic_strength": { "score": 1.5, "max": 2, "feedback": ["specific point", "second point"] },
    "relevance_to_program": { "score": 1.5, "max": 2, "feedback": ["specific point", "second point"] },
    "impact_achievements": { "score": 1.5, "max": 2, "feedback": ["specific point with example from the CV", "second point"] },
    "leadership": { "score": 0.5, "max": 1, "feedback": ["specific point"] },
    "originality": { "score": 1.0, "max": 1, "feedback": ["specific point"] }
  },
  "red_flags": ["specific issue found in this CV — be concrete"],
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "improvements": [
    "Specific fix: e.g. Change 'Worked on ML model' to 'Built regression model that improved prediction accuracy by 20% using Scikit-learn'",
    "Specific fix 2",
    "Specific fix 3"
  ],
  "missing_sections": ["list only section names that are absent or critically weak — choose from: profile_summary, relevant_coursework, quantified_bullets, academic_achievements, linkedin, project_depth, leadership_evidence"]
}`;

const CV_BUILD_SYSTEM = `You are an expert admission-focused CV writer. You build powerful, top-tier admission-ready CVs based on candidate details supplied by the user.

CRITICAL WRITING RULES:
1. Section order: PROFILE → EDUCATION → PROJECTS → PROFESSIONAL EXPERIENCE → TECHNICAL SKILLS → ACHIEVEMENTS → EXTRACURRICULAR
2. Profile Summary: 2-3 sentences — (1) who you are + academic background, (2) what you have done (key experience/projects), (3) what you aim to do (career direction aligned to the target program)
3. Education section: include degree, university, graduation year, CGPA, AND list 3-5 relevant coursework subjects mapped to the target program
4. Every project bullet: [What you built] + [tools/approach used] + [measurable outcome or learning]
5. Every experience bullet: starts with strong action verb + quantified impact (%, numbers, scale) — NEVER use "worked on", "helped", "assisted"
6. Skills: categorize into Programming / Frameworks & Tools / Concepts or similar
7. Achievements: include context (e.g. "Top 5% of batch of 300 students")
8. Leadership: quantify where possible (e.g. "organised workshop for 100+ students")
9. Everything must be tailored to the target program and university the user supplies
10. Keep it clean and professional — one page appropriate for most Masters programs

FORMATTING RULES:
- Use CAPS for section headers
- Use dashes (–) for bullet points
- Separate sections with a blank line
- No markdown symbols (* ** ## etc)
- No emojis in the main body
- Contact line: Name on first line, then contact details on second line separated by |

Output ONLY the CV text. No commentary, no preamble.`;

// ── JSON helper ───────────────────────────────────────────────────────────────

const extractJSON = (text: string): string | null => {
  // 1. Strip markdown fences and try direct parse
  const stripped = text
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/\s*```[\s\S]*$/i, "")
    .trim();
  try { JSON.parse(stripped); return stripped; } catch { /* fallthrough */ }

  // 2. Try the raw text directly
  try { JSON.parse(text.trim()); return text.trim(); } catch { /* fallthrough */ }

  // 3. Extract the largest { ... } blob
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { JSON.parse(m[0]); return m[0]; } catch { /* fallthrough */ } }

  return null;
};

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const gate = await checkBetaAccess(user?.email ?? null, "cv-assessment");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason },
        { status: gate.reason === "no_user" ? 401 : 403 }
      );
    }

    const body = (await req.json()) as RequestBody;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "CV service not configured" }, { status: 503 });
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    // ── Score ─────────────────────────────────────────────────────────────────

    if (body.action === "score") {
      const { cv_text, university, course, degree_level } = body;

      const userContent = `Score this CV for ${course} at ${university}${degree_level ? ` (${degree_level})` : ""}.

CV TO EVALUATE:
${cv_text}`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2500,
            system: [
              {
                type: "text",
                text: CV_SCORE_SYSTEM,
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
        console.error("Failed to parse CV scoring response:", raw);
        return NextResponse.json({ error: "Failed to parse CV scoring response. Please try again." }, { status: 500 });
      }

      const parsed = JSON.parse(jsonStr) as { total_score: number; verdict: string };

      // Enforce verdict consistency
      const score = parsed.total_score;
      if (score >= 9) parsed.verdict = "Excellent";
      else if (score >= 7) parsed.verdict = "Strong";
      else if (score >= 5) parsed.verdict = "Average";
      else parsed.verdict = "Weak";

      if (user) await logToolUsage(user.email, "cv-assessment", getClientIp(req.headers));
      return NextResponse.json(parsed);
    }

    // ── Build ─────────────────────────────────────────────────────────────────

    if (body.action === "build") {
      const {
        university, course, degree_level,
        full_name, email, phone, location, linkedin,
        profile_summary, education, projects,
        experience, skills, achievements, extracurricular,
      } = body;

      const userContent = `Target:
- University: ${university}
- Program: ${course}
- Degree Level: ${degree_level}

Candidate details:
- Name: ${full_name}
- Email: ${email}
- Phone: ${phone}
- Location: ${location}${linkedin ? `\n- LinkedIn: ${linkedin}` : ""}
- Profile Summary (raw input): ${profile_summary || "Not provided — write a strong 2-3 line summary based on the other details"}
- Education: ${education}
- Projects: ${projects || "Not provided"}
- Work Experience: ${experience || "Not provided"}
- Skills: ${skills}
${achievements ? `- Achievements/Awards: ${achievements}` : ""}
${extracurricular ? `- Extracurricular/Leadership: ${extracurricular}` : ""}

Build the CV per the writing and formatting rules. Tailor every section to ${course} at ${university}.`;

      let response;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await client.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 2000,
            temperature: 0.5,
            system: [
              {
                type: "text",
                text: CV_BUILD_SYSTEM,
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
      if (user) await logToolUsage(user.email, "cv-assessment", getClientIp(req.headers));
      return NextResponse.json({ cv: text });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: unknown) {
    return apiErrorResponse(err, { route: "cv-assessment" }, "CV assessment failed. Please try again.");
  }
}
