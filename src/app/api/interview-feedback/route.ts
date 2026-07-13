import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp, aiToolLimit } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";
import { wrapLabelledInput, JAILBREAK_GUARDRAILS } from "@/lib/llm-safety";
import { parseCoverage, stripMarkdown, type FeedbackReadiness } from "@/lib/interview-readiness";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const gate = await checkBetaAccess(user?.email ?? null, "interview-feedback");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason },
        { status: gate.reason === "no_user" ? 401 : 403 }
      );
    }
    const limited = await aiToolLimit(req, "interview-feedback", user?.email);
    if (limited) return limited;

    const { question, objective, transcript, country, studentName, checklist } =
      await req.json() as {
        question: string;
        objective: string;
        transcript: string;
        country: "australia" | "uk" | "usa";
        studentName: string;
        checklist?: string[];
      };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Service not configured" }, { status: 503 });
    }

    const isAU = country === "australia";
    const isUSA = country === "usa";

    // Format differs between AU, UK and USA per their instruction windows
    const improveLabel = isAU ? "What you could improve" : "Where you could improve";
    const sampleLabel = isAU ? "A good sample answer is" : isUSA ? "A Good sample answer could be" : "Here is a sample answer";

    const hasChecklist = !!checklist && checklist.length > 0;

    // Numbered, priority-ordered key points (from the approved knowledge
    // files). The model reports coverage by NUMBER — tiny output, and the
    // 75% readiness verdict is computed deterministically in code below.
    const checklistSection = hasChecklist
      ? `\nOfficial key points for this question, numbered in priority order — a strong answer covers them all:\n${checklist!.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n`
      : "";

    const coverageInstruction = hasChecklist
      ? `FIRST LINE of your response must be exactly:\nCOVERAGE: covered=[<numbers of key points the answer clearly covered>] missing=[<numbers of key points absent or too weak>]\nEvery number 1-${checklist!.length} must appear in exactly one list. Then a blank line, then the sections below.\n`
      : "";

    const systemPrompt = `You are an expert international student visa interview coach with a warm, encouraging and friendly personality.
Your tone must always be: supportive, energetic, positive, and motivating — like a trusted mentor who genuinely wants the student to succeed.
Address the student by their first name: ${studentName} in the "What you did well" and improvement sections only.
Never be harsh or discouraging. Frame all improvement points as growth opportunities.
Plain text only — never use markdown symbols (#, *, _, backticks); your response is read aloud by a screen voice.
You strictly evaluate answers against the official numbered key points provided — each one is a required element of a strong answer.
Be concise: this feedback is spoken aloud within seconds of the student finishing.
CRITICAL RULE FOR SAMPLE ANSWER: The sample answer is what the student should say directly TO the visa interviewer. Write it in first person as if the student is speaking to the interviewer. Do NOT address or mention the student's name (${studentName}) anywhere in the sample answer. Do NOT begin with "${studentName}" or "Hi ${studentName}". The sample answer must read as the student's own words spoken to the interviewer — energetic, confident, under 120 words, covering all key points.${JAILBREAK_GUARDRAILS}`;

    const interviewContext = isAU
      ? "Australian Genuine Student visa interview"
      : isUSA
      ? "US F-1 student visa consular interview"
      : "UK student credibility interview";

    const userPrompt =
      `Interview context: ${interviewContext}\n\nCategory objective: ${objective}\n${checklistSection}\n` +
      wrapLabelledInput({
        question,
        student_answer: transcript || "(no answer given — student did not speak)",
      }) +
      `\n\n${coverageInstruction}Respond in EXACTLY this format with no extra text:

What you did well:
- [point 1 — under 15 words]
- [point 2 — under 15 words]

${improveLabel}:
- [point 1 — focus on the missing key points, highest priority first; under 15 words]
- [point 2 — under 15 words]

${sampleLabel}: [complete, confident sample answer under 120 words, energetic tone, covering ALL key points for this question]`;

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await client.messages.create({
          // Haiku + tight output budget: the founder's bar is feedback in
          // under 5 seconds (14 Jul 2026). Coverage is reported as index
          // lists and the sample answer is capped at 120 words, so 500
          // tokens is comfortable headroom.
          model: "claude-haiku-4-5",
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
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

    const raw =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Split off the machine-readable coverage line (when a checklist was
    // sent) and compute the readiness verdict in code — the 75% rule is
    // deterministic, not the model's call.
    let feedback = raw;
    let readiness: FeedbackReadiness | undefined;
    if (hasChecklist) {
      const parsed = parseCoverage(raw, checklist!);
      if (parsed) {
        readiness = parsed.readiness;
        feedback = parsed.rest;
      }
    }
    feedback = stripMarkdown(feedback).trim();

    if (user) await logToolUsage(user.email, "interview-feedback", getClientIp(req.headers));
    return NextResponse.json({ feedback, readiness });
  } catch (err) {
    return apiErrorResponse(err, { route: "interview-feedback" }, "Feedback generation failed");
  }
}
