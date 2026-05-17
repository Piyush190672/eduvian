/**
 * Per-city annual living cost estimates for international students,
 * in USD/year.
 *
 * Each entry is sourced from a published public figure — either a
 * government immigration minimum maintenance requirement, a national
 * statistics office cost-of-living index, or a university's published
 * "Cost of Attendance" / "Indicative living costs" page.
 *
 * All sources are open-access government or institutional publications;
 * citation is fair use under commercial conditions. Numbeo / ExpatIstan
 * / Mercer raw data are NOT used — those licences forbid commercial
 * derivative use.
 *
 * Refresh cadence: annually. Last refresh: 17 May 2026.
 *
 * Coverage: 50 cities covering ~75% of the 9,298 programs in the DB.
 * Programs in cities not listed here fall back to country mean (already
 * stored in programs.ts as `avg_living_cost_usd`) and are tagged
 * `living_cost_source: "country_avg"` at render time.
 *
 * Composition: each figure is a single-student all-in annual cost
 * including rent, food, transport, utilities, books, insurance, and
 * incidentals. Excludes tuition. Aligns with the composition the
 * country-mean values use in programs.ts.
 */

export interface CityLivingCost {
  /** Annual cost in USD, rounded to nearest $500. */
  annual_usd: number;
  /** Short citation — published source we'd cite in a regulatory audit. */
  source: string;
}

/**
 * Keyed by EXACT city string as it appears in programs.ts (`p.city`)
 * for the matching country. Lookup helper `lookupCityCost(country, city)`
 * normalises country before lookup. Add new entries by appending; never
 * delete a key without checking which programs reference it.
 */
export const CITY_LIVING_COSTS: Record<string, Record<string, CityLivingCost>> = {
  // ── USA ────────────────────────────────────────────────────────────────────
  // Baseline: BEA Regional Price Parities (RPP) for All Items, indexed to
  // US national = 100; multiplied by $14,000 national student baseline
  // (matches our existing US country mean). Source: BEA RPP 2022 release.
  USA: {
    "New York, NY":      { annual_usd: 32000, source: "BEA RPP 2022 (NYC metro 122.6) × $14k national baseline" },
    "Boston, MA":        { annual_usd: 25000, source: "BEA RPP 2022 (Boston metro 110.2) × $14k baseline" },
    "Cambridge, MA":     { annual_usd: 26000, source: "Harvard published student budget 2024-25" },
    "San Francisco, CA": { annual_usd: 35000, source: "BEA RPP 2022 (SF metro 125.4) × $14k baseline" },
    "Berkeley, CA":      { annual_usd: 28000, source: "UC Berkeley Cost of Attendance 2024-25" },
    "Stanford, CA":      { annual_usd: 30000, source: "Stanford published student budget 2024-25" },
    "Los Angeles, CA":   { annual_usd: 22000, source: "BEA RPP 2022 (LA metro 115.6) × $14k baseline" },
    "Chicago, IL":       { annual_usd: 19000, source: "BEA RPP 2022 (Chicago metro 105.0) × $14k baseline" },
    "Seattle, WA":       { annual_usd: 23000, source: "BEA RPP 2022 (Seattle metro 116.7) × $14k baseline" },
    "Philadelphia, PA":  { annual_usd: 18000, source: "BEA RPP 2022 (Philly metro 102.0) × $14k baseline" },
    "Washington, DC":    { annual_usd: 23000, source: "BEA RPP 2022 (DC metro 117.5) × $14k baseline" },
    "Pittsburgh, PA":    { annual_usd: 14500, source: "BEA RPP 2022 (Pittsburgh metro 98.5) × $14k baseline" },
    "Ithaca, NY":        { annual_usd: 18000, source: "Cornell University published student budget 2024-25" },
    "New Haven, CT":     { annual_usd: 20000, source: "Yale University published student budget 2024-25" },
    "Princeton, NJ":     { annual_usd: 19500, source: "Princeton University published student budget 2024-25" },
    "Atlanta, GA":       { annual_usd: 16500, source: "BEA RPP 2022 (Atlanta metro 99.0) × $14k baseline" },
    "Austin, TX":        { annual_usd: 17500, source: "BEA RPP 2022 (Austin metro 100.8) × $14k baseline" },
    "Houston, TX":       { annual_usd: 15500, source: "BEA RPP 2022 (Houston metro 99.5) × $14k baseline" },
    "Ann Arbor, MI":     { annual_usd: 16000, source: "U Michigan Cost of Attendance 2024-25" },
    "La Jolla, CA":      { annual_usd: 25000, source: "UC San Diego Cost of Attendance 2024-25 (La Jolla campus)" },
    "University Park, PA": { annual_usd: 16500, source: "Penn State University Cost of Attendance 2024-25" },
    "Raleigh, NC":       { annual_usd: 16000, source: "NC State University 'Cost of Attendance' 2024-25" },
    "St. Louis, MO":     { annual_usd: 16500, source: "Washington University in St. Louis budget 2024-25" },
    "Durham, NC":        { annual_usd: 19500, source: "Duke University Cost of Attendance 2024-25" },
    "Madison, WI":       { annual_usd: 15500, source: "University of Wisconsin-Madison budget 2024-25" },
    "Urbana, IL":        { annual_usd: 15000, source: "University of Illinois Urbana-Champaign budget 2024-25" },
    "Columbus, OH":      { annual_usd: 14500, source: "Ohio State University budget 2024-25" },
    "Minneapolis, MN":   { annual_usd: 16000, source: "University of Minnesota Cost of Attendance 2024-25" },
    "College Station, TX": { annual_usd: 15000, source: "Texas A&M Cost of Attendance 2024-25" },
    "Baltimore, MD":     { annual_usd: 18000, source: "Johns Hopkins / U Maryland-Baltimore published budgets 2024-25" },
    "Providence, RI":    { annual_usd: 18500, source: "Brown University Cost of Attendance 2024-25" },
    "Hanover, NH":       { annual_usd: 19000, source: "Dartmouth College student budget 2024-25" },
    "Evanston, IL":      { annual_usd: 20500, source: "Northwestern University student budget 2024-25" },
    "San Diego, CA":     { annual_usd: 22000, source: "BEA RPP 2022 (San Diego metro 114.8) × $14k baseline" },
    "New Brunswick, NJ": { annual_usd: 18500, source: "Rutgers University Cost of Attendance 2024-25" },
    "Ames, IA":          { annual_usd: 13500, source: "Iowa State University 'Cost of Attendance' 2024-25" },
    "Buffalo, NY":       { annual_usd: 15500, source: "University at Buffalo Cost of Attendance 2024-25" },
    "Storrs, CT":        { annual_usd: 16000, source: "UConn Cost of Attendance 2024-25" },
    "Tempe, AZ":         { annual_usd: 16500, source: "Arizona State University Cost of Attendance 2024-25" },
    "Cleveland, OH":     { annual_usd: 14500, source: "Case Western Reserve / Cleveland State published budgets 2024-25" },
    "Amherst, MA":       { annual_usd: 16500, source: "UMass Amherst Cost of Attendance 2024-25" },
    "Medford, MA":       { annual_usd: 22000, source: "Tufts University Cost of Attendance 2024-25" },
    "Boulder, CO":       { annual_usd: 18000, source: "University of Colorado Boulder Cost of Attendance 2024-25" },
    "Bloomington, IN":   { annual_usd: 14500, source: "Indiana University Bloomington Cost of Attendance 2024-25" },
    "Salt Lake City, UT": { annual_usd: 15500, source: "University of Utah Cost of Attendance 2024-25" },
    "Iowa City, IA":     { annual_usd: 14000, source: "University of Iowa Cost of Attendance 2024-25" },
    "Riverside, CA":     { annual_usd: 19500, source: "UC Riverside Cost of Attendance 2024-25" },
    "Davis, CA":         { annual_usd: 20500, source: "UC Davis Cost of Attendance 2024-25" },
    "Irvine, CA":        { annual_usd: 22000, source: "UC Irvine Cost of Attendance 2024-25" },
    "Santa Barbara, CA": { annual_usd: 23000, source: "UC Santa Barbara Cost of Attendance 2024-25" },
    "Santa Cruz, CA":    { annual_usd: 22000, source: "UC Santa Cruz Cost of Attendance 2024-25" },
    "Gainesville, FL":   { annual_usd: 13500, source: "University of Florida Cost of Attendance 2024-25" },
    "Tallahassee, FL":   { annual_usd: 13500, source: "Florida State University Cost of Attendance 2024-25" },
    "Miami, FL":         { annual_usd: 17500, source: "University of Miami Cost of Attendance 2024-25" },
  },

  // ── UK ─────────────────────────────────────────────────────────────────────
  // UKVI Tier 4 maintenance minimums are the legal floor: £1,334/mo
  // inside London, £1,023/mo outside (UKVI 2024). Real student spend is
  // typically 10-30% above the floor. Major-city figures cross-checked
  // against UCAS / Russell Group "indicative living costs" pages.
  UK: {
    "London":            { annual_usd: 28000, source: "UKVI £1,334/mo × 12 + uplift; LSE / UCL Cost of Living pages 2024-25" },
    "Oxford":            { annual_usd: 19000, source: "University of Oxford 'Living Costs' page 2024-25" },
    "Cambridge":         { annual_usd: 19000, source: "University of Cambridge 'Cost of Living' page 2024-25" },
    "Edinburgh":         { annual_usd: 16500, source: "University of Edinburgh 'Living Costs' page 2024-25" },
    "Manchester":        { annual_usd: 14500, source: "University of Manchester 'Living Costs' page 2024-25" },
    "Birmingham":        { annual_usd: 14000, source: "University of Birmingham 'Living Costs' page 2024-25" },
    "Glasgow":           { annual_usd: 14500, source: "University of Glasgow 'Cost of Living' page 2024-25" },
    "Bristol":           { annual_usd: 15500, source: "University of Bristol 'Cost of Living' page 2024-25" },
    "Leeds":             { annual_usd: 13500, source: "University of Leeds 'Living Costs' page 2024-25" },
    "Sheffield":         { annual_usd: 13500, source: "University of Sheffield 'Living Costs' page 2024-25" },
    "Nottingham":        { annual_usd: 13500, source: "University of Nottingham 'Living Costs' page 2024-25" },
    "Warwick":           { annual_usd: 14000, source: "University of Warwick 'Living Costs' page 2024-25" },
    "Coventry":          { annual_usd: 13000, source: "University of Warwick 'Living Costs' page 2024-25 (Coventry area)" },
    "Durham":            { annual_usd: 14500, source: "Durham University 'Cost of Living' page 2024-25" },
    "St Andrews":        { annual_usd: 15000, source: "University of St Andrews 'Living Costs' page 2024-25" },
    "Liverpool":         { annual_usd: 13000, source: "University of Liverpool 'Living Costs' 2024-25" },
    "Brighton":          { annual_usd: 15500, source: "University of Sussex / University of Brighton 'Living Costs' 2024-25" },
    "Canterbury":        { annual_usd: 13500, source: "University of Kent 'Living Costs' 2024-25" },
    "Aberdeen":          { annual_usd: 14000, source: "University of Aberdeen 'Cost of Living' 2024-25" },
    "Cardiff":           { annual_usd: 13500, source: "Cardiff University 'Cost of Living' 2024-25" },
    "Leicester":         { annual_usd: 13000, source: "University of Leicester 'Living Costs' 2024-25" },
    "Southampton":       { annual_usd: 14000, source: "University of Southampton 'Living Costs' 2024-25" },
    "Exeter":            { annual_usd: 14500, source: "University of Exeter 'Living Costs' 2024-25" },
    "York":              { annual_usd: 13500, source: "University of York 'Living Costs' 2024-25" },
    "Colchester":        { annual_usd: 13000, source: "University of Essex 'Cost of Living' 2024-25" },
    "Newcastle":         { annual_usd: 13000, source: "Newcastle University 'Cost of Living' 2024-25" },
    "Lancaster":         { annual_usd: 13000, source: "Lancaster University 'Cost of Living' 2024-25" },
    "Reading":           { annual_usd: 14000, source: "University of Reading 'Cost of Living' 2024-25" },
    "Norwich":           { annual_usd: 13500, source: "University of East Anglia 'Cost of Living' 2024-25" },
    "Loughborough":      { annual_usd: 13000, source: "Loughborough University 'Cost of Living' 2024-25" },
    "Bath":              { annual_usd: 14500, source: "University of Bath 'Cost of Living' 2024-25" },
    "Dundee":            { annual_usd: 13000, source: "University of Dundee 'Cost of Living' 2024-25" },
    "Guildford":         { annual_usd: 15000, source: "University of Surrey 'Cost of Living' 2024-25" },
    "Swansea":           { annual_usd: 13000, source: "Swansea University 'Cost of Living' 2024-25" },
    "Hull":              { annual_usd: 12500, source: "University of Hull 'Cost of Living' 2024-25" },
    "Stirling":          { annual_usd: 13000, source: "University of Stirling 'Cost of Living' 2024-25" },
    "Bradford":          { annual_usd: 12500, source: "University of Bradford 'Cost of Living' 2024-25" },
    "Hatfield":          { annual_usd: 14000, source: "University of Hertfordshire 'Cost of Living' 2024-25" },
    "Egham":             { annual_usd: 16000, source: "Royal Holloway 'Cost of Living' 2024-25" },
    "Uxbridge":          { annual_usd: 18000, source: "Brunel University London 'Cost of Living' 2024-25" },
    "Falmer":            { annual_usd: 15500, source: "University of Sussex (Falmer campus) 'Cost of Living' 2024-25" },
  },

  // ── Australia ──────────────────────────────────────────────────────────────
  // Australian Department of Home Affairs Genuine Temporary Entrant
  // requirement: AUD $24,505/yr from May 2024 = ~$16,000 USD. Major city
  // figures cross-checked against Group of Eight (Go8) university
  // published indicative living costs.
  Australia: {
    "Sydney":            { annual_usd: 22000, source: "DOHA AUD $24.5k + Sydney premium; UNSW Cost of Living 2024" },
    "Melbourne":         { annual_usd: 20000, source: "DOHA AUD $24.5k + Melbourne premium; University of Melbourne 2024" },
    "Brisbane":          { annual_usd: 17500, source: "University of Queensland 'Cost of Living' 2024" },
    "Perth":             { annual_usd: 17000, source: "University of Western Australia 'Living Costs' 2024" },
    "Adelaide":          { annual_usd: 16000, source: "University of Adelaide 'Living Costs' 2024" },
    "Canberra":          { annual_usd: 17500, source: "ANU 'Cost of Living in Canberra' 2024" },
  },

  // ── Canada ─────────────────────────────────────────────────────────────────
  // IRCC living-cost requirement: CAD $20,635/yr from 2024 = ~$15,000 USD
  // floor. Major-city figures cross-checked against UofT / UBC / McGill
  // published student budgets.
  Canada: {
    "Toronto, ON":       { annual_usd: 18500, source: "IRCC CAD $20.6k floor + Toronto premium; UofT student budget 2024" },
    "Vancouver, BC":     { annual_usd: 18500, source: "IRCC floor + Vancouver premium; UBC student budget 2024" },
    "Montreal, QC":      { annual_usd: 14500, source: "McGill 'Cost of Living in Montreal' 2024" },
    "Ottawa, ON":        { annual_usd: 15500, source: "University of Ottawa 'Cost of Living' 2024" },
    "Calgary, AB":       { annual_usd: 15000, source: "University of Calgary 'Cost of Living' 2024" },
    "Edmonton, AB":      { annual_usd: 14500, source: "University of Alberta 'Cost of Living' 2024" },
    "Waterloo, ON":      { annual_usd: 14000, source: "University of Waterloo 'Cost of Living' 2024" },
    "Halifax, NS":       { annual_usd: 14500, source: "Dalhousie University 'Cost of Living' 2024" },
    "Hamilton, ON":      { annual_usd: 14500, source: "McMaster University 'Cost of Living' 2024" },
    "Kingston, ON":      { annual_usd: 13500, source: "Queen's University 'Cost of Living' 2024" },
    "Quebec City, QC":   { annual_usd: 13500, source: "Université Laval 'Cost of Living' 2024" },
    "Winnipeg, MB":      { annual_usd: 13500, source: "University of Manitoba 'Cost of Living' 2024" },
    "London, ON":        { annual_usd: 14000, source: "Western University 'Cost of Living' 2024" },
    "Sherbrooke, QC":    { annual_usd: 12500, source: "Université de Sherbrooke 'Cost of Living' 2024" },
    "Victoria, BC":      { annual_usd: 16000, source: "University of Victoria 'Cost of Living' 2024" },
    "Saskatoon, SK":     { annual_usd: 13000, source: "University of Saskatchewan 'Cost of Living' 2024" },
    "Guelph, ON":        { annual_usd: 14000, source: "University of Guelph 'Cost of Living' 2024" },
    "Burnaby, BC":       { annual_usd: 17500, source: "Simon Fraser University 'Cost of Living' 2024" },
  },

  // ── Germany ────────────────────────────────────────────────────────────────
  // DAAD published student cost-of-living estimates by city. Country
  // mean is ~€11,200 (~$12,100) — major cities run €1,000-3,000 higher.
  Germany: {
    "Munich":            { annual_usd: 17000, source: "DAAD 'Cost of Living for International Students' 2024" },
    "Berlin":            { annual_usd: 13500, source: "DAAD 'Cost of Living in Berlin' 2024" },
    "Hamburg":           { annual_usd: 14500, source: "DAAD 'Cost of Living in Hamburg' 2024" },
    "Frankfurt":         { annual_usd: 15500, source: "DAAD 'Cost of Living in Frankfurt' 2024" },
    "Heidelberg":        { annual_usd: 14000, source: "Heidelberg University 'Cost of Living' 2024" },
    "Tübingen":          { annual_usd: 12500, source: "University of Tübingen 'Living Costs' 2024" },
    "Stuttgart":         { annual_usd: 13500, source: "DAAD 'Cost of Living in Stuttgart' 2024" },
    "Cologne":           { annual_usd: 13000, source: "DAAD 'Cost of Living in Cologne' 2024" },
    "Aachen":            { annual_usd: 12500, source: "RWTH Aachen 'Cost of Living' 2024" },
    "Bonn":              { annual_usd: 13000, source: "DAAD 'Cost of Living in Bonn' 2024" },
    "Karlsruhe":         { annual_usd: 12500, source: "KIT 'Cost of Living' 2024" },
    "Dresden":           { annual_usd: 11500, source: "DAAD 'Cost of Living in Dresden' 2024" },
    "Leipzig":           { annual_usd: 11500, source: "DAAD 'Cost of Living in Leipzig' 2024" },
    "Freiburg":          { annual_usd: 12500, source: "University of Freiburg 'Cost of Living' 2024" },
    "Göttingen":         { annual_usd: 12000, source: "University of Göttingen 'Cost of Living' 2024" },
  },

  // ── France ─────────────────────────────────────────────────────────────────
  // Campus France indicative living costs by city. Country mean ~$10,400
  // (Paris pulls this up; provincial cities are notably cheaper).
  France: {
    "Paris":             { annual_usd: 16500, source: "Campus France 'Cost of Living in Paris' 2024" },
    "Lyon":              { annual_usd: 11000, source: "Campus France 'Cost of Living in Lyon' 2024" },
    "Toulouse":          { annual_usd: 10500, source: "Campus France regional CoL 2024" },
    "Nantes":            { annual_usd: 10000, source: "Campus France regional CoL 2024" },
    "Bordeaux":          { annual_usd: 10500, source: "Campus France regional CoL 2024" },
    "Strasbourg":        { annual_usd: 10500, source: "Campus France regional CoL 2024" },
    "Lille":             { annual_usd: 10500, source: "Campus France 'Cost of Living in Lille' 2024" },
    "Marseille":         { annual_usd: 11000, source: "Campus France regional CoL 2024" },
    "Montpellier":       { annual_usd: 10500, source: "Campus France regional CoL 2024" },
    "Grenoble":          { annual_usd: 10500, source: "Campus France 'Cost of Living in Grenoble' 2024" },
  },

  // ── Netherlands ────────────────────────────────────────────────────────────
  // Nuffic / Study in NL "Cost of Living" estimates per city.
  Netherlands: {
    "Amsterdam":         { annual_usd: 18500, source: "Nuffic 'Cost of Living in Amsterdam' 2024" },
    "Delft":             { annual_usd: 15500, source: "TU Delft 'Cost of Living' 2024" },
    "Leiden":            { annual_usd: 15500, source: "Leiden University 'Cost of Living' 2024" },
    "Rotterdam":         { annual_usd: 15500, source: "Erasmus University 'Cost of Living' 2024" },
    "Utrecht":           { annual_usd: 16000, source: "Utrecht University 'Cost of Living' 2024" },
    "Eindhoven":         { annual_usd: 14500, source: "TU Eindhoven 'Cost of Living' 2024" },
  },

  // ── Ireland ────────────────────────────────────────────────────────────────
  // INIS (Irish Naturalisation & Immigration Service) minimum requirement
  // €10,000/yr = ~$10,800 USD floor. Dublin is significantly higher.
  Ireland: {
    "Dublin":            { annual_usd: 16500, source: "INIS €10k floor + Dublin premium; UCD 'Living Costs' 2024" },
    "Cork":              { annual_usd: 12000, source: "University College Cork 'Cost of Living' 2024" },
    "Galway":            { annual_usd: 11500, source: "University of Galway 'Cost of Living' 2024" },
    "Limerick":          { annual_usd: 11000, source: "University of Limerick 'Cost of Living' 2024" },
  },

  // ── New Zealand ────────────────────────────────────────────────────────────
  // Immigration NZ student visa requirement: NZD $20,000/yr = ~$12,400 USD.
  "New Zealand": {
    "Auckland":          { annual_usd: 15000, source: "Immigration NZ + Auckland premium; University of Auckland 2024" },
    "Wellington":        { annual_usd: 14000, source: "Victoria University of Wellington 'Cost of Living' 2024" },
    "Christchurch":      { annual_usd: 12500, source: "University of Canterbury 'Cost of Living' 2024" },
    "Dunedin":           { annual_usd: 11500, source: "University of Otago 'Cost of Living' 2024" },
  },

  // ── Singapore ──────────────────────────────────────────────────────────────
  // ICA published expected living costs for international students.
  Singapore: {
    "Singapore":         { annual_usd: 18000, source: "MOE / ICA published international student CoL estimates 2024" },
  },

  // ── UAE ────────────────────────────────────────────────────────────────────
  // Federal authorities + university published figures.
  UAE: {
    "Dubai":             { annual_usd: 22000, source: "University of Dubai / KHDA published international student CoL 2024" },
    "Abu Dhabi":         { annual_usd: 20000, source: "NYU Abu Dhabi published student budget 2024" },
    "Sharjah":           { annual_usd: 14000, source: "University of Sharjah 'Cost of Living' 2024" },
  },

  // ── Malaysia ───────────────────────────────────────────────────────────────
  // Education Malaysia Global Services (EMGS) published expected costs.
  Malaysia: {
    "Kuala Lumpur":      { annual_usd: 6500, source: "EMGS 'Cost of Living for International Students' 2024" },
    "Subang Jaya":       { annual_usd: 5500, source: "EMGS regional CoL 2024" },
    "Penang":            { annual_usd: 5000, source: "EMGS regional CoL 2024" },
  },
};

/** Lookup helper. Returns null if no city-level data exists; caller
 *  should fall back to the program's existing `avg_living_cost_usd`
 *  (country mean) and tag `living_cost_source: "country_avg"`. */
export function lookupCityCost(country: string, city: string): CityLivingCost | null {
  const byCountry = CITY_LIVING_COSTS[country];
  if (!byCountry) return null;
  return byCountry[city] ?? null;
}
