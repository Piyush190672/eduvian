import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp } from "@/lib/rate-limit";

export const maxDuration = 60; // allow up to 60s for Claude analysis

interface ApplicationCheckRequest {
  university: string;
  course: string;
  sop?: string;
  cv?: string;
  profile?: string;
  visa_notes?: string;
}

interface WeakPhrase {
  phrase: string;
  suggestion: string;
}

interface ApplicationCheckResult {
  readiness_score: number;
  verdict: "Ready" | "Needs Work" | "Risky";
  risk_flags: string[];
  contradictions: string[];
  weak_phrases: WeakPhrase[];
  missing_evidence: string[];
  followup_questions: string[];
}

// ── JSON helper ───────────────────────────────────────────────────────────────

const extractJSON = (text: string): string | null => {
  // 1. Strip markdown fences
  const stripped = text
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/\s*```[\s\S]*$/i, "")
    .trim();
  try { JSON.parse(stripped); return stripped; } catch { /* fallthrough */ }

  // 2. Try raw text directly
  try { JSON.parse(text.trim()); return text.trim(); } catch { /* fallthrough */ }

  // 3. Extract the largest { ... } blob
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { JSON.parse(m[0]); return m[0]; } catch { /* fallthrough */ } }

  return null;
};

const ANALYSIS_PROMPT = (data: ApplicationCheckRequest) => `You are an expert international university admissions consultant and visa counsellor. Analyse the following student application pack for ${data.course} at ${data.university}.

APPLICATION PACK:
${data.sop ? `\n=== STATEMENT OF PURPOSE / PERSONAL STATEMENT ===\n${data.sop}\n` : ""}
${data.cv ? `\n=== CV / RESUME HIGHLIGHTS ===\n${data.cv}\n` : ""}
${data.profile ? `\n=== PROFILE SUMMARY (GPA, backlogs, work exp, English score) ===\n${data.profile}\n` : ""}
${data.visa_notes ? `\n=== VISA / INTERVIEW PREPARATION NOTES ===\n${data.visa_notes}\n` : ""}

Perform a thorough credibility and quality check. Evaluate:
1. Overall readiness for this specific application (0-100 score)
2. Logical consistency and credibility across all documents
3. Weak or generic language in the SOP/CV that admissions panels flag
4. Claims made without supporting evidence
5. Potential contradictions between different sections
6. Questions a university admissions officer or visa officer would likely ask

Return ONLY a valid JSON object with exactly this structure. No markdown, no code blocks, no explanation before or after the JSON:
{
  "readiness_score": 72,
  "verdict": "Needs Work",
  "risk_flags": ["string", "string", "string"],
  "contradictions": ["string"],
  "weak_phrases": [{ "phrase": "string", "suggestion": "string" }],
  "missing_evidence": ["string", "string", "string"],
  "followup_questions": ["string", "string", "string", "string", "string", "string"]
}

Rules for field values:
- readiness_score: integer 0-100
- verdict: exactly one of "Ready", "Needs Work", or "Risky"
- risk_flags: 3-6 critical issues that could jeopardise the application
- contradictions: things that do not align across documents (empty array [] if none found)
- weak_phrases: 3-5 specific weak phrases from the SOP/CV with concrete replacements
- missing_evidence: 3-5 things claimed but not substantiated
- followup_questions: exactly 6 questions the admissions or visa officer would ask`;

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const gate = await checkBetaAccess(user?.email ?? null, "application-check");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason },
        { status: gate.reason === "no_user" ? 401 : 403 }
      );
    }

    const body = (await req.json()) as ApplicationCheckRequest;

    const { university, course } = body;
    if (!university || !course) {
      return NextResponse.json(
        { error: "University and course are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Analysis service not configured" },
        { status: 503 }
      );
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await client.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 1500,
          system:
            "You are an expert international university admissions consultant. You always respond with valid JSON only — no markdown, no code fences, no preamble, no trailing text. Your entire response must be a single valid JSON object and nothing else.",
          messages: [
            {
              role: "user",
              content: ANALYSIS_PROMPT(body),
            },
          ],
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

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonStr = extractJSON(rawText);
    let result: ApplicationCheckResult;
    try {
      if (!jsonStr) throw new Error("no JSON found");
      result = JSON.parse(jsonStr) as ApplicationCheckResult;
    } catch {
      console.error("Failed to parse AI response as JSON:", rawText);
      return NextResponse.json(
        { error: "Failed to parse analysis result. Please try again." },
        { status: 500 }
      );
    }

    // Enforce verdict consistency with score
    const score = result.readiness_score;
    if (score >= 75) result.verdict = "Ready";
    else if (score >= 50) result.verdict = "Needs Work";
    else result.verdict = "Risky";

    if (user) await logToolUsage(user.email, "application-check", getClientIp(req.headers));
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Application check error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 529) {
      return NextResponse.json(
        {
          error:
            "Our AI analyser is very busy right now. Please try again in a moment.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
