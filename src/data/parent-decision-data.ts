import type { SalaryCountry } from "@/data/roi-data";

// Post-Study Work Visa rights by country
export const PSW_RIGHTS: Record<SalaryCountry, { available: boolean; duration: string; note: string }> = {
  USA:          { available: true,  duration: "1–3 years",  note: "OPT (1 yr) / STEM OPT (3 yrs)" },
  UK:           { available: true,  duration: "2–3 years",  note: "Graduate Route Visa" },
  Australia:    { available: true,  duration: "2–4 years",  note: "Temporary Graduate Visa (485)" },
  Canada:       { available: true,  duration: "1–3 years",  note: "PGWP — up to program length" },
  Germany:      { available: true,  duration: "18 months",  note: "Job-seeker visa post-graduation" },
  Singapore:    { available: true,  duration: "1–2 years",  note: "Training Employment Pass" },
  "New Zealand":{ available: true,  duration: "1–3 years",  note: "Post Study Work Visa" },
  Ireland:      { available: true,  duration: "1–2 years",  note: "Third Level Graduate Scheme" },
  France:       { available: true,  duration: "12 months",  note: "APS visa for graduates" },
  UAE:          { available: false, duration: "N/A",        note: "No formal PGWP; employer sponsorship needed" },
  Malaysia:     { available: false, duration: "N/A",        note: "No formal PGWP; work permit needed" },
};

export type QualityLevel = "Excellent" | "Good" | "Concerning";

// Job Market outlook per country (for international graduates)
export const JOB_MARKET: Record<SalaryCountry, { rating: QualityLevel; detail: string }> = {
  USA:          { rating: "Excellent",  detail: "World's largest job market; strong tech, finance & healthcare hiring" },
  UK:           { rating: "Good",       detail: "Robust financial services, consulting & engineering sectors" },
  Australia:    { rating: "Excellent",  detail: "Skills shortages in tech, healthcare & trades; high grad employment" },
  Canada:       { rating: "Excellent",  detail: "High immigration-to-PR pathways; tech & healthcare in demand" },
  Germany:      { rating: "Good",       detail: "Engineering & STEM-focused; language barrier for some roles" },
  Singapore:    { rating: "Excellent",  detail: "Southeast Asia's finance & tech hub; competitive but rewarding" },
  "New Zealand":{ rating: "Good",       detail: "Smaller market; strong in agriculture, tech & construction" },
  Ireland:      { rating: "Good",       detail: "EU tech hub (Google, Meta, Apple HQs); strong pharma sector" },
  France:       { rating: "Concerning", detail: "Language barrier significant for international grads; EU access helps" },
  UAE:          { rating: "Good",       detail: "Fast-growing economy; finance, logistics & hospitality strong" },
  Malaysia:     { rating: "Concerning", detail: "Developing market; lower salaries; mostly regional opportunities" },
};

// Safety & Security ratings
export const SAFETY_RATINGS: Record<SalaryCountry, { rating: QualityLevel; detail: string }> = {
  USA:          { rating: "Good",       detail: "Generally safe; varies by city; standard precautions advised" },
  UK:           { rating: "Excellent",  detail: "Very safe overall; low violent crime; welcoming to internationals" },
  Australia:    { rating: "Excellent",  detail: "Consistently ranked among world's safest countries" },
  Canada:       { rating: "Excellent",  detail: "Very low crime rates; inclusive and multicultural" },
  Germany:      { rating: "Excellent",  detail: "High safety standards; efficient emergency services" },
  Singapore:    { rating: "Excellent",  detail: "One of the safest cities globally; strict law enforcement" },
  "New Zealand":{ rating: "Excellent",  detail: "Peaceful and safe; very low crime; friendly to internationals" },
  Ireland:      { rating: "Excellent",  detail: "Low crime; friendly locals; safe student cities" },
  France:       { rating: "Good",       detail: "Generally safe; occasional protests in major cities" },
  UAE:          { rating: "Excellent",  detail: "Very low crime; strict laws; safe environment for students" },
  Malaysia:     { rating: "Good",       detail: "Relatively safe; standard precautions advised in city areas" },
};

// Student Life quality
export const STUDENT_LIFE: Record<SalaryCountry, { rating: QualityLevel; detail: string }> = {
  USA:          { rating: "Excellent",  detail: "Vibrant campus culture; sports, clubs, diverse social scene" },
  UK:           { rating: "Excellent",  detail: "Rich history, cultural events, student unions, pub culture" },
  Australia:    { rating: "Excellent",  detail: "Outdoor lifestyle, beaches, multicultural cities, relaxed vibe" },
  Canada:       { rating: "Excellent",  detail: "Welcoming cities, diverse food scene, nature access, strong community" },
  Germany:      { rating: "Good",       detail: "Affordable living, cultural richness; language barrier initially" },
  Singapore:    { rating: "Good",       detail: "Modern, safe, diverse; expensive but compact and efficient" },
  "New Zealand":{ rating: "Excellent",  detail: "Stunning landscapes, adventure sports, relaxed & inclusive" },
  Ireland:      { rating: "Excellent",  detail: "Lively pub culture, music festivals, friendly people, scenic landscapes" },
  France:       { rating: "Excellent",  detail: "World-class culture, cuisine, fashion; great quality of life" },
  UAE:          { rating: "Good",       detail: "Modern lifestyle, malls, nightlife; conservative norms in public" },
  Malaysia:     { rating: "Good",       detail: "Affordable, multicultural, great food; tropical climate" },
};

export type { SalaryCountry };
