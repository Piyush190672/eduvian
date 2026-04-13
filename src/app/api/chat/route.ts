import { NextRequest, NextResponse } from "next/server";
import { DB_STATS, universitiesByCountry } from "@/data/db-stats";

// ── Platform knowledge base (auto-generated from DB) ──────────────────────

// Build the university list section dynamically from live data
const uniListSection = Object.entries(universitiesByCountry)
  .sort((a, b) => b[1].length - a[1].length) // largest country first
  .map(([country, unis]) => `${country} (${unis.length} universities):\n${unis.join(", ")}`)
  .join("\n\n");

const PLATFORM_DATA = `
=== eduvianAI PLATFORM DATA ===

ABOUT eduvianAI:
eduvianAI is a study-abroad matching platform that helps students find the right university and program abroad. It uses a 10-signal AI matching engine (GPA/academic score, English proficiency, budget, country preference, QS ranking, intake timing, work experience, standardised tests, backlogs, gap year) to score and rank programs against a student's profile. Students get a personalised TOP 20 shortlist with Safe / Reach / Ambitious tiers.

COUNTRIES WE COVER (${DB_STATS.totalCountries} total):
1. USA — 1,400+ programs across top universities
2. UK — 1,900+ programs (largest database)
3. Australia — 850+ programs
4. Canada — 450+ programs
5. Germany — 500+ programs
6. Malaysia — 320+ programs
7. New Zealand — 210+ programs
8. France — 320+ programs
9. Ireland — 180+ programs
10. Singapore — 141 programs
11. UAE — 200+ programs

TOTAL DATABASE: ${DB_STATS.totalPrograms.toLocaleString()}+ programs across ${DB_STATS.totalUniversities}+ universities, ${DB_STATS.totalFields} fields of study.

FIELDS OF STUDY ON THE PLATFORM (${DB_STATS.totalFields}):
1. Computer Science & IT
2. Artificial Intelligence & Data Science
3. Business & Management
4. MBA
5. Engineering (Mechanical/Civil/Electrical)
6. Biotechnology & Life Sciences
7. Medicine & Public Health
8. Law
9. Arts, Design & Architecture
10. Social Sciences & Humanities
11. Economics & Finance
12. Media & Communications
13. Environmental & Sustainability Studies
14. Natural Sciences
15. Nursing & Allied Health
16. Agriculture & Veterinary Sciences
17. Hospitality & Tourism

ALL ${DB_STATS.totalUniversities}+ UNIVERSITIES IN OUR DATABASE:

${uniListSection}

SCHOLARSHIPS BY COUNTRY (on our platform):

USA:
- Fulbright Foreign Student Program — Fully funded (tuition, living stipend, travel, health)
- Hubert H. Humphrey Fellowship — Fully funded (mid-career professionals)
- University Merit Scholarships — Partial to Full (Presidential, Dean's, departmental awards)
- STEM OPT + RA/TA Funding — Tuition waiver + stipend (PhD & MS STEM students)
- Aga Khan Foundation — Partial (students from developing countries)

UK:
- Chevening Scholarship — Fully funded (UK Govt; 1-year Masters)
- Commonwealth Scholarship — Fully funded (Commonwealth nations)
- GREAT Scholarship — £10,000 minimum (UK Govt + university)
- Gates Cambridge Scholarship — Fully funded (exceptional scholars at Cambridge)
- Rhodes Scholarship — Fully funded (postgraduate at Oxford)
- University Scholarships — Partial to Full (UCL, Imperial, Edinburgh, Manchester)

Australia:
- Australia Awards — Fully funded (tuition, living, travel, health)
- Destination Australia — AUD 15,000/yr (regional study)
- Research Training Program (RTP) — Tuition waiver + stipend (PhD & research Masters)
- Monash International Merit — AUD 10,000–50,000
- University of Sydney ISS — 25–50% tuition
- Endeavour Scholarships — Fully funded (govt-backed)

Canada:
- Vanier Canada Graduate Scholarship — CAD 50,000/yr (doctoral)
- Banting Postdoctoral Fellowship — CAD 70,000/yr
- UBC International Major Entrance — CAD 40,000+
- UofT International Scholar Award — CAD 40,000+
- Ontario Trillium Scholarship — CAD 40,000/yr (PhD in Ontario)
- University Merit Awards — Partial to Full (Waterloo, McGill, Alberta)

Germany:
- DAAD Scholarship — €750–1,200/month
- Deutschlandstipendium — €300/month
- Heinrich Böll Foundation — €850/month + extras
- Friedrich Ebert Foundation — €850/month + extras
- Konrad Adenauer Foundation — €850/month + extras
- Erasmus+ — €300–600/month (exchange)

Singapore:
- Singapore Government Scholarship (MOE) — Fully funded + bond
- ASEAN Undergraduate Scholarship — Fully funded
- NUS Research Scholarship — Tuition waiver + SGD 2,000/month
- NTU Research Scholarship — Tuition waiver + SGD 2,000/month
- A*STAR Graduate Scholarship — Fully funded (science & tech PhD)

New Zealand:
- New Zealand Excellence Awards (NZEA) — NZD 10,000
- New Zealand Aid Programme — Fully funded (developing countries)
- Victoria University Merit Award — NZD 5,000–10,000

Ireland:
- Government of Ireland International Education Scholarship — €10,000 (1 year)
- UCD Global Excellence Scholarship — €3,000–10,000

France:
- Eiffel Excellence Scholarship — €1,181/month Masters; €1,400/month PhD
- Campus France Bilateral Scholarships — Varies by country (India-France bilateral)

UAE:
- Khalifa University Scholarship — Full tuition + AED 1,500/month
- AUS Merit Scholarship — 25–100% tuition (American University of Sharjah)
- ADEC Scholarship (Abu Dhabi) — Fully funded (select bilateral agreements)

Malaysia:
- Malaysia International Scholarship (MIS) — Full tuition + living (postgrad)
- Malaysian Govt (MoHE) Scholarship — Full tuition + living (bilateral partners)
- University-specific merit awards — 25–50% tuition reduction

MATCHING TIERS ON eduvianAI:
- SAFE: Programs where your profile comfortably meets or exceeds requirements (match score typically 75+)
- REACH: Programs where your profile is close but slightly below average admitted student (match score 50–74)
- AMBITIOUS: Highly competitive programs where admission is selective (match score below 50)
Recommended shortlist mix: 30% Safe · 50% Reach · 20% Ambitious

10 MATCHING SIGNALS USED:
1. Academic score (GPA / percentage / IB / IGCSE)
2. English proficiency (IELTS / TOEFL / PTE / Duolingo)
3. Budget vs total annual cost (tuition + living)
4. Country preference alignment
5. QS World Ranking preference
6. Intake timing (Fall/Spring/Year)
7. Work experience (for PG programs)
8. Standardised tests (GRE / GMAT / SAT)
9. Backlogs / arrears history
10. Academic gap year

DEGREE LEVELS: Undergraduate (UG) and Postgraduate (PG/Masters/PhD)
INTAKES: Fall (September) and Spring (January/February)
TARGET YEARS: 2025 and 2026 intakes
`;

const SYSTEM_PROMPT = `You are eduvianAI's study-abroad advisor. You ONLY answer questions using the information provided in the platform data below. Do not use any external knowledge, general internet knowledge, or information about universities/programs not listed in the platform data.

${PLATFORM_DATA}

YOUR STRICT RULES:
1. ONLY answer using the platform data above. If a university, program, country, or scholarship is not in the data above, say "That's not currently in our database. We cover [relevant options from our data]."
2. ONLY answer questions about higher education and studying abroad. For any off-topic question (politics, entertainment, coding, recipes, etc.) say: "I can only help with study-abroad questions. What would you like to know about studying abroad?"
3. When a student asks about programs or universities, reference specific institutions from our database by country.
4. Always encourage using the free eduvianAI matching tool: "For a personalised TOP 20 shortlist based on your exact profile, use our free matching tool — it takes just 4 steps!"
5. Be warm, concise, and helpful. Use bullet points for lists.
6. When mentioning costs, scholarships, or requirements — only cite what's in the platform data above.
7. Keep responses under 300 words unless a detailed comparison is genuinely needed.
8. Do NOT invent statistics, acceptance rates, or specific program details not in the data.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, programsContext } = await req.json() as { messages: ChatMessage[]; programsContext?: string };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat service not configured" },
        { status: 503 }
      );
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const systemPrompt = programsContext
      ? `${SYSTEM_PROMPT}\n\n${programsContext}\n\nIMPORTANT: The student is viewing their matched results page. Prioritise answering questions about their specific matched programs listed above. You have full details on each program — use them to give specific, helpful answers.`
      : SYSTEM_PROMPT;

    // Retry up to 3 times on 529 (overloaded) errors
    let response;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await client.messages.create({
          model: "claude-haiku-4-5",
          max_tokens: 600,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });
        break; // success
      } catch (apiErr: unknown) {
        const status = (apiErr as { status?: number })?.status;
        if (status === 529 && attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1500)); // 1.5s, 3s
          continue;
        }
        throw apiErr;
      }
    }

    if (!response) throw new Error("No response after retries");

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: text });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 529) {
      return NextResponse.json(
        { error: "Our AI advisor is experiencing high demand right now. Please try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
