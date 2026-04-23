"use client";

// ─── Web Speech API type shims ────────────────────────────────────────────────
interface SpeechRecognitionResultItem { transcript: string; confidence: number; }
interface SpeechRecognitionResult {
  readonly isFinal: boolean; readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventShim extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionShim extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: SpeechRecognitionEventShim) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionCtor { new(): SpeechRecognitionShim; }

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, Clock, CheckCircle2, AlertTriangle,
  Mic, MicOff, Volume2, VolumeX, ChevronRight, Loader2,
  BookOpen, PenLine, Headphones, MessageSquare, BarChart2,
  RotateCcw, Star, TrendingUp, AlertCircle, ExternalLink
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import AuthGate from "@/components/AuthGate";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "section_select" | "landing" | "instructions" | "listening" | "reading" | "writing" | "speaking" | "submitting" | "results";

interface MCQQuestion { type: "mcq"; question: string; options: string[]; answer: number; }
interface TFNGQuestion { type: "tfng"; statement: string; answer: "True" | "False" | "Not Given"; }
interface FillQuestion { type: "fill"; question: string; answer: string; }
interface MatchQuestion { type: "match"; statement: string; answer: string; }
type ReadingQuestion = MCQQuestion | TFNGQuestion | FillQuestion | MatchQuestion;

interface ListeningQuestion {
  type: "mcq" | "fill" | "tf" | "match";
  question: string;
  options?: string[];
  answer: string;
}

interface SectionScore {
  raw?: number;
  total?: number;
  band?: number;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
  criteria?: Record<string, { score: number; max: number; comment: string }>;
}

// ─── Content Data ─────────────────────────────────────────────────────────────

const LISTENING_PARTS = [
  {
    context: "Part 1: A student speaks to a university accommodation officer about moving into a new dormitory.",
    transcript: `
Accommodation Officer: Good morning! Welcome to the University Accommodation Office. How can I help you today?
Student: Hi, good morning. I'm hoping to book a room in the Westfield Hall dormitory. My name is James Chen.
Officer: Lovely. Let me pull up our availability. Are you looking for a single or shared room?
Student: A single room would be great, if possible. I need somewhere quiet to study.
Officer: Absolutely. We have two single rooms available in Westfield — one on the ground floor, room 12, and one on the third floor, room 34. The ground floor room has a garden view and the third-floor room overlooks the campus quad.
Student: I think I'd prefer the third-floor one with the campus view.
Officer: Excellent choice. Room 34 it is. Now, the weekly rate is ninety-five pounds, which includes electricity and Wi-Fi but not meals. The dining hall is open daily from seven in the morning until nine at night.
Student: That sounds fine. How do I pay?
Officer: We accept direct bank transfer or credit card. Payment is due on the first of each month.
Student: Got it. Is there a laundry room in the building?
Officer: Yes, it's in the basement — you'll need a top-up card, available from the porter's office. One wash costs two pounds fifty.
Student: And when can I move in?
Officer: We have a room available from the fifteenth of September. You'll need to bring a form of photo ID and your student registration card on move-in day.
Student: Perfect. One last thing — is parking available for residents?
Officer: There's a limited number of parking permits, but students in Westfield Hall qualify to apply. The cost is forty pounds per term.
Student: That's helpful, thank you so much.
Officer: My pleasure. I'll send the booking confirmation to your university email address. Welcome to Westfield Hall!
`,
    questions: [
      { type: "fill", question: "The student's name is James ___.", answer: "Chen" },
      { type: "mcq", question: "Which room does the student choose?", options: ["A. Room 12", "B. Room 34", "C. Room 21", "D. Room 43"], answer: "B" },
      { type: "fill", question: "The weekly rate for the room is £___.", answer: "95" },
      { type: "tf", question: "Meals are included in the room rate.", answer: "False" },
      { type: "fill", question: "The laundry room is located in the ___.", answer: "basement" },
      { type: "mcq", question: "How much does one laundry wash cost?", options: ["A. £1.50", "B. £2.00", "C. £2.50", "D. £3.00"], answer: "C" },
      { type: "fill", question: "The move-in date is the ___ of September.", answer: "15th" },
      { type: "tf", question: "Students need a driving licence to collect their room key.", answer: "False" },
      { type: "fill", question: "A parking permit costs £___ per term.", answer: "40" },
      { type: "tf", question: "The booking confirmation will be sent by post.", answer: "False" },
    ] as ListeningQuestion[],
  },
  {
    context: "Part 2: A university guide gives a tour to new students, describing campus facilities.",
    transcript: `
Guide: Welcome, everyone, to Greenfield University! I'm Sophie, and I'll be your guide today. We'll walk through the main buildings and I'll point out all the key facilities you'll use during your studies.

We're standing now at the Main Entrance, facing north. To your left is the Student Services Hub, which is your first port of call for all administrative matters — student ID, timetables, accommodation enquiries, and financial advice. It's open Monday to Friday from eight-thirty in the morning until six in the evening.

Directly ahead is the Meridian Library — the largest building on campus. It holds over four hundred thousand volumes, has two hundred and fifty individual study carrels, and four group discussion rooms that can be booked online. The library operates twenty-four hours a day during exam periods.

If we turn right and follow the path past the fountain, you'll reach the Science and Technology Block. This houses the physics, chemistry, and computer science departments, as well as two state-of-the-art computer labs — each with sixty workstations. Students can access these labs at any hour using their swipe card.

Further along, on the eastern side of campus, you'll find the Sports and Recreation Centre. It includes a twenty-five-metre swimming pool, a fully equipped gym, squash courts, and a dedicated yoga studio. Membership is free for full-time students.

Finally, the Student Union Building — located just south of the library — is your social hub. It has a café, a bar, a games room, and an event space that hosts weekly live music. The Student Union organises over sixty clubs and societies, so there's something for everyone.

Any questions so far? We'll have more time for those at the end of the tour. Let's continue to the Faculty of Arts building next.
`,
    questions: [
      { type: "mcq", question: "What is the name of the tour guide?", options: ["A. Sarah", "B. Sophie", "C. Susan", "D. Stephanie"], answer: "B" },
      { type: "fill", question: "The Student Services Hub is open until ___ in the evening.", answer: "6" },
      { type: "fill", question: "The library holds over ___ volumes.", answer: "400,000" },
      { type: "tf", question: "The library is open 24 hours every day of the year.", answer: "False" },
      { type: "fill", question: "Each computer lab has ___ workstations.", answer: "60" },
      { type: "mcq", question: "What is NOT mentioned as a facility in the Sports Centre?", options: ["A. Swimming pool", "B. Tennis courts", "C. Gym", "D. Yoga studio"], answer: "B" },
      { type: "tf", question: "Gym membership is free for full-time students.", answer: "True" },
      { type: "fill", question: "The Student Union Building is located ___ of the library.", answer: "south" },
      { type: "mcq", question: "How many clubs and societies does the Student Union organise?", options: ["A. Over 40", "B. Over 50", "C. Over 60", "D. Over 70"], answer: "C" },
      { type: "tf", question: "The tour ends at the Faculty of Arts building.", answer: "False" },
    ] as ListeningQuestion[],
  },
  {
    context: "Part 3: Two students, Aisha and Marcus, discuss their research project on urban transport.",
    transcript: `
Aisha: Marcus, have you had a chance to look at the research brief for our transport project?
Marcus: Yes, I read through it last night. I think the most interesting angle would be comparing cycling infrastructure in two different cities. What do you think?
Aisha: I agree. I was thinking we could look at Amsterdam and one city in a developing country — maybe Bogotá in Colombia. They've invested a lot in their bike lane network.
Marcus: That's a great contrast. Amsterdam has had decades to develop its cycling culture, whereas Bogotá has been building its infrastructure more recently, partly out of necessity.
Aisha: Exactly. The question is how we gather our data. We can't travel to either city, so we'll have to rely on published statistics and academic papers.
Marcus: Right. I found three or four solid peer-reviewed articles last night. There's one from the Journal of Urban Planning from 2022 that has really detailed statistics on modal share — that's the proportion of journeys made by each transport mode.
Aisha: Good. We should also look at government transport reports from both cities. Those usually have the most up-to-date figures.
Marcus: True. What about the structure of the report? Should we go chronological or thematic?
Aisha: I'd suggest thematic. If we split it into sections like infrastructure investment, safety data, and environmental impact, it'll be easier to compare the two cities directly.
Marcus: I like that. Who's going to write which section?
Aisha: How about I take infrastructure investment and you take safety data? We can both contribute to the environmental impact section together.
Marcus: Works for me. One thing I'm a bit worried about is the word count — the brief says a minimum of three thousand words. Do you think we can reach that?
Aisha: Definitely. Once we get into the data it tends to expand. Shall we meet again on Thursday to compare what we've found?
Marcus: Thursday afternoon suits me. Let's say two o'clock in the library study room.
`,
    questions: [
      { type: "mcq", question: "What topic have Aisha and Marcus chosen for their project?", options: ["A. Urban architecture", "B. Cycling infrastructure", "C. Public transport funding", "D. Road safety laws"], answer: "B" },
      { type: "fill", question: "The two cities being compared are Amsterdam and ___.", answer: "Bogotá" },
      { type: "tf", question: "The students plan to travel to the cities for their research.", answer: "False" },
      { type: "fill", question: "Marcus found an article from the Journal of ___ Planning.", answer: "Urban" },
      { type: "mcq", question: "What does 'modal share' refer to?", options: ["A. Environmental impact data", "B. Government transport funding", "C. Proportion of journeys by each transport mode", "D. Road infrastructure quality"], answer: "C" },
      { type: "fill", question: "Aisha will write the section on infrastructure ___.", answer: "investment" },
      { type: "tf", question: "Both students will write the environmental impact section together.", answer: "True" },
      { type: "mcq", question: "What is the minimum word count for their report?", options: ["A. 2,000 words", "B. 2,500 words", "C. 3,000 words", "D. 3,500 words"], answer: "C" },
      { type: "fill", question: "They plan to meet again on ___.", answer: "Thursday" },
      { type: "tf", question: "Their next meeting will be in the cafeteria.", answer: "False" },
    ] as ListeningQuestion[],
  },
  {
    context: "Part 4: A university lecture on urban sustainability and green city planning.",
    transcript: `
Lecturer: Good afternoon, everyone. Today's lecture continues our series on environmental design, and we'll be focusing on urban sustainability — specifically, what it means to build a city that can support its population for generations to come without depleting the resources it depends upon.

Cities currently account for roughly seventy percent of global energy consumption and produce around sixty percent of the world's carbon emissions. With over half the world's population now living in urban areas, and that figure projected to rise to seventy percent by 2050, the decisions we make about how we design, build, and manage cities are among the most consequential of our time.

The concept of the sustainable city rests on three interconnected pillars: environmental resilience, social equity, and economic viability. Let me take each in turn.

Environmental resilience refers to a city's ability to adapt to and recover from environmental stresses — whether those are extreme weather events, resource scarcity, or long-term climate shifts. Strategies include green roofs, urban forests, permeable paving that reduces surface water run-off, and the integration of renewable energy sources into the built fabric of the city.

Social equity is the principle that the benefits of urban life — clean air, green space, reliable transport, quality healthcare — should be accessible to all residents, not just those who can afford to live in premium neighbourhoods. Research consistently shows that cities with greater inequality tend to be less resilient overall, as disadvantaged communities bear a disproportionate burden during environmental crises.

Economic viability is the third pillar — a sustainable city must be financially self-sufficient, able to invest in infrastructure and services without relying on perpetual external subsidy. This often involves circular economy models, where waste is treated as a resource, and local industries are supported to reduce the economic leakage that weakens many urban economies.

The case of Singapore is frequently cited as an exemplar. Since independence, Singapore has invested heavily in urban greenery, water recycling, and integrated public transport — not as a luxury, but as a core infrastructure priority. The result is a densely populated city with a remarkably high quality of life and a strong record on environmental metrics.

In your seminar this week, you'll examine two contrasting case studies. I'd encourage you to think critically about which aspects of the Singapore model are transferable to cities in lower-income contexts, and which depend on specific political and economic conditions that may not be replicable elsewhere.

Thank you for your attention. Questions after class, please.
`,
    questions: [
      { type: "fill", question: "Cities account for roughly ___% of global energy consumption.", answer: "70" },
      { type: "fill", question: "The world's urban population is projected to reach ___% by 2050.", answer: "70" },
      { type: "mcq", question: "What are the three pillars of a sustainable city?", options: ["A. Energy, water, transport", "B. Environmental resilience, social equity, economic viability", "C. Green space, housing, infrastructure", "D. Technology, governance, economy"], answer: "B" },
      { type: "fill", question: "Permeable paving helps to reduce surface water ___.", answer: "run-off" },
      { type: "tf", question: "Cities with greater inequality tend to be more resilient.", answer: "False" },
      { type: "mcq", question: "What does a circular economy model treat as a resource?", options: ["A. Foreign investment", "B. Tourism income", "C. Waste", "D. Renewable energy"], answer: "C" },
      { type: "fill", question: "The case study cited as an exemplar of sustainability is ___.", answer: "Singapore" },
      { type: "tf", question: "Singapore treated urban greenery as an optional luxury.", answer: "False" },
      { type: "fill", question: "Students will examine ___ contrasting case studies in the seminar.", answer: "two" },
      { type: "tf", question: "The lecturer believes the Singapore model is entirely replicable elsewhere.", answer: "False" },
    ] as ListeningQuestion[],
  },
];

const READING_PASSAGES = [
  {
    title: "The Cognitive Benefits of Bilingualism",
    text: `The question of whether speaking two or more languages confers measurable cognitive advantages has occupied researchers for several decades. Early studies, conducted primarily in laboratory settings, suggested that bilingual individuals outperformed monolinguals on tasks requiring selective attention and the suppression of irrelevant information — a capacity broadly described as executive function. Yet more recent meta-analyses have complicated this picture considerably, raising questions about methodology, publication bias, and the degree to which any advantage, if it exists, translates to real-world cognitive performance.

The theoretical basis for a bilingual cognitive advantage rests on the idea that managing two language systems simultaneously exercises the brain's inhibitory control mechanisms. When a bilingual person speaks in one language, the competing language does not simply switch off; neuroimaging studies indicate that both languages remain active, requiring the speaker to constantly select the appropriate lexicon and suppress the inappropriate one. Proponents argue that this perpetual linguistic juggling act strengthens the same cognitive architecture that underpins tasks like task-switching, working memory maintenance, and conflict monitoring.

Several high-profile studies lent credibility to this view. Ellen Bialystok and colleagues, working primarily with adult and elderly populations, found that bilingual individuals diagnosed with Alzheimer's disease showed symptom onset approximately four to five years later than monolingual patients with equivalent levels of neurological pathology. This finding — suggesting that bilingualism may contribute to what researchers call cognitive reserve — attracted widespread media attention and influenced educational policy in several countries.

However, the past decade has seen a significant reappraisal. When researchers attempted to replicate the executive function advantage using larger, more diverse samples, the effect either disappeared entirely or shrank to statistical insignificance. A 2015 meta-analysis by Kenneth Paap and colleagues examined over eight hundred studies and found no consistent evidence of a bilingual advantage in executive function tasks. Critics pointed to the fact that many positive studies had been conducted with small, highly selective samples, and that journals were less likely to publish null results — a phenomenon known as the file drawer problem.

The debate has since become more nuanced. Researchers now generally acknowledge that any bilingual advantage is likely modest, variable, and dependent on a range of mediating factors including the degree of proficiency in each language, the frequency with which the individual switches between languages, and the socioeconomic and educational context in which bilingualism is acquired. Balanced bilinguals who use both languages daily in cognitively demanding contexts show more consistent — if still modest — advantages than those who acquired a second language formally in a classroom setting without regular use.

Beyond cognition, there are well-established benefits to bilingualism that are sometimes overlooked in the executive function debate. Bilinguals demonstrate greater metalinguistic awareness — the ability to think about and reflect on language as a system — which supports literacy development and language learning more broadly. They also appear better equipped for cross-cultural communication, demonstrating heightened sensitivity to the communicative needs and perspectives of interlocutors. In an increasingly globalised labour market, these skills carry tangible professional value.

The challenge for educators and policymakers is to communicate the genuine, if qualified, benefits of bilingualism without overstating the evidence or setting unrealistic expectations. The message is not that bilingualism makes people smarter in some general sense, but that maintaining active competence in two languages may support specific cognitive skills while delivering rich communicative, cultural, and professional rewards.`,
    questions: [
      { type: "tfng", statement: "Early research consistently found that bilingual people outperform monolinguals on all cognitive tasks.", answer: "False" },
      { type: "tfng", statement: "Neuroimaging shows that a bilingual person's second language is completely inactive during speech.", answer: "False" },
      { type: "tfng", statement: "Bialystok's research found that bilingualism may delay Alzheimer's symptoms by four to five years.", answer: "True" },
      { type: "tfng", statement: "Paap's 2015 meta-analysis examined over eight hundred studies.", answer: "True" },
      { type: "tfng", statement: "The file drawer problem refers to the tendency for laboratories to lose research data.", answer: "False" },
      { type: "mcq", question: "What does 'cognitive reserve' most likely mean in this context?", options: ["A. A financial reserve for brain research", "B. Resistance to cognitive decline through mental resources built over time", "C. The maximum number of languages a person can learn", "D. A type of memory storage"], answer: "B" },
      { type: "mcq", question: "According to the passage, which group shows the most consistent cognitive advantage?", options: ["A. Children who learned a second language in school", "B. Elderly monolinguals with high education levels", "C. Balanced bilinguals who use both languages daily in demanding contexts", "D. People who speak three or more languages"], answer: "C" },
      { type: "fill", question: "The ability to reflect on language as a system is called ___ awareness.", answer: "metalinguistic" },
      { type: "fill", question: "Bilinguals may demonstrate greater sensitivity to the needs and perspectives of ___.", answer: "interlocutors" },
      { type: "match", statement: "The passage suggests that the bilingual advantage debate has become more ___.", answer: "nuanced" },
      { type: "match", statement: "Bilinguals who only learned a second language in a ___ setting showed less consistent advantages.", answer: "classroom" },
      { type: "mcq", question: "What is the overall conclusion of the passage regarding bilingualism?", options: ["A. Bilingualism makes people universally more intelligent", "B. There are no cognitive benefits to bilingualism", "C. Bilingualism has qualified cognitive benefits alongside communicative and cultural advantages", "D. Bilingualism only benefits elderly people"], answer: "C" },
      { type: "tfng", statement: "The passage states that educational policy in some countries was influenced by Bialystok's findings.", answer: "True" },
    ] as ReadingQuestion[],
  },
  {
    title: "Circular Economy: Rethinking Industrial Production",
    text: `The linear model of industrial production — extract raw materials, manufacture goods, sell, use, discard — has underpinned economic growth for nearly two centuries. It is also, many argue, fundamentally incompatible with the finite ecological boundaries of the planet. The circular economy is the most systematic alternative that has gained traction in both policy circles and the private sector, offering a framework in which waste is redesigned out of the production system and materials are kept in use for as long as possible before being safely returned to the biosphere.

The concept draws on several intellectual traditions. In ecology, the idea mirrors the closed-loop nutrient cycles of natural ecosystems, where the waste product of one organism becomes the feedstock of another. In engineering and design, it echoes the principles of cradle-to-cradle design, articulated by architect William McDonough and chemist Michael Braungart in their 2002 book of the same name. In economics, it connects to the concept of resource productivity — achieving more output from each unit of material input.

The Ellen MacArthur Foundation, established in 2010, has become perhaps the most prominent advocate for circular economy principles globally. Its reports have quantified the potential economic benefits, estimating that circular practices could generate over one trillion dollars in annual savings for global businesses by 2025 through reduced material costs, new product-as-a-service business models, and regenerative supply chains.

In practice, the circular economy operates at several levels. At the product level, it involves designing goods to be durable, repairable, upgradeable, and ultimately recoverable — replacing the disposability assumption that characterises much of modern manufacturing. Companies like Fairphone, which makes modular smartphones with user-replaceable components, and Caterpillar, which has a large-scale remanufacturing programme for industrial equipment, are often cited as pioneers.

At the system level, industrial symbiosis — the practice of one firm's waste becoming another's resource — has been implemented in industrial parks worldwide. The Kalundborg Symbiosis park in Denmark, often described as the world's first industrial ecosystem, has operated since the 1970s, with companies exchanging surplus steam, fly ash, waste water, and cooling water in a network that reduces both resource consumption and pollution.

Challenges remain substantial. The economics of circular systems are often unfavourable in contexts where virgin materials are cheap and externalities such as pollution and resource depletion are not priced into market transactions. Technically, many products are difficult to disassemble cleanly, as they combine multiple materials bonded by adhesives or complex composites. Consumer behaviour presents another barrier: even when products are designed for repair or return, many people default to disposal out of habit or inconvenience.

Policy has a critical role to play in addressing these market failures. Extended producer responsibility schemes — which require manufacturers to take back products at the end of their life — have been implemented with varying degrees of success in Europe. Taxes on virgin materials and subsidies for recycled content can shift the economics in favour of circular models. Building mandatory repairability standards into product regulations, as the European Union began doing in 2021, directly challenges the throwaway model at the design stage.

The transition to a circular economy is not a marginal adjustment to the existing industrial system but a structural transformation that requires coordinated change across design, business models, consumer culture, and public policy. Its proponents argue that this transformation is not merely desirable but necessary if economic activity is to remain within the ecological limits that sustain it.`,
    questions: [
      { type: "tfng", statement: "The linear model of production has been dominant for approximately two hundred years.", answer: "True" },
      { type: "tfng", statement: "The circular economy concept was first proposed by the Ellen MacArthur Foundation.", answer: "False" },
      { type: "tfng", statement: "McDonough and Braungart published their cradle-to-cradle principles in 2002.", answer: "True" },
      { type: "mcq", question: "What does the Ellen MacArthur Foundation estimate the annual savings from circular practices could be?", options: ["A. Over 500 billion dollars", "B. Over one trillion dollars", "C. Over two trillion dollars", "D. 750 billion dollars"], answer: "B" },
      { type: "fill", question: "The Fairphone is described as making modular smartphones with user-___ components.", answer: "replaceable" },
      { type: "fill", question: "Industrial symbiosis involves one firm's ___ becoming another firm's resource.", answer: "waste" },
      { type: "tfng", statement: "The Kalundborg Symbiosis park was established in the 1990s.", answer: "False" },
      { type: "mcq", question: "Why do circular systems often face economic challenges?", options: ["A. They require expensive technology", "B. Virgin materials are cheap and externalities are not priced in", "C. There is no consumer demand for sustainable products", "D. Governments actively discourage recycling"], answer: "B" },
      { type: "fill", question: "Extended producer responsibility schemes require manufacturers to ___ products at the end of their life.", answer: "take back" },
      { type: "tfng", statement: "The EU introduced mandatory repairability standards in product regulations in 2021.", answer: "True" },
      { type: "mcq", question: "The passage characterises the transition to a circular economy as:", options: ["A. A minor adjustment to existing practices", "B. Primarily a technology challenge", "C. A structural transformation requiring coordinated change", "D. Already largely completed in developed countries"], answer: "C" },
      { type: "match", statement: "The author describes the linear economy's incompatibility with finite ___ boundaries.", answer: "ecological" },
      { type: "tfng", statement: "Consumer behaviour is identified as a potential barrier to circular economy adoption.", answer: "True" },
    ] as ReadingQuestion[],
  },
  {
    title: "The Paradox of Choice and Consumer Behaviour",
    text: `In 1956, the cognitive psychologist George Miller published an influential paper arguing that the human working memory can reliably hold approximately seven pieces of information simultaneously, plus or minus two. While subsequent research has revised this figure downward, Miller's intuition that our cognitive resources are finite and can be overwhelmed by excess stimuli has proven remarkably durable. Nowhere has this insight found a more contentious application than in the study of consumer decision-making, where the question of whether more choice is always better has generated a substantial body of conflicting evidence.

The popular debate was crystallised in Barry Schwartz's 2004 book, The Paradox of Choice: Why More is Less. Drawing on psychological research, Schwartz argued that the proliferation of consumer options in contemporary Western societies — from hundreds of varieties of jam to thousands of investment funds — far from liberating individuals, was making them more anxious, less satisfied, and less capable of making decisions at all. The psychological mechanisms he identified included opportunity cost regret (the tendency to feel worse about a chosen option when rejected alternatives were also attractive), counterfactual thinking (imagining better outcomes that might have followed from different choices), and a rising threshold of satisfaction (as more options are available, the expectation of a perfect fit increases, making any given choice more likely to feel inadequate).

Schwartz divided consumers into two types: maximisers, who seek the best possible option and will expend considerable effort to find it, and satisficers, who settle for an option that meets a minimum acceptable threshold. His research suggested that maximisers, despite often making objectively better choices by external criteria, consistently reported lower levels of satisfaction and higher levels of regret than satisficers. The maximiser's curse — expending more effort and achieving less happiness — has become one of the most widely cited findings in consumer psychology.

Empirical support for the paradox of choice was provided by a now-famous study by Sheena Iyengar and Mark Lepper, which examined jam purchases at a gourmet grocery store. When shoppers encountered a display of twenty-four jam varieties, six percent of those who stopped ultimately made a purchase. When the display was reduced to six varieties, the purchase rate rose to thirty percent. The implication — that reducing choice can actually increase consumption — challenged conventional marketing wisdom and sparked considerable academic debate.

However, the paradox of choice hypothesis has not gone unchallenged. A 2010 meta-analysis by Scheibehenne, Greifeneder, and Todd examined over fifty studies and found that the overall effect of choice overload on decision quality, satisfaction, and regret was, on average, essentially zero. The authors argued that the conditions under which too much choice becomes problematic are highly specific and context-dependent. Overload effects were most pronounced when consumers had no clear preference, when options differed in difficult-to-compare ways, and when the stakes of the decision were high. In familiar product categories where consumers have well-established preferences, more choice appears to be genuinely welcome.

The practical implications for marketers and policy designers are therefore nuanced. In high-stakes, unfamiliar domains — health insurance, retirement savings, medical treatment options — there is good evidence that simplifying the choice architecture, perhaps by offering a default option or limiting the initial menu, can improve both decision quality and user wellbeing. In everyday consumer contexts, however, the relationship between choice and satisfaction appears highly individual: maximisers may be better served by curated selections, while confident satisficers may actually derive pleasure from surveying a broad range of options.

What the research collectively suggests is that choice itself is not intrinsically burdensome or liberating. Its effects are mediated by the cognitive resources, prior knowledge, and motivational orientation of the chooser, as well as the design of the choice environment. The challenge for designers of everything from supermarket shelves to public service websites is to offer sufficient variety to serve diverse needs without triggering the cognitive overload that can paralyse or dissatisfy.`,
    questions: [
      { type: "tfng", statement: "George Miller's 1956 paper suggested the human working memory could hold exactly seven items.", answer: "False" },
      { type: "tfng", statement: "Barry Schwartz published The Paradox of Choice in 2004.", answer: "True" },
      { type: "mcq", question: "What is 'opportunity cost regret' as described in the passage?", options: ["A. Regretting spending money on a product", "B. Feeling worse about a chosen option because rejected alternatives were also attractive", "C. Feeling regret when a product is unavailable", "D. Regretting not saving money instead of buying"], answer: "B" },
      { type: "fill", question: "According to Schwartz, consumers who seek the very best option are called ___.", answer: "maximisers" },
      { type: "tfng", statement: "Schwartz found that maximisers reported higher satisfaction than satisficers.", answer: "False" },
      { type: "fill", question: "In Iyengar and Lepper's study, ___% of shoppers who saw 6 jam varieties made a purchase.", answer: "30" },
      { type: "tfng", statement: "Scheibehenne's 2010 meta-analysis supported the paradox of choice hypothesis without qualification.", answer: "False" },
      { type: "mcq", question: "According to the passage, in which domains is there the strongest evidence for simplifying choice?", options: ["A. Supermarket shopping and fashion", "B. High-stakes unfamiliar domains like health insurance", "C. Everyday familiar products", "D. Online entertainment platforms"], answer: "B" },
      { type: "mcq", question: "The passage concludes that the effects of choice are:", options: ["A. Always negative for consumer wellbeing", "B. Always positive when choice is maximised", "C. Mediated by cognitive resources, prior knowledge, and choice environment design", "D. Irrelevant to consumer satisfaction"], answer: "C" },
      { type: "fill", question: "Confident ___ may derive pleasure from surveying a broad range of options.", answer: "satisficers" },
      { type: "match", statement: "The meta-analysis found the overall effect of choice overload was essentially ___.", answer: "zero" },
      { type: "tfng", statement: "The passage argues that choice is always burdensome for consumers.", answer: "False" },
      { type: "match", statement: "The author suggests the challenge for designers is to offer sufficient variety without triggering cognitive ___.", answer: "overload" },
    ] as ReadingQuestion[],
  },
];

const WRITING_TASK1_PROMPT = `The bar chart below describes the percentage of total energy production from renewable sources in five countries (Brazil, Germany, Iceland, Norway, and the United Kingdom) in 2010 and 2022.

[BAR CHART DESCRIPTION]
• Iceland: 2010 – 82%, 2022 – 89%
• Norway: 2010 – 97%, 2022 – 98%
• Brazil: 2010 – 44%, 2022 – 51%
• Germany: 2010 – 17%, 2022 – 46%
• United Kingdom: 2010 – 8%, 2022 – 41%

Summarise the information by selecting and reporting the main features, and make comparisons where relevant.
Write at least 150 words.`;

const WRITING_TASK2_PROMPT = `Some people believe that universities should focus primarily on providing academic knowledge and theoretical understanding, while others argue that developing practical and vocational skills is more important. Discuss both views and give your own opinion.

Write at least 250 words.`;

const SPEAKING_PART1_QUESTIONS = [
  "Do you live in a house or an apartment?",
  "What do you enjoy most about where you live?",
  "Do you prefer to study in the morning or the evening?",
  "What kind of music do you listen to?",
  "Do you enjoy cooking?",
];

const SPEAKING_PART2_CUE = {
  topic: "Describe a time when you helped someone.",
  points: [
    "Who you helped",
    "What the situation was",
    "How you helped them",
    "Explain why you felt it was important to help",
  ],
};

const SPEAKING_PART3_QUESTIONS = [
  "Do you think people today are less willing to help strangers than in the past?",
  "What role should governments play in encouraging volunteering?",
  "How can communities be designed to encourage cooperation?",
  "Do you think social media has made people more or less socially connected?",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useCountdown(initialSeconds: number, running: boolean, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, onExpire]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return { seconds, formatted: `${mm}:${ss}` };
}

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav({ stage }: { stage: Stage }) {
  const stages: Stage[] = ["section_select", "landing", "instructions", "listening", "reading", "writing", "speaking", "submitting", "results"];
  const activeIdx = stages.indexOf(stage);
  const progressPct = Math.round((activeIdx / (stages.length - 1)) * 100);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-8 py-0">
        <Link href="/english-test-lab" className="flex items-center gap-3 py-4 flex-shrink-0">
          <EduvianLogoMark size={36} />
          <div>
            <span className="font-extrabold text-base text-white">IELTS Academic-Style</span>
            <p className="text-[10px] text-sky-300 leading-none">Mock Test 1 · eduvianAI</p>
          </div>
        </Link>
        {stage !== "landing" && stage !== "section_select" && stage !== "results" && (
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            {["Listening", "Reading", "Writing", "Speaking"].map((s, i) => (
              <span key={s} className={`flex items-center gap-1 ${activeIdx >= i + 3 ? "text-sky-300 font-bold" : ""}`}>
                {activeIdx > i + 3 && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                {s}
              </span>
            ))}
          </div>
        )}
        <Link href="/english-test-lab" className="text-slate-400 hover:text-white text-sm transition-colors py-4">
          ← Back to Lab
        </Link>
      </div>
      {stage !== "landing" && stage !== "section_select" && stage !== "results" && (
        <div className="h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </nav>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IELTSPage() {
  const [stage, setStage] = useState<Stage>("section_select");
  const [selectedMode, setSelectedMode] = useState<"full" | "listening" | "reading" | "writing" | "speaking">("full");

  // Listening state
  const [currentPart, setCurrentPart] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [listeningTimerRunning, setListeningTimerRunning] = useState(false);

  // Reading state
  const [currentPassage, setCurrentPassage] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingTimerRunning, setReadingTimerRunning] = useState(false);

  // Writing state
  const [task1Text, setTask1Text] = useState("");
  const [task2Text, setTask2Text] = useState("");
  const [writingTimerRunning, setWritingTimerRunning] = useState(false);

  // Speaking state
  const [speakingPart, setSpeakingPart] = useState<1 | 2 | 3>(1);
  const [part1Idx, setPart1Idx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speakingTranscripts, setSpeakingTranscripts] = useState<Record<string, string>>({});
  const [prepCountdown, setPrepCountdown] = useState(60);
  const [prepRunning, setPrepRunning] = useState(false);
  const [speakingTimerRunning, setSpeakingTimerRunning] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionShim | null>(null);

  // Results state
  const [scores, setScores] = useState<Record<string, SectionScore>>({});
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState(false);

  // Stage routing helper — determines what comes after each section based on selectedMode
  const getNextStageAfter = useCallback((currentStage: Stage): Stage => {
    if (selectedMode === "full") {
      const order: Stage[] = ["listening", "reading", "writing", "speaking", "submitting"];
      const idx = order.indexOf(currentStage);
      return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : "submitting";
    }
    return "submitting";
  }, [selectedMode]);

  // Timer callbacks
  const handleListeningExpire = useCallback(() => setStage(getNextStageAfter("listening")), [getNextStageAfter]);
  const handleReadingExpire = useCallback(() => setStage(getNextStageAfter("reading")), [getNextStageAfter]);
  const handleWritingExpire = useCallback(() => setStage(getNextStageAfter("writing")), [getNextStageAfter]);
  const handleSpeakingExpire = useCallback(() => setStage("submitting"), []);

  const listeningTimer = useCountdown(30 * 60, listeningTimerRunning, handleListeningExpire);
  const readingTimer = useCountdown(60 * 60, readingTimerRunning, handleReadingExpire);
  const writingTimer = useCountdown(60 * 60, writingTimerRunning, handleWritingExpire);
  const speakingTimer = useCountdown(14 * 60, speakingTimerRunning, handleSpeakingExpire);

  // Auto-submit when reaching submitting stage
  useEffect(() => {
    if (stage === "submitting") {
      handleSubmit();
    }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Text-to-speech playback
  const playTranscript = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utter);
  }, []);

  const stopPlayback = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  }, []);

  // Speech recognition
  const startRecording = useCallback((key: string) => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor | undefined;
    if (!SR) { alert("Speech recognition is not supported in this browser. Try Chrome."); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let final = "";
    rec.onresult = (e: SpeechRecognitionEventShim) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " ";
        else interim = t;
      }
      setSpeakingTranscripts((prev) => ({ ...prev, [key]: final + interim }));
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // Scoring
  async function scoreSection(section: string, taskType: string, prompt: string, response: string) {
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "IELTS", section, taskType, prompt, response }),
      });
      if (!res.ok) throw new Error("Scoring failed");
      return await res.json();
    } catch {
      return null;
    }
  }

  async function handleSubmit() {
    setIsScoring(true);
    setScoringError(false);

    const newScores: Record<string, SectionScore> = {};

    // Calculate listening score
    if (selectedMode === "full" || selectedMode === "listening") {
      let listeningCorrect = 0;
      let listeningTotal = 0;
      LISTENING_PARTS.forEach((part, pi) => {
        part.questions.forEach((q, qi) => {
          listeningTotal++;
          const key = `L${pi}-${qi}`;
          const ans = listeningAnswers[key]?.trim().toLowerCase() ?? "";
          const correct = q.answer.toLowerCase();
          if (ans === correct || ans.includes(correct) || correct.includes(ans)) listeningCorrect++;
        });
      });
      const listeningBand = Math.min(9, Math.round((listeningCorrect / listeningTotal) * 9 * 2) / 2);
      newScores.listening = { raw: listeningCorrect, total: listeningTotal, band: listeningBand };
    }

    // Calculate reading score
    if (selectedMode === "full" || selectedMode === "reading") {
      let readingCorrect = 0;
      let readingTotal = 0;
      READING_PASSAGES.forEach((passage, pi) => {
        passage.questions.forEach((q, qi) => {
          readingTotal++;
          const key = `R${pi}-${qi}`;
          const ans = readingAnswers[key]?.trim().toLowerCase() ?? "";
          let correct = "";
          if (q.type === "mcq") correct = String((q as MCQQuestion).answer).toLowerCase();
          else if (q.type === "tfng") correct = (q as TFNGQuestion).answer.toLowerCase();
          else if (q.type === "fill") correct = (q as FillQuestion).answer.toLowerCase();
          else if (q.type === "match") correct = (q as MatchQuestion).answer.toLowerCase();
          if (ans === correct || ans.includes(correct) || correct.includes(ans)) readingCorrect++;
        });
      });
      const readingBand = Math.min(9, Math.round((readingCorrect / readingTotal) * 9 * 2) / 2);
      newScores.reading = { raw: readingCorrect, total: readingTotal, band: readingBand };
    }

    // Score writing
    if (selectedMode === "full" || selectedMode === "writing") {
      const w1Result = await scoreSection("Writing", "ielts_writing_task1", WRITING_TASK1_PROMPT, task1Text);
      if (w1Result) {
        newScores.writing_task1 = {
          band: w1Result.score,
          feedback: w1Result.feedback,
          strengths: w1Result.strengths,
          improvements: w1Result.improvements,
          criteria: w1Result.criteria_breakdown,
        };
      } else {
        newScores.writing_task1 = { band: 0, feedback: "Scoring unavailable — please retry.", strengths: [], improvements: [] };
        setScoringError(true);
      }

      const w2Result = await scoreSection("Writing", "ielts_writing_task2", WRITING_TASK2_PROMPT, task2Text);
      if (w2Result) {
        newScores.writing_task2 = {
          band: w2Result.score,
          feedback: w2Result.feedback,
          strengths: w2Result.strengths,
          improvements: w2Result.improvements,
          criteria: w2Result.criteria_breakdown,
        };
      } else {
        newScores.writing_task2 = { band: 0, feedback: "Scoring unavailable — please retry.", strengths: [], improvements: [] };
        setScoringError(true);
      }

      const writingBand = ((newScores.writing_task1.band ?? 0) + (newScores.writing_task2.band ?? 0)) / 2;
      newScores.writing = { band: Math.round(writingBand * 2) / 2 };
    }

    // Score speaking
    if (selectedMode === "full" || selectedMode === "speaking") {
      const allSpeakingText = Object.values(speakingTranscripts).join(" ");
      const speakingResult = await scoreSection("Speaking", "ielts_speaking", "IELTS Speaking test (Parts 1, 2, 3)", allSpeakingText);
      if (speakingResult) {
        newScores.speaking = {
          band: speakingResult.score,
          feedback: speakingResult.feedback,
          strengths: speakingResult.strengths,
          improvements: speakingResult.improvements,
          criteria: speakingResult.criteria_breakdown,
        };
      } else {
        newScores.speaking = { band: 0, feedback: "Scoring unavailable — please retry.", strengths: [], improvements: [] };
        setScoringError(true);
      }
    }

    // Overall band — average only the sections that were taken
    const takenBands = [
      newScores.listening?.band,
      newScores.reading?.band,
      newScores.writing?.band,
      newScores.speaking?.band,
    ].filter((b): b is number => b !== undefined);
    if (takenBands.length > 0) {
      const overall = takenBands.reduce((a, b) => a + b, 0) / takenBands.length;
      newScores.overall = { band: Math.round(overall * 2) / 2 };
    }

    setScores(newScores);
    setIsScoring(false);
    setStage("results");
  }

  // ─── Render stages ──────────────────────────────────────────────────────────

  return (
    <AuthGate stage={3} toolName="IELTS Mock Test" source="ielts-mock">
    <div className="min-h-screen bg-slate-50 font-sans">
      <Nav stage={stage} />
      <div className="pt-16">
        <AnimatePresence mode="wait">
          {stage === "section_select" && (
            <SectionSelectScreen
              key="section_select"
              onSelect={(mode) => { setSelectedMode(mode); setStage("landing"); }}
            />
          )}
          {stage === "landing" && <LandingScreen key="landing" onBegin={() => setStage("instructions")} />}
          {stage === "instructions" && (
            <InstructionsScreen
              key="instructions"
              selectedMode={selectedMode}
              onBegin={() => {
                if (selectedMode === "full" || selectedMode === "listening") {
                  setStage("listening"); setListeningTimerRunning(true);
                } else if (selectedMode === "reading") {
                  setStage("reading"); setReadingTimerRunning(true);
                } else if (selectedMode === "writing") {
                  setStage("writing"); setWritingTimerRunning(true);
                } else if (selectedMode === "speaking") {
                  setStage("speaking"); setSpeakingTimerRunning(true);
                }
              }}
            />
          )}
          {stage === "listening" && (
            <ListeningSection
              key="listening"
              currentPart={currentPart}
              setCurrentPart={setCurrentPart}
              answers={listeningAnswers}
              setAnswers={setListeningAnswers}
              isPlaying={isPlaying}
              onPlay={playTranscript}
              onStop={stopPlayback}
              timer={listeningTimer}
              onComplete={() => {
                setListeningTimerRunning(false);
                const next = getNextStageAfter("listening");
                setStage(next);
                if (next === "reading") setReadingTimerRunning(true);
              }}
            />
          )}
          {stage === "reading" && (
            <ReadingSection
              key="reading"
              currentPassage={currentPassage}
              setCurrentPassage={setCurrentPassage}
              answers={readingAnswers}
              setAnswers={setReadingAnswers}
              timer={readingTimer}
              onComplete={() => {
                setReadingTimerRunning(false);
                const next = getNextStageAfter("reading");
                setStage(next);
                if (next === "writing") setWritingTimerRunning(true);
              }}
            />
          )}
          {stage === "writing" && (
            <WritingSection
              key="writing"
              task1Text={task1Text}
              setTask1Text={setTask1Text}
              task2Text={task2Text}
              setTask2Text={setTask2Text}
              timer={writingTimer}
              onComplete={() => {
                setWritingTimerRunning(false);
                const next = getNextStageAfter("writing");
                setStage(next);
                if (next === "speaking") setSpeakingTimerRunning(true);
              }}
            />
          )}
          {stage === "speaking" && (
            <SpeakingSection
              key="speaking"
              speakingPart={speakingPart}
              setSpeakingPart={setSpeakingPart}
              part1Idx={part1Idx}
              setPart1Idx={setPart1Idx}
              isRecording={isRecording}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              transcripts={speakingTranscripts}
              timer={speakingTimer}
              prepCountdown={prepCountdown}
              setPrepCountdown={setPrepCountdown}
              prepRunning={prepRunning}
              setPrepRunning={setPrepRunning}
              onComplete={() => { setSpeakingTimerRunning(false); setStage("submitting"); }}
            />
          )}
          {stage === "submitting" && <SubmittingScreen key="submitting" />}
          {stage === "results" && !isScoring && (
            <ResultsScreen key="results" scores={scores} scoringError={scoringError} />
          )}
        </AnimatePresence>
      </div>
    </div>
    </AuthGate>
  );
}

// ─── Section Select Screen ────────────────────────────────────────────────────

function SectionSelectScreen({ onSelect }: { onSelect: (mode: "full" | "listening" | "reading" | "writing" | "speaking") => void }) {
  const modes = [
    { id: "full" as const, label: "Full Mock Test", desc: "All 4 sections: Listening + Reading + Writing + Speaking", time: "~2 hr 45 min", recommended: true },
    { id: "listening" as const, label: "Listening Only", desc: "4 parts, 40 questions, computer-generated audio", time: "~30 min", recommended: false },
    { id: "reading" as const, label: "Reading Only", desc: "3 passages, 13 questions each", time: "~60 min", recommended: false },
    { id: "writing" as const, label: "Writing Only", desc: "Task 1 (graph/chart) + Task 2 (essay), AI scored", time: "~60 min", recommended: false },
    { id: "speaking" as const, label: "Speaking Only", desc: "3-part speaking: familiar topics, cue card, discussion", time: "~14 min", recommended: false },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 border border-sky-200 mb-5 text-sm font-bold">
          IELTS Academic-Style Practice
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Choose your practice mode</h1>
        <p className="text-slate-500 text-sm">Take the full mock or practise a specific section.</p>
      </div>

      <div className="space-y-3 mb-8">
        {modes.map((mode) => (
          <button key={mode.id} onClick={() => onSelect(mode.id)}
            className={`w-full text-left rounded-2xl border-2 p-5 hover:shadow-md transition-all group ${mode.recommended ? "border-sky-400 bg-sky-50" : "border-slate-200 bg-white hover:border-sky-300"}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-extrabold text-slate-900 text-sm">{mode.label}</span>
                  {mode.recommended && <span className="text-xs bg-sky-500 text-white px-2 py-0.5 rounded-full font-bold">Recommended</span>}
                </div>
                <p className="text-xs text-slate-500">{mode.desc}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-xs font-semibold text-sky-600">{mode.time}</p>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-colors ml-auto mt-1" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-extrabold text-slate-800 mb-2">How close is this to the real IELTS Academic?</h3>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Same 4-section structure and task types as the public IELTS Academic format</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Writing and Speaking scored on all 4 IELTS band descriptor criteria</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Original content — not copied from official IELTS materials</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Audio is computer-generated (real IELTS uses professional recordings)</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Band scores are AI estimates only, not official IELTS band scores</li>
        </ul>
        <a href="https://www.ielts.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors">
          Visit official IELTS website <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

// ─── Landing Screen ──────────────────────────────────────────────────────────

function LandingScreen({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 border border-sky-200 mb-5 text-sm font-bold">
          <BookOpen className="w-4 h-4" />
          IELTS Academic-Style Practice
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">IELTS Academic-style Mock Test 1</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left mb-6">
          <strong>Important disclaimer:</strong> This is original practice content created by eduvianAI based on publicly available IELTS format information. It is not official IELTS material and is not affiliated with or endorsed by British Council, IDP, or Cambridge Assessment English.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { icon: <Headphones className="w-5 h-5 text-sky-600" />, name: "Listening", time: "30 minutes", note: "4 parts, 40 questions" },
          { icon: <BookOpen className="w-5 h-5 text-blue-600" />, name: "Reading", time: "60 minutes", note: "3 passages, 39 questions" },
          { icon: <PenLine className="w-5 h-5 text-violet-600" />, name: "Writing", time: "60 minutes", note: "Task 1 + Task 2" },
          { icon: <Mic className="w-5 h-5 text-emerald-600" />, name: "Speaking", time: "11–14 minutes", note: "3 parts, browser recording" },
        ].map((s) => (
          <div key={s.name} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">{s.icon}</div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{s.name}</p>
              <p className="text-xs text-slate-500">{s.time}</p>
              <p className="text-xs text-slate-400">{s.note}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBegin}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-sky-500/30 transition-all hover:-translate-y-0.5"
      >
        Begin Mock
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Instructions Screen ──────────────────────────────────────────────────────

function InstructionsScreen({ onBegin, selectedMode }: { onBegin: () => void; selectedMode: "full" | "listening" | "reading" | "writing" | "speaking" }) {
  const sectionLabel: Record<string, string> = {
    full: "Start Listening Section",
    listening: "Start Listening Section",
    reading: "Start Reading Section",
    writing: "Start Writing Section",
    speaking: "Start Speaking Section",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-black text-slate-900 mb-6">Before you begin</h2>
      <div className="space-y-3 mb-8">
        {[
          "Each section has a countdown timer. When it expires, the test auto-advances.",
          "For the Listening section, click 'Play audio' to hear the computer-generated transcript via browser text-to-speech.",
          "For the Speaking section, click the microphone button to record your answer in the browser.",
          "Writing tasks are scored by AI — make sure you've written a complete response before finishing the section.",
          "You can navigate between questions freely within each section.",
          "Answers are saved automatically as you type.",
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3">
            <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700">{tip}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onBegin}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:shadow-xl transition-all"
      >
        {sectionLabel[selectedMode] ?? "Start Test"}
        <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Listening Section ────────────────────────────────────────────────────────

function ListeningSection({ currentPart, setCurrentPart, answers, setAnswers, isPlaying, onPlay, onStop, timer, onComplete }: {
  currentPart: number;
  setCurrentPart: (p: number) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isPlaying: boolean;
  onPlay: (text: string) => void;
  onStop: () => void;
  timer: { formatted: string; seconds: number };
  onComplete: () => void;
}) {
  const part = LISTENING_PARTS[currentPart];
  const isLastPart = currentPart === LISTENING_PARTS.length - 1;
  const allAnswered = part.questions.every((_, qi) => answers[`L${currentPart}-${qi}`]?.trim());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">Listening</span>
          <h2 className="text-xl font-black text-slate-900">Part {currentPart + 1} of 4</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 300 ? "bg-red-100 text-red-700" : "bg-sky-100 text-sky-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      {/* TTS note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Computer-generated audio practice. Real IELTS uses professional recordings.</p>
      </div>

      {/* Context + play */}
      <div className="bg-slate-800 rounded-2xl p-5 mb-6">
        <p className="text-slate-300 text-sm mb-4">{part.context}</p>
        <button
          onClick={() => isPlaying ? onStop() : onPlay(part.transcript)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isPlaying ? "bg-red-500 hover:bg-red-600 text-white" : "bg-sky-500 hover:bg-sky-600 text-white"}`}
        >
          {isPlaying ? <><VolumeX className="w-4 h-4" /> Stop audio</> : <><Volume2 className="w-4 h-4" /> Play audio</>}
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-4 mb-8">
        {part.questions.map((q, qi) => {
          const key = `L${currentPart}-${qi}`;
          return (
            <div key={qi} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">Q{qi + 1}. {q.question}</p>
              {q.type === "mcq" && q.options && (
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt) => (
                    <button key={opt} onClick={() => setAnswers((prev) => ({ ...prev, [key]: opt.charAt(0) }))}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${answers[key] === opt.charAt(0) ? "border-sky-400 bg-sky-50 font-semibold text-sky-800" : "border-slate-200 hover:border-slate-300"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {(q.type === "fill" || q.type === "match") && (
                <input
                  type="text"
                  value={answers[key] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="Type your answer..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400"
                />
              )}
              {q.type === "tf" && (
                <div className="flex gap-2">
                  {["True", "False"].map((v) => (
                    <button key={v} onClick={() => setAnswers((prev) => ({ ...prev, [key]: v }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${answers[key] === v ? "border-sky-400 bg-sky-50 text-sky-800" : "border-slate-200 hover:border-slate-300"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button disabled={currentPart === 0} onClick={() => setCurrentPart(currentPart - 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Previous Part
        </button>
        {isLastPart ? (
          <button onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Submit Listening
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setCurrentPart(currentPart + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Next Part
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Reading Section ──────────────────────────────────────────────────────────

function ReadingSection({ currentPassage, setCurrentPassage, answers, setAnswers, timer, onComplete }: {
  currentPassage: number;
  setCurrentPassage: (p: number) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  timer: { formatted: string; seconds: number };
  onComplete: () => void;
}) {
  const passage = READING_PASSAGES[currentPassage];
  const isLastPassage = currentPassage === READING_PASSAGES.length - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Reading</span>
          <h2 className="text-xl font-black text-slate-900">Passage {currentPassage + 1} of 3</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 600 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Passage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto max-h-[70vh]">
          <h3 className="text-lg font-black text-slate-900 mb-4">{passage.title}</h3>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{passage.text}</div>
        </div>

        {/* Questions */}
        <div className="space-y-3 overflow-y-auto max-h-[70vh]">
          {passage.questions.map((q, qi) => {
            const key = `R${currentPassage}-${qi}`;
            return (
              <div key={qi} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wide">
                  {q.type === "tfng" ? "True / False / Not Given" : q.type === "mcq" ? "Multiple Choice" : q.type === "fill" ? "Complete the sentence" : "Matching"}
                </p>
                <p className="text-sm font-semibold text-slate-800 mb-3">
                  {q.type === "tfng" ? (q as TFNGQuestion).statement : q.type === "mcq" ? (q as MCQQuestion).question : q.type === "fill" ? (q as FillQuestion).question : (q as MatchQuestion).statement}
                </p>

                {q.type === "tfng" && (
                  <div className="flex gap-2">
                    {["True", "False", "Not Given"].map((v) => (
                      <button key={v} onClick={() => setAnswers((prev) => ({ ...prev, [key]: v }))}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${answers[key] === v ? "border-blue-400 bg-blue-50 text-blue-800" : "border-slate-200 hover:border-slate-300"}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                )}
                {q.type === "mcq" && (
                  <div className="space-y-1.5">
                    {(q as MCQQuestion).options.map((opt) => (
                      <button key={opt} onClick={() => setAnswers((prev) => ({ ...prev, [key]: opt.charAt(0) }))}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${answers[key] === opt.charAt(0) ? "border-blue-400 bg-blue-50 font-semibold text-blue-800" : "border-slate-200 hover:border-slate-300"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
                {(q.type === "fill" || q.type === "match") && (
                  <input type="text" value={answers[key] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="Type your answer..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button disabled={currentPassage === 0} onClick={() => setCurrentPassage(currentPassage - 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all">
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        {isLastPassage ? (
          <button onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Submit Reading <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setCurrentPassage(currentPassage + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Next Passage <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Writing Section ──────────────────────────────────────────────────────────

function WritingSection({ task1Text, setTask1Text, task2Text, setTask2Text, timer, onComplete }: {
  task1Text: string;
  setTask1Text: (t: string) => void;
  task2Text: string;
  setTask2Text: (t: string) => void;
  timer: { formatted: string; seconds: number };
  onComplete: () => void;
}) {
  const [activeTask, setActiveTask] = useState<1 | 2>(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Writing</span>
          <h2 className="text-xl font-black text-slate-900">Writing Tasks</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 600 ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {([1, 2] as const).map((t) => (
          <button key={t} onClick={() => setActiveTask(t)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTask === t ? "bg-violet-600 text-white shadow" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            Task {t} {t === 1 ? "(20 min)" : "(40 min)"}
          </button>
        ))}
      </div>

      {activeTask === 1 && (
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">Task 1 — Visual Description</p>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{WRITING_TASK1_PROMPT}</pre>
          </div>
          <textarea
            value={task1Text}
            onChange={(e) => setTask1Text(e.target.value)}
            rows={14}
            placeholder="Write your response here (minimum 150 words)..."
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:border-violet-400 resize-none"
          />
          <div className="flex justify-between text-xs mt-1 text-slate-500">
            <span>Words: <strong className={wordCount(task1Text) >= 150 ? "text-emerald-600" : "text-amber-600"}>{wordCount(task1Text)}</strong> / 150 minimum</span>
          </div>
        </div>
      )}

      {activeTask === 2 && (
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2">Task 2 — Essay</p>
            <p className="text-sm text-slate-700 leading-relaxed">{WRITING_TASK2_PROMPT}</p>
          </div>
          <textarea
            value={task2Text}
            onChange={(e) => setTask2Text(e.target.value)}
            rows={18}
            placeholder="Write your response here (minimum 250 words)..."
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:border-violet-400 resize-none"
          />
          <div className="flex justify-between text-xs mt-1 text-slate-500">
            <span>Words: <strong className={wordCount(task2Text) >= 250 ? "text-emerald-600" : "text-amber-600"}>{wordCount(task2Text)}</strong> / 250 minimum</span>
          </div>
        </div>
      )}

      <button onClick={onComplete}
        className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Submit Writing
        <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Speaking Section ─────────────────────────────────────────────────────────

function SpeakingSection({ speakingPart, setSpeakingPart, part1Idx, setPart1Idx, isRecording, onStartRecord, onStopRecord, transcripts, timer, prepCountdown, setPrepCountdown, prepRunning, setPrepRunning, onComplete }: {
  speakingPart: 1 | 2 | 3;
  setSpeakingPart: (p: 1 | 2 | 3) => void;
  part1Idx: number;
  setPart1Idx: (i: number) => void;
  isRecording: boolean;
  onStartRecord: (key: string) => void;
  onStopRecord: () => void;
  transcripts: Record<string, string>;
  timer: { formatted: string; seconds: number };
  prepCountdown: number;
  setPrepCountdown: (n: number) => void;
  prepRunning: boolean;
  setPrepRunning: (b: boolean) => void;
  onComplete: () => void;
}) {
  const [part3Idx, setPart3Idx] = useState(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Speaking</span>
          <h2 className="text-xl font-black text-slate-900">Part {speakingPart}</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 120 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {([1, 2, 3] as const).map((p) => (
          <button key={p} onClick={() => setSpeakingPart(p)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${speakingPart === p ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
            Part {p}
          </button>
        ))}
      </div>

      {/* Part 1 */}
      {speakingPart === 1 && (
        <div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-emerald-700 mb-2">PART 1 — Introduction & Interview (4-5 minutes)</p>
            <p className="text-sm text-slate-700">Answer questions about familiar topics. Aim for 2-3 natural sentences per answer.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <p className="text-xs text-slate-500 mb-1">Question {part1Idx + 1} of {SPEAKING_PART1_QUESTIONS.length}</p>
            <p className="text-lg font-bold text-slate-900 mb-4">{SPEAKING_PART1_QUESTIONS[part1Idx]}</p>

            <RecordButton
              isRecording={isRecording}
              onStart={() => onStartRecord(`P1-${part1Idx}`)}
              onStop={onStopRecord}
            />

            {transcripts[`P1-${part1Idx}`] && (
              <div className="mt-4 bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Your response:</p>
                <p className="text-sm text-slate-700 italic">{transcripts[`P1-${part1Idx}`]}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button disabled={part1Idx === 0} onClick={() => setPart1Idx(part1Idx - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => part1Idx < SPEAKING_PART1_QUESTIONS.length - 1 ? setPart1Idx(part1Idx + 1) : setSpeakingPart(2)}
              className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">
              {part1Idx < SPEAKING_PART1_QUESTIONS.length - 1 ? "Next Question" : "Go to Part 2"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Part 2 */}
      {speakingPart === 2 && (
        <div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-emerald-700 mb-2">PART 2 — Individual Long Turn (3-4 minutes)</p>
            <p className="text-sm text-slate-700">Read the cue card. You have 1 minute to prepare, then speak for up to 2 minutes.</p>
          </div>
          <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 mb-4">
            <p className="text-base font-bold text-slate-900 mb-3">{SPEAKING_PART2_CUE.topic}</p>
            <p className="text-sm text-slate-500 mb-2">You should say:</p>
            <ul className="space-y-1.5">
              {SPEAKING_PART2_CUE.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500 font-bold">•</span> {pt}
                </li>
              ))}
            </ul>
          </div>

          {!prepRunning && !transcripts["P2"] && (
            <button onClick={() => setPrepRunning(true)}
              className="w-full py-3 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-sm mb-3 hover:bg-amber-200 transition-all">
              Start 1-minute preparation time
            </button>
          )}
          {prepRunning && (
            <PrepCountdown seconds={prepCountdown} setSeconds={setPrepCountdown} onExpire={() => { setPrepRunning(false); }} />
          )}

          <RecordButton isRecording={isRecording} onStart={() => onStartRecord("P2")} onStop={onStopRecord} />

          {transcripts["P2"] && (
            <div className="mt-4 bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-1">Your response:</p>
              <p className="text-sm text-slate-700 italic">{transcripts["P2"]}</p>
            </div>
          )}

          <button onClick={() => setSpeakingPart(3)} className="mt-4 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
            Continue to Part 3 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Part 3 */}
      {speakingPart === 3 && (
        <div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-emerald-700 mb-2">PART 3 — Two-way Discussion (4-5 minutes)</p>
            <p className="text-sm text-slate-700">Discuss abstract topics related to the theme of Part 2.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <p className="text-xs text-slate-500 mb-1">Question {part3Idx + 1} of {SPEAKING_PART3_QUESTIONS.length}</p>
            <p className="text-lg font-bold text-slate-900 mb-4">{SPEAKING_PART3_QUESTIONS[part3Idx]}</p>
            <RecordButton isRecording={isRecording} onStart={() => onStartRecord(`P3-${part3Idx}`)} onStop={onStopRecord} />
            {transcripts[`P3-${part3Idx}`] && (
              <div className="mt-4 bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Your response:</p>
                <p className="text-sm text-slate-700 italic">{transcripts[`P3-${part3Idx}`]}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <button disabled={part3Idx === 0} onClick={() => setPart3Idx(part3Idx - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" /> Prev
            </button>
            {part3Idx < SPEAKING_PART3_QUESTIONS.length - 1 ? (
              <button onClick={() => setPart3Idx(part3Idx + 1)}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={onComplete}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm hover:shadow-lg transition-all">
                Submit Speaking <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function RecordButton({ isRecording, onStart, onStop }: { isRecording: boolean; onStart: () => void; onStop: () => void; }) {
  return (
    <button
      onClick={isRecording ? onStop : onStart}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
    >
      {isRecording ? <><MicOff className="w-4 h-4" /> Stop recording</> : <><Mic className="w-4 h-4" /> Record answer</>}
    </button>
  );
}

function PrepCountdown({ seconds, setSeconds, onExpire }: { seconds: number; setSeconds: (n: number) => void; onExpire: () => void; }) {
  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.max(0, seconds - 1));
      if (seconds <= 1) { clearInterval(id); onExpire(); }
    }, 1000);
    return () => clearInterval(id);
  }, [seconds, setSeconds, onExpire]);

  return (
    <div className="bg-amber-100 border border-amber-200 rounded-xl p-3 mb-3 text-center">
      <p className="text-xs text-amber-700 font-bold">Preparation time</p>
      <p className="text-2xl font-black text-amber-800 font-mono">{seconds}s</p>
    </div>
  );
}

// ─── Submitting Screen ────────────────────────────────────────────────────────

function SubmittingScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
      <h2 className="text-xl font-black text-slate-900">Scoring your test...</h2>
      <p className="text-slate-500 text-sm">AI is evaluating your writing and speaking tasks. This takes a moment.</p>
    </motion.div>
  );
}

// ─── Results Screen ───────────────────────────────────────────────────────────

function ResultsScreen({ scores, scoringError }: { scores: Record<string, SectionScore>; scoringError: boolean }) {
  const sections = [
    { key: "listening", label: "Listening", color: "bg-sky-500", icon: <Headphones className="w-4 h-4" /> },
    { key: "reading", label: "Reading", color: "bg-blue-500", icon: <BookOpen className="w-4 h-4" /> },
    { key: "writing", label: "Writing", color: "bg-violet-500", icon: <PenLine className="w-4 h-4" /> },
    { key: "speaking", label: "Speaking", color: "bg-emerald-500", icon: <Mic className="w-4 h-4" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-100 text-sky-700 border border-sky-200 mb-4 text-sm font-bold">
          <Star className="w-4 h-4" />
          Test Complete
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Your Results</h1>
        <p className="text-slate-500 text-sm">Estimated band score based on your performance across all four sections</p>

        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-2xl shadow-sky-500/40 mt-6 mb-2">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{scores.overall?.band?.toFixed(1) ?? "—"}</p>
            <p className="text-[10px] text-sky-200 font-bold uppercase">Overall</p>
          </div>
        </div>

        {scoringError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Some sections could not be scored by AI. Check individual section feedback.
          </div>
        )}
      </div>

      {/* Section breakdown */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {sections.map((s) => {
          const sc = scores[s.key];
          return (
            <div key={s.key} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center text-white`}>{s.icon}</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{s.label}</p>
                  {sc?.raw !== undefined && <p className="text-xs text-slate-500">{sc.raw}/{sc.total} correct</p>}
                </div>
                <div className="ml-auto text-2xl font-black text-slate-900">{sc?.band?.toFixed(1) ?? "—"}</div>
              </div>

              {/* Band bar */}
              <div className="h-2 bg-slate-100 rounded-full mb-3">
                <div className={`h-2 rounded-full ${s.color} transition-all duration-700`}
                  style={{ width: `${((sc?.band ?? 0) / 9) * 100}%` }} />
              </div>

              {sc?.feedback && <p className="text-xs text-slate-600 mb-2 leading-relaxed">{sc.feedback}</p>}
            </div>
          );
        })}
      </div>

      {/* Time management review */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
        <h3 className="font-extrabold text-slate-900 mb-3 text-sm">⏱ Time management review</h3>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Listening (recommended: 30 min)</span>
            <span className="font-semibold text-sky-600">Practice timing carefully</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Reading (recommended: 60 min)</span>
            <span className="font-semibold text-sky-600">~20 min per passage</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Writing Task 1 (recommended: 20 min)</span>
            <span className="font-semibold text-sky-600">At least 150 words</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Writing Task 2 (recommended: 40 min)</span>
            <span className="font-semibold text-sky-600">At least 250 words</span>
          </div>
        </div>
      </div>

      {/* Recommended next action */}
      {(() => {
        const sectionBands: { label: string; band: number | undefined }[] = [];
        if (scores?.listening?.band !== undefined) sectionBands.push({ label: "Listening", band: scores.listening.band });
        if (scores?.reading?.band !== undefined) sectionBands.push({ label: "Reading", band: scores.reading.band });
        if (scores?.writing?.band !== undefined) sectionBands.push({ label: "Writing", band: scores.writing.band });
        if (scores?.speaking?.band !== undefined) sectionBands.push({ label: "Speaking", band: scores.speaking.band });
        if (sectionBands.length === 0) return null;
        const weakest = sectionBands.reduce((a, b) => (a.band ?? 10) < (b.band ?? 10) ? a : b);
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6">
            <h3 className="font-extrabold text-indigo-900 mb-1 text-sm">Recommended next action</h3>
            <p className="text-sm text-indigo-800">Your weakest section is <strong>{weakest.label}</strong> (Band {weakest.band ?? "N/A"}). Focus your next practice session on {weakest.label.toLowerCase()}-specific tasks, or retake the {weakest.label} section alone using &ldquo;Section Only&rdquo; mode.</p>
          </div>
        );
      })()}

      {/* Writing detail */}
      {(scores.writing_task1 || scores.writing_task2) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-violet-600" />
            <h3 className="font-extrabold text-slate-900">Writing Feedback</h3>
          </div>
          {[
            { key: "writing_task1", label: "Task 1" },
            { key: "writing_task2", label: "Task 2" },
          ].map(({ key, label }) => {
            const sc = scores[key];
            if (!sc) return null;
            return (
              <div key={key} className="mb-5 last:mb-0">
                <p className="font-bold text-slate-800 text-sm mb-2">{label} — Band {sc.band?.toFixed(1) ?? "N/A"}</p>
                {sc.feedback && <p className="text-xs text-slate-600 mb-3">{sc.feedback}</p>}
                {sc.strengths && sc.strengths.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-emerald-700 mb-1">Strengths</p>
                    <ul className="space-y-1">{sc.strengths.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
                  </div>
                )}
                {sc.improvements && sc.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-amber-700 mb-1">Areas to improve</p>
                    <ul className="space-y-1">{sc.improvements.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Speaking detail */}
      {scores.speaking && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900">Speaking Feedback</h3>
          </div>
          {scores.speaking.feedback && <p className="text-sm text-slate-600 mb-3">{scores.speaking.feedback}</p>}
          {scores.speaking.strengths && scores.speaking.strengths.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-bold text-emerald-700 mb-1">Strengths</p>
              <ul className="space-y-1">{scores.speaking.strengths.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
            </div>
          )}
          {scores.speaking.improvements && scores.speaking.improvements.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">Areas to improve</p>
              <ul className="space-y-1">{scores.speaking.improvements.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800">
        <strong>Disclaimer:</strong> These are estimated practice scores only. This is not an official IELTS result. For official scoring, register with British Council, IDP, or Cambridge Assessment English.
      </div>

      {/* CTAs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/english-test-lab/ielts"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-sky-200 text-sky-700 font-bold text-sm hover:bg-sky-50 transition-all">
          <RotateCcw className="w-4 h-4" /> Try this mock again
        </Link>
        <Link href="/get-started"
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-xl transition-all">
          <BarChart2 className="w-4 h-4" /> Check your university shortlist
        </Link>
      </div>
    </motion.div>
  );
}
