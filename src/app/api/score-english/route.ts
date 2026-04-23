import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { exam, section, taskType, prompt, response: userResponse, rubric } = await req.json() as {
      exam: string;
      section: string;
      taskType: string;
      prompt: string;
      response: string;
      rubric?: string;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Service not configured" }, { status: 503 });
    }

    const systemPrompt = `You are an expert English language examiner with deep knowledge of IELTS, PTE Academic, Duolingo English Test (DET), and TOEFL iBT scoring rubrics.
Your task is to score the provided response according to the exam-specific criteria.
Always return valid JSON only — no extra text, no markdown fences.`;

    function buildScoringCriteria(examName: string, task: string): string {
      const criteriaMap: Record<string, string> = {
        "ielts_writing_task1": `Score on IELTS Writing Task 1 criteria:
- Task Achievement (0-9): addresses the task requirements, overview, key features
- Coherence & Cohesion (0-9): logical flow, paragraphing, cohesive devices
- Lexical Resource (0-9): vocabulary range, accuracy, appropriacy
- Grammatical Range & Accuracy (0-9): sentence structures, grammar accuracy
Overall band is the average of the 4 criteria (round to nearest 0.5).`,

        "ielts_writing_task2": `Score on IELTS Writing Task 2 criteria:
- Task Response (0-9): addresses all parts of the task, position clear, fully extended
- Coherence & Cohesion (0-9): logical progression, paragraphing, cohesive devices
- Lexical Resource (0-9): vocabulary range, accuracy, appropriacy
- Grammatical Range & Accuracy (0-9): variety of structures, frequency of errors
Overall band is the average of the 4 criteria (round to nearest 0.5).`,

        "ielts_speaking": `Score on IELTS Speaking criteria:
- Fluency & Coherence (0-9): flow, hesitation, linking of ideas
- Lexical Resource (0-9): vocabulary range, use of idioms
- Grammatical Range & Accuracy (0-9): structures used, errors
- Pronunciation (0-9): phonological control, intelligibility
Overall band is the average (round to nearest 0.5).`,

        "pte_writing_essay": `Score on PTE Academic Essay criteria:
- Content (0-3): topic, argument, development, support
- Formal Requirements (0-2): length 200-300 words, structure
- Development, Structure & Coherence (0-2): logical flow
- General Linguistic Range (0-2): vocabulary range
- Grammatical Usage & Mechanics (0-2): grammar, punctuation, spelling
Score out of 15, then convert to PTE score (multiply by 6 to get approx 0-90).`,

        "pte_speaking_read_aloud": `Score PTE Read Aloud (Speaking):
- Content (0-5): words correct/total
- Oral Fluency (0-5): rhythm, phrasing, smoothness
- Pronunciation (0-5): native-like vowels, consonants, word stress
Score each 0-5. Total out of 15, scale to 90.`,

        "toefl_writing_integrated": `Score TOEFL Integrated Writing (0-5 scale):
- Connection of Ideas (0-5): how well lecture points are connected to reading
- Language Use (0-5): vocabulary, sentence structures
- Organization (0-5): introduction, body, conclusion structure
- Topic Development (0-5): relevant, complete response
Overall: average of criteria, express as 0-30 scaled score.`,

        "toefl_writing_academic": `Score TOEFL Academic Discussion Writing:
- Relevance to Topic (0-5): directly addresses discussion
- Language Use (0-5): vocabulary, grammar
- Development (0-5): ideas expanded with reasons/examples
Overall: average scaled to 0-30.`,

        "toefl_speaking_independent": `Score TOEFL Independent Speaking:
- Delivery (0-4): fluency, pace, pronunciation clarity
- Language Use (0-4): grammar, vocabulary
- Topic Development (0-4): relevant, elaborated ideas
Score each 0-4, total 0-12, scale to 0-30.`,

        "det_write_about": `Score DET Write About the Photo:
- Literacy (0-5): spelling, grammar correctness
- Comprehension (0-5): relevance to the described image
- Production (0-5): sentence complexity, vocabulary range
Estimate DET sub-scores. DET overall range 10-160.`,

        "det_speak_about": `Score DET Speak About the Topic:
- Comprehension (0-5): addresses the topic
- Conversation (0-5): natural flow, responsiveness
- Production (0-5): vocabulary, grammar in speech
Estimate DET sub-scores. DET overall range 10-160.`,
      };

      const key = `${examName.toLowerCase()}_${task.toLowerCase().replace(/\s+/g, "_")}`;
      return criteriaMap[key] || `Score this ${examName} ${task} response on a 0-9 scale, considering accuracy, fluency, vocabulary, and grammar. Provide detailed feedback.`;
    }

    const criteria = buildScoringCriteria(exam, taskType);

    const userPrompt = `Exam: ${exam}
Section: ${section}
Task Type: ${taskType}
${rubric ? `Rubric notes: ${rubric}\n` : ""}
Prompt/Task: ${prompt}

Candidate's Response:
"""
${userResponse || "(No response provided — candidate did not submit)"}
"""

${criteria}

Return ONLY valid JSON in this exact structure:
{
  "score": <numeric score appropriate to the exam>,
  "band": "<band or level label, e.g. '6.5' for IELTS, '65/90' for PTE, '95/120' for TOEFL>",
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "criteria_breakdown": {
    "<criterion name>": { "score": <number>, "max": <number>, "comment": "<brief comment>" }
  }
}`;

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    let apiResponse;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        apiResponse = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 700,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });
        break;
      } catch (apiErr: unknown) {
        const status = (apiErr as { status?: number })?.status;
        if ((status === 529 || status === 500) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw apiErr;
      }
    }

    if (!apiResponse) throw new Error("No response after retries");

    const text = apiResponse.content[0].type === "text" ? apiResponse.content[0].text : "";

    // Parse JSON from response
    let parsed;
    try {
      // Strip any accidental markdown fences
      const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({
        score: 0,
        band: "N/A",
        feedback: "Scoring service returned an unexpected format. Please retry.",
        strengths: [],
        improvements: ["Please try submitting again."],
        criteria_breakdown: {},
      });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Score English error:", err);
    return NextResponse.json({ error: "Scoring failed" }, { status: 500 });
  }
}
