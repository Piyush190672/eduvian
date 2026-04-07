import { NextRequest, NextResponse } from "next/server";

// ── Platform knowledge base ────────────────────────────────────────────────
const PLATFORM_DATA = `
=== eduvianAI PLATFORM DATA ===

ABOUT eduvianAI:
eduvianAI is a study-abroad matching platform that helps students find the right university and program abroad. It uses a 10-signal AI matching engine (GPA/academic score, English proficiency, budget, country preference, QS ranking, intake timing, work experience, standardised tests, backlogs, gap year) to score and rank programs against a student's profile. Students get a personalised TOP 20 shortlist with Safe / Reach / Ambitious tiers.

COUNTRIES WE COVER (11 total):
1. USA — 953 programs across top universities
2. UK — 1,857 programs (largest database)
3. Australia — 823 programs
4. Canada — 395 programs
5. Germany — 309 programs
6. Malaysia — 273 programs
7. New Zealand — 205 programs
8. France — 183 programs
9. Ireland — 171 programs
10. Singapore — 141 programs
11. UAE — 124 programs

TOTAL DATABASE: 5,400+ programs across 241 universities, 17 fields of study.

FIELDS OF STUDY ON THE PLATFORM (17):
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

ALL 241 UNIVERSITIES IN OUR DATABASE:

USA (43 universities):
Arizona State University, Boston University, California Institute of Technology, Carnegie Mellon University, Columbia University, Cornell University, Duke University, Georgetown University, Georgia Institute of Technology, Harvard University, Johns Hopkins University, Massachusetts Institute of Technology, Northeastern University, Northwestern University, NYU Stern School of Business, Ohio State University, Penn State University, Princeton University, Purdue University, Rice University, Stanford University, Texas A&M University, UC San Diego, UCLA, University of California Berkeley, University of Illinois Urbana-Champaign, University of Michigan, University of Pennsylvania, University of Southern California, University of Texas at Austin, University of Toronto (Canada border note), University of Washington, University of Wisconsin-Madison, Yale University

UK (77 universities):
Anglia Ruskin University, Aston University, Bangor University, Bath Spa University, Birkbeck University of London, Birmingham City University, Bournemouth University, Brunel University London, Cardiff Metropolitan University, Cardiff University, City University of London, Coventry University, De Montfort University, Durham University, Edinburgh Napier University, Glasgow Caledonian University, Goldsmiths University of London, Heriot-Watt University, Imperial College London, Keele University, King's College London, Kingston University London, Lancaster University, Leeds Beckett University, London School of Economics, London South Bank University, Loughborough University, Manchester Metropolitan University, Middlesex University London, Newcastle University, Northumbria University, Nottingham Trent University, Oxford Brookes University, Queen Mary University of London, Queen's University Belfast, Robert Gordon University, Royal Holloway University of London, SOAS University of London, Sheffield Hallam University, Staffordshire University, Swansea University, Teesside University, Ulster University, University College London, University of Aberdeen, University of Bath, University of Birmingham, University of Brighton, University of Bristol, University of Cambridge, University of Central Lancashire, University of Chester, University of Dundee, University of East Anglia, University of Edinburgh, University of Essex, University of Exeter, University of Glasgow, University of Gloucestershire, University of Greenwich, University of Hertfordshire, University of Huddersfield, University of Hull, University of Kent, University of Leeds, University of Leicester, University of Lincoln, University of Liverpool, University of Manchester, University of Northampton, University of Nottingham, University of Oxford, University of Plymouth, University of Portsmouth, University of Reading, University of Salford, University of Sheffield, University of Southampton, University of St Andrews, University of Stirling, University of Strathclyde, University of Sunderland, University of Surrey, University of Warwick, University of Westminster, University of West of England, University of West of Scotland, University of Wolverhampton, University of Worcester, University of York

Australia (28 universities):
Australian Catholic University, Australian National University, Bond University, Charles Darwin University, Charles Sturt University, CQUniversity, Curtin University, Deakin University, Edith Cowan University, Federation University, Flinders University, Griffith University, James Cook University, La Trobe University, Macquarie University, Monash University, Murdoch University, RMIT University, Southern Cross University, Swinburne University of Technology, Torrens University Australia, University of Adelaide, University of Canberra, University of Melbourne, University of New South Wales, University of Newcastle, University of Queensland, University of South Australia, University of Sydney, University of Tasmania, University of Technology Sydney, University of Western Australia, University of Wollongong, Victoria University, Western Sydney University, University of the Sunshine Coast, University of the West of England (branch)

Canada (16 universities):
Concordia University, Dalhousie University, McGill University, McMaster University, Queen's University, Simon Fraser University, Toronto Metropolitan University, University of Alberta, University of British Columbia, University of Calgary, University of Ottawa, University of Victoria, University of Waterloo, University of Western Ontario, Western University, York University

Germany (13 universities):
Free University of Berlin, Goethe University Frankfurt, Heidelberg University, Karlsruhe Institute of Technology, Mannheim Business School, RWTH Aachen University, TU Berlin, Technical University of Munich, University of Freiburg, University of Hamburg, University of Munich (LMU), University of Stuttgart, Vrije Universiteit Amsterdam (Netherlands — listed for reference)

France (7 universities):
EDHEC Business School, ESSEC Business School, HEC Paris, INSEAD, Paris Sciences et Lettres University, Sciences Po, Sorbonne University, Université Paris-Saclay, École Polytechnique

Ireland (8 universities):
Dublin City University, Dublin Institute of Technology (TU Dublin), Maynooth University, National University of Ireland Galway, Trinity College Dublin, University College Cork, University College Dublin, University of Limerick

New Zealand (8 universities):
AUT — Auckland University of Technology, Massey University, University of Auckland, University of Canterbury, University of Otago, Victoria University of Wellington, Waikato University

Singapore (6 universities):
ESSEC Business School Asia-Pacific, INSEAD Asia Campus, James Cook University Singapore, Nanyang Technological University, National University of Singapore, Singapore Management University, Singapore University of Technology and Design, SP Jain School of Global Management

UAE (9 universities):
Abu Dhabi University, American University of Sharjah, BITS Pilani Dubai Campus, Heriot-Watt University Dubai, Khalifa University, Middlesex University Dubai, University of Dubai, University of Wollongong Dubai

Malaysia (14 universities):
APU — Asia Pacific University, Heriot-Watt University Malaysia, Monash University Malaysia, Multimedia University, Sunway University, Taylor's University, Universiti Kebangsaan Malaysia, Universiti Malaya, Universiti Putra Malaysia, Universiti Sains Malaysia, Universiti Teknologi Malaysia, Universiti Teknologi PETRONAS

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
    const { messages } = await req.json() as { messages: ChatMessage[] };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat service not configured" },
        { status: 503 }
      );
    }

    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: text });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
