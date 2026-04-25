import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";

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

    // Build the checklist section if provided
    const checklistSection = checklist && checklist.length > 0
      ? `\nOfficial response checklist — the answer MUST cover these points (from the approved knowledge file):\n${checklist.map((p) => `• ${p}`).join("\n")}\n`
      : "";

    const systemPrompt = `You are an expert international student visa interview coach with a warm, encouraging and friendly personality.
Your tone must always be: supportive, energetic, positive, and motivating — like a trusted mentor who genuinely wants the student to succeed.
Address the student by their first name: ${studentName} in the "What you did well" and improvement sections only.
Never be harsh or discouraging. Frame all improvement points as growth opportunities.
You strictly evaluate answers against the official approved checklist provided — if a checklist is given, every bullet point in it is a required element that should be present in a strong answer.
CRITICAL RULE FOR SAMPLE ANSWER: The sample answer is what the student should say directly TO the visa interviewer. Write it in first person as if the student is speaking to the interviewer. Do NOT address or mention the student's name (${studentName}) anywhere in the sample answer. Do NOT begin with "${studentName}" or "Hi ${studentName}". The sample answer must read as the student's own words spoken to the interviewer — energetic, confident, under 200 words, covering all checklist points.`;

    const interviewContext = isAU
      ? "Australian Genuine Student visa interview"
      : isUSA
      ? "US F-1 student visa consular interview"
      : "UK student credibility interview";

    const userPrompt = `Interview context: ${interviewContext}

Category objective: ${objective}
${checklistSection}
Question asked: "${question}"

Student's answer: "${transcript || "(no answer given — student did not speak)"}"

Evaluate this answer strictly against the official checklist above. Respond in EXACTLY this format with no extra text:

What you did well:
- [point 1]
- [point 2]

${improveLabel}:
- [point 1]
- [point 2]

${sampleLabel}: [write a complete, confident sample answer under 200 words, energetic tone, covering ALL checklist points for this question]`;

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 900,
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

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (user) await logToolUsage(user.email, "interview-feedback", getClientIp(req.headers));
    return NextResponse.json({ feedback: text });
  } catch (err) {
    return apiErrorResponse(err, { route: "interview-feedback" }, "Feedback generation failed");
  }
}
