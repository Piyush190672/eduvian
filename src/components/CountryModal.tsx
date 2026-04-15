"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface CountryProfile {
  name: string;
  flag: string;
  img: string;
  ecosystem: string;
  institutions: string;
  admission: string;
  quality: string;
  cost: string;
  scholarships: string;
  safety: string;
  studentLife: string;
  jobMarket: string;
}

export const COUNTRY_PROFILES: Record<string, CountryProfile> = {
  USA: {
    name: "USA",
    flag: "🇺🇸",
    img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80",
    ecosystem:
      "The US hosts the world's largest higher education system with over 4,000 accredited institutions. It leads globally in research output, Nobel laureates, and industry-academia collaboration. Both STEM and liberal arts programs are world-class, with strong ties to Silicon Valley, Wall Street, and major industry hubs.",
    institutions:
      "Ivy League universities (Harvard, Yale, Columbia), large public research universities (UCLA, Michigan, UT Austin), liberal arts colleges, community colleges, and specialized institutions. Public universities offer lower tuition to in-state students; private universities are often research-heavy and well-funded.",
    admission:
      "Holistic review process: GPA, SAT/ACT scores, essays, letters of recommendation, extracurriculars, and interviews (for select programs). Deadlines: Early Decision (Nov), Regular Decision (Jan). Graduate admissions require GRE/GMAT, SOP, and transcripts. English proficiency: IELTS 6.5+ or TOEFL 80+.",
    quality:
      "Home to 17 of the top 20 QS-ranked universities globally. Strong emphasis on critical thinking, research, and interdisciplinary learning. Faculty are often industry leaders and active researchers. Accreditation bodies (AACSB, ABET, etc.) ensure program rigor.",
    cost:
      "Tuition: $25,000–$60,000/yr (private); $15,000–$35,000/yr (public, international). Living costs: $12,000–$20,000/yr. NYC, San Francisco, and Boston are expensive; Midwest cities are more affordable. Total annual budget: $35,000–$80,000+.",
    scholarships:
      "Merit scholarships via universities (Fulbright, Presidential Scholarships), RA/TA positions at graduate level, need-based aid from select universities, and private foundations. Fully-funded PhDs are common in STEM — tuition waived + monthly stipend provided.",
    safety:
      "Generally safe on campuses with dedicated campus police and emergency systems. Crime rates vary significantly by city. Healthcare is expensive — mandatory student health insurance is required. International students are advised to research neighborhood safety before choosing off-campus housing.",
    studentLife:
      "Vibrant campus life with clubs, sports, Greek life, and cultural organizations. Co-op and internship opportunities are abundant near tech and finance hubs. Diverse, multicultural campuses with strong Indian student communities across all major cities.",
    jobMarket:
      "One of the world's most competitive and rewarding job markets. Tech (Silicon Valley, Seattle, Austin), finance (NYC, Chicago), healthcare, and consulting are top sectors. OPT allows up to 12 months of work post-graduation — 3 years for STEM graduates (STEM OPT extension). H-1B visa lottery is the primary long-term work pathway; competition is high. CPT during study allows paid internships. Glassdoor average starting salaries for STEM grads: $80,000–$120,000+/yr.",
  },
  UK: {
    name: "UK",
    flag: "🇬🇧",
    img: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800&q=80",
    ecosystem:
      "The UK has one of the most prestigious education systems in the world, regulated by the Quality Assurance Agency (QAA). Undergraduate degrees are typically 3 years and master's are just 1 year — making it cost-efficient in duration. English is the sole medium of instruction.",
    institutions:
      "Russell Group universities (Oxford, Cambridge, Imperial, UCL, LSE) are globally elite. Red brick universities (Birmingham, Leeds, Manchester) are strong research institutions. Post-92 universities are more vocational and accessible. Specialised institutions exist for arts (UAL), music (Royal College), and law.",
    admission:
      "Undergraduate: Apply via UCAS (deadline: Jan 15 for most; Oct 15 for Oxford/Cambridge). Up to 5 choices. Postgraduate: Apply directly; deadlines vary. IELTS 6.0–7.0 typically required. No GRE needed for most PG programs.",
    quality:
      "4 UK universities in the global top 10 (QS 2025). Strong emphasis on independent research and critical thinking. Teaching is seminar and tutorial-based. A First Class Honours (70%+) is highly regarded by employers globally.",
    cost:
      "Tuition: £10,000–£38,000/yr for international students. Living costs: £12,000–£18,000/yr (London) or £8,000–£12,000/yr (other cities). Total: £20,000–£55,000/yr.",
    scholarships:
      "Chevening Scholarships (fully funded, government-backed), Commonwealth Scholarships, GREAT Scholarships, and university-specific merit awards. Many Russell Group universities offer partial scholarships for international students.",
    safety:
      "UK is generally very safe. Robust campus security and student welfare services. NHS healthcare accessible to students paying the Immigration Health Surcharge (included in visa fee). Welcoming culture with strong international student support.",
    studentLife:
      "Rich cultural life with student unions, sports, and societies. Part-time work allowed up to 20 hrs/week during term. Large Indian student communities in London, Manchester, Birmingham, and Nottingham. Excellent city life balanced with academic focus.",
    jobMarket:
      "Strong graduate job market, especially in finance, tech, consulting, law, and healthcare. London is Europe's financial capital and a global tech hub. The Graduate Route Visa (post-study work visa) allows 2 years of unrestricted work after graduation (3 years for PhD holders) — a major draw for international students. Average graduate starting salary: £25,000–£40,000/yr. Skilled Worker Visa is the main long-term pathway; sponsorship required from employer.",
  },
  Australia: {
    name: "Australia",
    flag: "🇦🇺",
    img: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=800&q=80",
    ecosystem:
      "Australia's higher education system is well-funded, globally respected, and student-friendly. The government's TEQSA ensures quality. Australia is the 3rd most popular international student destination globally, known for welcoming immigration policies and strong industry links.",
    institutions:
      "The Group of Eight (Go8) — Melbourne, ANU, Sydney, UNSW, Monash, UQ, UWA, Adelaide — are elite research universities. Other strong institutions include Macquarie, Deakin, RMIT, and Griffith. TAFE institutes offer vocational qualifications. Dual sector universities offer both academic and vocational programs.",
    admission:
      "Apply directly to universities. UG: requires 12th grade equivalent results. PG: bachelor's degree + IELTS 6.5+. Many programs have rolling admissions for February and July intakes. No GRE required for most master's programs.",
    quality:
      "7 Australian universities rank in the global top 100 (QS). Programs in STEM, medicine, business, and environmental sciences are particularly strong. Degrees follow the Australian Qualifications Framework (AQF) ensuring national consistency and employer recognition.",
    cost:
      "Tuition: AUD 20,000–45,000/yr (UG and PG). Living costs: AUD 18,000–25,000/yr (Sydney/Melbourne); AUD 14,000–18,000/yr (Brisbane, Adelaide, Perth). Total: AUD 38,000–70,000/yr (approx. $25,000–$45,000 USD).",
    scholarships:
      "Australia Awards (fully funded, government), Destination Australia scholarships, university merit scholarships (Monash Excellence, Melbourne Graduate), and faculty-specific awards. Many universities offer 10–25% tuition discounts for high-achieving international students.",
    safety:
      "Consistently among the safest countries for international students. Low crime rates, excellent healthcare. OSHC (Overseas Student Health Cover) is mandatory. Universities have 24/7 student support. Natural hazards like bushfires are well-managed with strong emergency systems.",
    studentLife:
      "Relaxed, outdoor-oriented lifestyle with strong work-life balance. Students can work up to 48 hrs per fortnight during study and unlimited hours during holidays. Large Indian communities in Melbourne, Sydney, and Brisbane. Excellent quality of life with year-round sunshine in most cities.",
    jobMarket:
      "Strong demand for skilled professionals in healthcare, engineering, IT, education, and construction — sectors with chronic shortages. Post-Study Work Visa: 2–4 years depending on qualification level and study location (regional study attracts longer visas). Temporary Skill Shortage (TSS) visa and General Skilled Migration (GSM) pathways offer realistic routes to PR. Average graduate starting salary: AUD 55,000–75,000/yr. Australia's skills shortage lists (MLTSSL, STSOL) heavily favour STEM, healthcare, and trades graduates.",
  },
  Canada: {
    name: "Canada",
    flag: "🇨🇦",
    img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80",
    ecosystem:
      "Canada is one of the top destinations for international students, known for inclusive immigration pathways, high quality of life, and bilingual culture. Education is provincially regulated with strong federal investment in research. Canada is increasingly preferred for its post-study PR pathways.",
    institutions:
      "U15 research universities (Toronto, UBC, McGill, Waterloo, Alberta) are globally ranked. Colleges (Seneca, Humber, Conestoga, George Brown) offer applied and vocational diplomas. Universities in Quebec often teach in French. Co-op programs are widely available across disciplines.",
    admission:
      "Apply directly to universities. UG: requires 12th grade equivalent. PG: bachelor's degree + IELTS 6.5+ or TOEFL 90+. GRE/GMAT not always required. Main intake: September (applications open Oct–Nov). January intake also available at many institutions.",
    quality:
      "3 Canadian universities in the QS top 50. Strong emphasis on applied research and co-op education. Waterloo's co-op program is among the world's best. Engineering, CS, business, and health sciences are standout fields.",
    cost:
      "Tuition: CAD 20,000–40,000/yr for international students. College diplomas: CAD 12,000–18,000/yr. Living costs: CAD 12,000–18,000/yr (Toronto/Vancouver); CAD 10,000–14,000/yr (smaller cities). Total: CAD 30,000–58,000/yr (approx. $22,000–$43,000 USD).",
    scholarships:
      "Vanier Canada Graduate Scholarships (PhD), Banting Postdoctoral Fellowships, university merit awards (UBC International Major Entrance Scholarship, UofT International Scholar Award), and provincial scholarships. Co-op paid placements significantly offset living costs.",
    safety:
      "Canada ranks consistently in the top 10 safest countries globally. Universal healthcare available to some international students after a waiting period — provincial health insurance is recommended. Campus security is robust and anti-discrimination laws are strictly enforced.",
    studentLife:
      "Multicultural, inclusive, and welcoming. Students can work 20 hrs/week during term and full-time during breaks. PGWP (Post-Graduation Work Permit) up to 3 years. Large South Asian communities across GTA, Metro Vancouver, and Calgary. Excellent public services and outdoor lifestyle.",
    jobMarket:
      "One of the most immigration-friendly job markets globally. Strong demand in IT, engineering, healthcare, finance, and skilled trades. PGWP allows up to 3 years of open work authorization post-graduation. Express Entry (CRS score-based) and Provincial Nominee Programs (PNPs) provide realistic PR pathways — especially for STEM and healthcare graduates. Average starting salary: CAD 50,000–75,000/yr. Canadian work experience significantly boosts PR points under CRS.",
  },
  Germany: {
    name: "Germany",
    flag: "🇩🇪",
    img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80",
    ecosystem:
      "Germany offers one of the most cost-effective quality education systems in the world. Public universities charge no or minimal tuition — even for international students. Germany is Europe's largest economy and a global hub for engineering, automotive, and manufacturing industries.",
    institutions:
      "Technical Universities (TU Munich, RWTH Aachen, TU Berlin) are world-class in engineering and sciences. LMU Munich and Heidelberg excel in humanities and medicine. Fachhochschulen (Universities of Applied Sciences) are practice-oriented with strong industry ties. Most programs at public universities are tuition-free.",
    admission:
      "Apply via uni-assist or directly. German-taught programs require B2/C1 German proficiency. English-taught master's programs require IELTS 6.5+/TOEFL 90+. APS certificate required for Indian students. UG deadlines: Jan 15 (summer) / Jul 15 (winter). PG deadlines vary by program.",
    quality:
      "6 universities in the QS top 100. Strong emphasis on research, innovation, and practical training. The dual education system integrates workplace training. German engineering and science degrees are globally respected by employers.",
    cost:
      "Public universities: €0–€1,500/yr (semester fees ~€300 include a transit pass). Private universities: €10,000–€20,000/yr. Living costs: €8,000–€12,000/yr. Total: €10,000–€14,000/yr at public universities — among the most affordable globally.",
    scholarships:
      "DAAD (German Academic Exchange Service) scholarships are widely available for international students. Deutschlandstipendium covers €300/month. Foundations like Heinrich Böll and Friedrich Ebert offer need/merit-based support. Many universities offer internal stipends for research assistants.",
    safety:
      "Among Europe's safest countries. Low crime rates and efficient emergency services. Mandatory health insurance for students (~€110/month via public insurance). Well-regulated tenant rights protect student renters. Excellent public transport nationwide.",
    studentLife:
      "Rich cultural scene, excellent public transport, and strong work-life balance culture. Students can work 120 full days or 240 half days per year. Free semester transit passes in most states. Growing English-friendly environment in Munich, Berlin, and Stuttgart. Active Indian student communities in engineering-heavy cities.",
    jobMarket:
      "Europe's strongest manufacturing and engineering job market. Chronic shortage of skilled engineers, IT professionals, and scientists. The Job Seeker Visa (18 months post-graduation) allows graduates to stay and search for work. Opportunity Card (Chancenkarte) introduced in 2024 eases skilled migration. Average starting salary: €40,000–€60,000/yr. German language skills (B2+) are a major advantage for job placement, though many multinational firms operate in English. Strong demand in automotive (BMW, Mercedes, Volkswagen), pharma (Bayer, BASF), and tech (SAP, Siemens).",
  },
  Singapore: {
    name: "Singapore",
    flag: "🇸🇬",
    img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
    ecosystem:
      "Singapore is Asia's premier education hub with two top-15 globally ranked universities. It serves as a gateway to Asia-Pacific business and finance and is known for world-class infrastructure, safety, and quality of life. English is the universal medium of instruction.",
    institutions:
      "National University of Singapore (NUS, #8 globally), Nanyang Technological University (NTU, #15), Singapore Management University (SMU) for business, and SUTD for technology and design. International branch campuses include INSEAD, SP Jain, and James Cook Singapore.",
    admission:
      "Apply directly. UG: A-Levels or equivalent + IELTS 6.0+. PG: bachelor's with strong GPA + IELTS 6.5+ + GRE/GMAT for some programs. Competition for NUS and NTU is intense. Applications typically open October–January for August intake.",
    quality:
      "NUS and NTU consistently rank in the world's top 15. Strong in finance, tech, biomedical sciences, and engineering. Graduates are highly employable globally. Heavy investment in research, innovation, and entrepreneurship programs.",
    cost:
      "Tuition: SGD 16,000–45,000/yr for international students. Government tuition grants available but require a 3-year Singapore work bond post-graduation. Living costs: SGD 10,000–15,000/yr. Total: SGD 26,000–60,000/yr (approx. $19,000–$44,000 USD).",
    scholarships:
      "ASEAN Scholarships, Singapore Government Scholarships (MOE), university merit scholarships (NUS and NTU Research Scholarships), and A*STAR research fellowships. Many scholarships include tuition, stipend, and accommodation — highly competitive.",
    safety:
      "Consistently ranked the safest city in Asia and one of the safest globally. Extremely low crime rates. Strict laws govern public behaviour. Excellent public healthcare. Mandatory student health insurance. World-class emergency services.",
    studentLife:
      "Cosmopolitan, fast-paced, and incredibly diverse. English is universal. Excellent food, transport, and connectivity. Students can work up to 16 hrs/week during term. Strategic location for travel across Southeast Asia. Smaller student population means stronger faculty relationships.",
    jobMarket:
      "Asia-Pacific's premier financial and tech hub. Major employers: banks (DBS, UOB, OCBC, Citi, Goldman Sachs), tech firms (Google, Meta, Grab, Sea), pharma, and logistics. Employment Pass (EP) is required for professional-level work; minimum salary thresholds apply. The Tuition Grant work bond (3 years) effectively locks graduates into the Singapore market — beneficial for career starters. Average graduate salary: SGD 4,000–6,500/month. Competitive job market due to small size; networking and internships during study are critical.",
  },
  "New Zealand": {
    name: "New Zealand",
    flag: "🇳🇿",
    img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80",
    ecosystem:
      "New Zealand offers high-quality, research-oriented education in one of the world's most scenic and peaceful environments. It follows the British academic tradition. The government actively welcomes international students with straightforward visa processes and post-study work rights.",
    institutions:
      "Eight publicly-funded universities: University of Auckland, Victoria University Wellington, Otago, Canterbury, Massey, Lincoln, Waikato, and AUT. Institutes of Technology and Polytechnics (ITPs) offer vocational programs. Universities are research-focused with smaller, more intimate class sizes than larger countries.",
    admission:
      "Apply directly. UG: 12th grade equivalent + IELTS 6.0+. PG: relevant bachelor's + IELTS 6.5+. Rolling admissions for February and July intakes. No GRE required for most programs. Applications are straightforward with fast decisions.",
    quality:
      "3 NZ universities in the QS top 200. Strong in agriculture, environmental science, marine biology, engineering, and business. Creative arts and film studies are world-class (Weta Workshop connections). Small class sizes ensure personalised learning.",
    cost:
      "Tuition: NZD 22,000–35,000/yr for most programs. Living costs: NZD 15,000–20,000/yr (Auckland is most expensive). Total: NZD 37,000–55,000/yr (approx. $22,000–$33,000 USD).",
    scholarships:
      "New Zealand Excellence Awards (NZEA), university merit scholarships (University of Auckland International Student Excellence Scholarship), New Zealand Aid Programme, and faculty-specific research grants.",
    safety:
      "One of the safest countries globally — low crime, welcoming society, excellent healthcare. ACC covers accident treatment for everyone in NZ. Student health insurance mandatory. Earthquake preparedness is well-managed, particularly in Wellington and Christchurch.",
    studentLife:
      "Relaxed, outdoorsy lifestyle with strong work-life balance. Students can work 20 hrs/week during term and full-time during holidays. Smaller, tight-knit communities with good faculty access. Growing Indian community, especially in Auckland.",
    jobMarket:
      "Acute skills shortages in healthcare, engineering, construction, IT, and agriculture — government actively recruits internationally. Post-Study Work Visa: up to 3 years for degree graduates, enabling solid work experience. Skilled Migrant Category Resident Visa offers a PR pathway based on a points system. Average graduate salary: NZD 55,000–75,000/yr. Smaller economy than Australia means fewer opportunities in competitive sectors, but demand in essential services is consistently high. Regional areas offer additional immigration incentives.",
  },
  Ireland: {
    name: "Ireland",
    flag: "🇮🇪",
    img: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80",
    ecosystem:
      "Ireland is the only English-speaking EU country, making it uniquely attractive post-Brexit. It is the European base for major tech companies (Google, Meta, Apple, LinkedIn) and pharma giants — offering outstanding graduate employment prospects. Irish universities are internationally respected.",
    institutions:
      "Trinity College Dublin (TCD) and University College Dublin (UCD) are flagship universities. NUI campuses (Galway, Cork, Maynooth), Dublin City University, and University of Limerick are strong research institutions. Technological Universities offer applied degrees. Institutes of Technology provide vocational routes.",
    admission:
      "Apply via CAO (Irish students) or directly to universities (international students). IELTS 6.0–6.5 required. PG deadlines: January–May for September intake. No GMAT/GRE required for most programs. Statement of purpose and academic record are key.",
    quality:
      "TCD and UCD rank in the QS top 150. Strong in pharma, biotech, computer science, finance, and literature. Internationally accredited programs. Ireland's 'Smart Economy' policy has driven significant investment in STEM and innovation education.",
    cost:
      "Tuition: €10,000–€25,000/yr for international students. Living costs: €10,000–€15,000/yr (Dublin) or €8,000–€12,000/yr (Cork, Galway). Dublin is one of Europe's most expensive cities. Total: €20,000–€40,000/yr.",
    scholarships:
      "Government of Ireland International Education Scholarships (fully funded, 60 awards/yr), IRC postgraduate scholarships, Enterprise Ireland innovation partnerships, and university merit awards. Big tech companies also fund scholarships at Dublin-based universities.",
    safety:
      "Very safe with low violent crime rates. Consistently ranked one of the friendliest countries for international students. Subsidised healthcare via private insurance schemes. University welfare services are strong. Rainy, mild climate — worth preparing for.",
    studentLife:
      "Lively pub culture, music scene, and sports. Part-time work: 20 hrs/week during term, 40 hrs/week during holidays. Strong sense of community in both Dublin and smaller university towns. Growing Indian and South Asian student communities.",
    jobMarket:
      "Ireland punches far above its weight as a job market. Dublin is Europe's Silicon Valley — home to EMEA HQs of Google, Meta, Apple, Microsoft, Salesforce, LinkedIn, and Pfizer. Demand is particularly strong in tech, pharma, finance, and data analytics. Stamp 1G Graduate Visa allows 2 years of unrestricted job search and work post-graduation. Critical Skills Employment Permit (CSEP) fast-tracks residency for roles in STEM, healthcare, and finance. Average graduate salary: €35,000–€55,000/yr. EU access is a key advantage — graduates can pursue opportunities across all 27 EU member states.",
  },
  France: {
    name: "France",
    flag: "🇫🇷",
    img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
    ecosystem:
      "France has one of Europe's oldest and most prestigious education traditions, differentiating between public universities (research-focused) and Grandes Écoles (elite, selective institutions for engineering and business). The government heavily subsidizes higher education, keeping costs remarkably low.",
    institutions:
      "Grandes Écoles (HEC Paris, École Polytechnique, Sciences Po, CentraleSupélec) are globally elite for business and engineering. Public universities (Paris-Saclay, Sorbonne, PSL) are strong in research. Many master's programs are now taught in English to attract international students.",
    admission:
      "UG: Apply via Campus France process — includes an interview and document verification. Requires 12th grade + basic French (B1+). PG: Apply directly; English-taught programs require IELTS 6.5+. Campus France processes applications for most countries including India. Deadlines: December–March.",
    quality:
      "Paris-Saclay ranks #15 globally; PSL University #24 (QS 2025). France leads in mathematics, engineering, fashion, culinary arts, and political science. Grandes Écoles produce a disproportionate share of CEOs, politicians, and Nobel laureates globally.",
    cost:
      "Public universities: €2,770–€3,770/yr for non-EU international students (very affordable). Grandes Écoles: €10,000–€30,000/yr. Living costs: €10,000–€15,000/yr (Paris) or €7,000–€10,000/yr (Lyon, Bordeaux, Toulouse). Total: €10,000–€45,000/yr depending on institution.",
    scholarships:
      "Eiffel Excellence Scholarship Programme (French Government — fully funded), Campus France bilateral scholarships, university-specific grants (HEC Paris Merit Scholarship), Erasmus+ for eligible exchanges, and regional council grants. French language proficiency strengthens scholarship applications.",
    safety:
      "Generally safe, though urban areas require standard city precautions. Terror threat awareness is proactively managed. French healthcare (Sécurité Sociale Étudiante) is heavily subsidised — among the best globally. CROUS student housing offers affordable, regulated accommodation.",
    studentLife:
      "Exceptional quality of life — food, fashion, culture, and history. Even basic French dramatically improves integration. Students can work up to 964 hours/year. Internships (stages) are mandatory in most programs, providing excellent industry exposure and networking.",
    jobMarket:
      "France's job market rewards graduates from Grandes Écoles highly — a degree from HEC, Polytechnique, or Sciences Po is a near-guaranteed fast track. For international graduates, the Recherche d'Emploi / Création d'Entreprise (RCE) permit allows 12 months post-study job search or business creation. Demand is strong in luxury goods, aerospace (Airbus), automotive, energy (TotalEnergies), finance, and tech. French language proficiency (B2+) is essential for most corporate roles. Average salary: €30,000–€50,000/yr starting. Paris is home to major global HQs and a growing startup ecosystem (Station F is the world's largest startup campus).",
  },
  UAE: {
    name: "UAE",
    flag: "🇦🇪",
    img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    ecosystem:
      "The UAE has rapidly developed into a regional education hub, attracting branch campuses of global universities. Dubai and Abu Dhabi are tax-free, cosmopolitan cities with thriving economies. The UAE is particularly attractive for students seeking Gulf employment and a gateway to the wider MENA region.",
    institutions:
      "NYU Abu Dhabi, Sorbonne Abu Dhabi, and Heriot-Watt Dubai are notable international branch campuses. Local institutions include University of Sharjah, American University of Sharjah, Khalifa University, and Zayed University. Knowledge Village and Dubai International Academic City host dozens of university branches.",
    admission:
      "Apply directly to universities or branch campuses. Requirements mirror the parent institution. IELTS 6.0–6.5+ typically required. SAT useful for US-curriculum institutions. Admission is generally less competitive than the parent campus but academic standards are maintained.",
    quality:
      "NYU Abu Dhabi and Khalifa University rank in the QS top 300. Quality varies by institution — branch campuses replicate parent curricula with the same degrees. Strong in business, engineering, hospitality, and media. MoE accreditation ensures quality standards for local institutions.",
    cost:
      "Tuition: AED 40,000–120,000/yr ($11,000–$33,000 USD) depending on university and program. Living costs: AED 30,000–50,000/yr ($8,000–$14,000 USD). Dubai is expensive but tax-free. University residences are more affordable. Total: $19,000–$47,000/yr.",
    scholarships:
      "NYU Abu Dhabi offers highly competitive full scholarships. UAE government scholarships via ADEC, merit-based awards from AUS and Khalifa University, and corporate-sponsored scholarships from Gulf entities (Mubadala, ADNOC, DP World).",
    safety:
      "One of the safest countries globally — extremely low crime, strong law enforcement, and modern infrastructure. Cultural norms must be respected. Excellent healthcare. Student health insurance is typically required and widely available.",
    studentLife:
      "Luxurious, cosmopolitan, and fast-paced. English is widely spoken everywhere. Massive Indian diaspora — one of the most comfortable destinations for Indian students. Great networking in finance, real estate, hospitality, and tech. Warm weather year-round.",
    jobMarket:
      "Thriving, tax-free job market with no income tax — salaries are highly attractive. Key sectors: finance and banking (DIFC), real estate, hospitality (Emaar, Jumeirah), logistics (DP World), aviation (Emirates, Etihad), and energy (ADNOC). Strong demand for business, engineering, IT, and hospitality graduates. Employment visa sponsored by employer; no independent work visa post-study. UAE Golden Visa available for outstanding graduates and talented professionals. Average graduate salary: AED 8,000–15,000/month ($2,200–$4,100 USD) — tax-free. Limited PR pathway but long-term residency via Golden Visa is accessible.",
  },
  Netherlands: {
    name: "Netherlands",
    flag: "🇳🇱",
    img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
    ecosystem:
      "The Netherlands is one of Europe's most international higher-education destinations, with over 2,100 English-taught degree programs — the highest number outside the UK. Dutch universities combine research excellence with a practical, project-based learning culture. The country sits at the heart of Europe's logistics, tech, and agri-food industries, giving students outstanding industry access.",
    institutions:
      "University of Amsterdam (UvA, QS #55) and Vrije Universiteit Amsterdam (VU, QS #219) are the flagship research universities. TU Delft, Eindhoven (TU/e), and Wageningen (WUR) are world-class in engineering and life sciences. Leiden, Utrecht, and Groningen round out the research-intensive universities. Universities of Applied Sciences (HBO) offer more vocational, industry-oriented bachelor's and master's degrees.",
    admission:
      "Apply directly to universities via Studielink (Dutch portal) or university websites. Requirements: bachelor's degree, IELTS 6.5+ (some programs require 7.0), and a motivation letter. No GRE/GMAT required for most programs. Application deadlines: February 1 (April 1 for non-EEA) for September intake. Some programs have limited seats — apply early.",
    quality:
      "13 Dutch universities rank in the QS World Top 500, with UvA in the top 60. The Netherlands pioneered Problem-Based Learning (PBL). Strong research output in water management, agriculture, AI, and social sciences. Degrees are internationally accredited by NVAO.",
    cost:
      "Tuition: €8,000–€20,000/yr for non-EU international students (varies by university and program). Living costs: €10,000–€14,000/yr in Amsterdam; €8,000–€11,000/yr in smaller cities like Groningen or Maastricht. Total: €18,000–€34,000/yr — more affordable than UK for comparable quality.",
    scholarships:
      "Holland Scholarship (€5,000 one-time, government-backed), Orange Knowledge Programme (fully funded for select nationalities), university merit awards (VU Amsterdam Fellowship, UvA Excellence Scholarship), and Erasmus+ grants. Many Dutch universities offer early-bird discounts of €1,000–€3,000.",
    safety:
      "Consistently ranked among the world's safest countries. Excellent public transport, bike-friendly cities, and high quality of life. Universal healthcare available to registered residents — student insurance required. OSHC equivalent policies are widely available at low cost.",
    studentLife:
      "Highly international and English-friendly — over 35% of students in major cities are international. Amsterdam, Rotterdam, and Eindhoven offer vibrant cultural scenes. Cycling culture is universal. Students can work 16 hrs/week during study. Large, welcoming Indian student community especially in Amsterdam and Eindhoven.",
    jobMarket:
      "The Netherlands is Europe's gateway — home to Shell, Philips, ASML, Booking.com, Heineken, Unilever, and ING. Amsterdam hosts the EMEA HQs of Uber, Netflix, and TomTom. Strong demand in tech, engineering, finance, logistics, and agri-food. The Orientation Year Permit (Zoekjaar) allows 12 months post-graduation to search for work — eligible graduates can transition to a Highly Skilled Migrant permit. Average starting salary: €35,000–€50,000/yr. Dutch language skills help for permanent roles but many companies operate fully in English.",
  },
  Malaysia: {
    name: "Malaysia",
    flag: "🇲🇾",
    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80",
    ecosystem:
      "Malaysia is one of the most affordable quality education destinations in Asia, actively positioning itself as a regional hub. It hosts branch campuses of UK, Australian, and US universities, allowing students to earn internationally recognised degrees at a fraction of the cost.",
    institutions:
      "Monash Malaysia, University of Nottingham Malaysia, Heriot-Watt Malaysia, and UCSI offer international branch campus programs. Local institutions include University of Malaya (UM), Universiti Putra Malaysia (UPM), and Taylor's University. Twinning programs allow study split between Malaysia and the parent campus.",
    admission:
      "Apply directly. UG: SPM/12th grade equivalent + IELTS 5.5–6.0. PG: bachelor's degree + IELTS 6.0+. Admission is generally more accessible than studying in Australia/UK directly. Rolling intakes (January, March, July, October) at many institutions.",
    quality:
      "University of Malaya ranks in the QS top 70 in Asia. Branch campuses offer the same curriculum and degrees as their parent universities. MQA (Malaysian Qualifications Agency) accreditation ensures quality standards across all institutions.",
    cost:
      "Tuition: MYR 30,000–80,000/yr ($6,500–$18,000 USD). Local public universities: MYR 10,000–20,000/yr for internationals. Living costs: MYR 12,000–18,000/yr ($2,600–$4,000 USD). Total: $9,000–$22,000/yr — among the most affordable globally.",
    scholarships:
      "Malaysian Government scholarships via MoHE for select bilateral agreements, university merit awards (Monash Malaysia Vice-Chancellor's Scholarship), twinning program discounts, and faculty-specific grants. Tuition is already low, reducing scholarship dependency.",
    safety:
      "Generally safe with a low violent crime rate. Petty crime exists in urban areas. Healthcare is good and affordable. Student visa includes access to public hospitals at subsidised rates. Emergency services are reliable. Cultural diversity is celebrated.",
    studentLife:
      "Multicultural, tropical, and highly affordable. English is widely spoken. Great food culture and ease of life for Indian students — large Tamil and Indian communities in KL and Penang. Affordable travel across Southeast Asia. Students may work part-time with work permit approval.",
    jobMarket:
      "Growing economy with demand in manufacturing, finance, IT, engineering, and oil & gas. Kuala Lumpur is a regional business hub with presence of major MNCs. Graduates from branch campuses (Monash, Nottingham) are well-regarded by regional employers. Employment Pass required for professional work; sponsored by employer. Average graduate salary: MYR 3,000–5,000/month ($650–$1,100 USD) — significantly lower than Western markets but cost of living is proportionally low. Malaysia My Second Home (MM2H) and other long-term visa options available. Strong stepping stone for careers across ASEAN if regional ambitions align.",
  },
};

const SECTIONS: { key: keyof CountryProfile; title: string; icon: string }[] = [
  { key: "ecosystem", title: "Higher Education Ecosystem", icon: "🎓" },
  { key: "institutions", title: "Types of Institutions", icon: "🏛️" },
  { key: "admission", title: "Admission Process", icon: "📋" },
  { key: "quality", title: "Education Quality", icon: "⭐" },
  { key: "cost", title: "Cost of Education", icon: "💰" },
  { key: "scholarships", title: "Scholarships", icon: "🏆" },
  { key: "safety", title: "Safety & Security", icon: "🛡️" },
  { key: "studentLife", title: "Life as a Student", icon: "🌏" },
  { key: "jobMarket", title: "Job Market", icon: "💼" },
];

interface Props {
  countryName: string | null;
  onClose: () => void;
}

export default function CountryModal({ countryName, onClose }: Props) {
  const profile = countryName ? COUNTRY_PROFILES[countryName] : null;

  useEffect(() => {
    if (!profile) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [profile, onClose]);

  if (!profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Hero image */}
        <div className="relative h-40 sm:h-48 flex-shrink-0">
          <img
            src={profile.img}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-5">
            <p className="text-3xl mb-0.5">{profile.flag}</p>
            <h2 className="text-white font-extrabold text-2xl">{profile.name}</h2>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {SECTIONS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{s.icon}</span>
                <h3 className="font-bold text-gray-900 text-sm">{s.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-6">
                {profile[s.key]}
              </p>
            </div>
          ))}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
