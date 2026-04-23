// ─── Interview Coaching Guidelines ────────────────────────────────────────────
// Source: Official knowledge files uploaded by the team.
//   AU → Australia_Interview_Prep_Knowledge_File.docx
//   UK → UK_Visa_Interview_Prep_Knowledge_File.docx
//
// These checklists are passed verbatim to the AI feedback engine so it evaluates
// student answers strictly against the official approved criteria.
// ──────────────────────────────────────────────────────────────────────────────

// AU: guidelines are per CATEGORY (all questions in a category share the same checklist)
export const AU_GUIDELINES: Record<string, string[]> = {
  program: [
    "Personal interest and motivation for choosing this course",
    "How the course connects to academic background",
    "Career goals and how this course helps achieve them",
    "Future opportunities the course will open up",
    "Specific skills the student wants to gain from this course",
  ],
  career: [
    "Career goals and objectives clearly articulated",
    "Relevant industries and specific companies the student would like to work for",
    "University industry tie-ups and internship advantages for a better start",
    "Problem-solving and analytical skills expected to be built",
    "Expected growth trajectory in the chosen sector",
    "Realistic and researched remuneration range after completing the course",
    "Career advancement plan that addresses current skill and knowledge gaps",
  ],
  australia: [
    "High living standard and safe environment in Australia",
    "Strong academic standards of Australian universities",
    "Opportunity to gain international work experience in Australia",
    "Better cost-benefit or ROI compared to studying in India or other countries",
    "Presence of a large and supportive Indian diaspora",
    "Need for international exposure that is not available to the same degree in India",
  ],
  university: [
    "University overall rankings, subject-specific rankings, and employability rankings",
    "Renowned faculty and teaching excellence at the chosen institution",
    "Industry connections and internship opportunities provided by the university",
    "Location of the university and campus, including city and state",
    "How the university's strengths align with personal and career goals",
    "Accommodation options available on or near campus",
    "Infrastructure, student support services, and campus facilities",
  ],
  other: [
    "Strong family and financial ties in India that motivate return",
    "Immigration history and compliance record",
    "How the student has prepared for further studies, research, or personal development",
    "Efforts made to stay industry-relevant during any gap period",
  ],
};

// USA: guidelines are per SECTION (all questions in a section share the same checklist)
export const USA_GUIDELINES: Record<string, string[]> = {
  "Why United States of America": [
    "Clear and genuine reason why USA over India or other countries",
    "Confirm the course is not equally available or accessible in India",
    "Demonstrate knowledge of USA's academic excellence and research environment",
    "Non-immigrant intent — clear plan to return home after studies",
    "Awareness that the F-1 visa is a temporary student visa",
  ],
  "About Institute / University / College": [
    "Full name and location (city and state) of the university",
    "University ranking, reputation, and course-specific strengths",
    "Specific reasons for choosing this university over others applied to",
    "Total number of universities applied to (both admits and rejects mentioned)",
    "Names of at least one or two faculty members in the relevant department",
    "Scholarship details if applicable — amount, type, and awarding body",
  ],
  "About Your Course": [
    "Exact course name and degree level (MS, MBA, BS, etc.)",
    "Relevance of the course to previous academic background or work experience",
    "Key modules, subjects, or specialisations within the programme",
    "Duration of the course stated confidently",
    "Course commencement date",
    "Total cost per year including tuition and estimated living expenses",
    "Confirmed or planned accommodation arrangement in the US",
    "Post-graduation scope and job market relevance of the course",
  ],
  "Your Academic Background": [
    "Name of the last institution studied at stated confidently",
    "Degree title, specialisation, and percentage or CGPA",
    "Key subjects studied and their connection to the proposed course",
    "Clear academic progression logic from previous studies to current application",
  ],
  "Current Job / Business": [
    "Current employer name and job title stated clearly if working",
    "Reason for leaving the current job to pursue higher studies",
    "How existing work experience directly supports the proposed course",
    "Confirmation that work experience is documented (experience letter available)",
  ],
  "TOEFL / IELTS / GRE / GMAT / SAT": [
    "Exact test scores stated confidently",
    "Awareness of the minimum score requirement at the chosen university",
    "If scores are lower than average, a compensating strength is mentioned",
    "Tests taken within their valid period",
  ],
  "About Your Family": [
    "Father's and/or mother's occupation clearly stated",
    "Number of siblings and their education or occupation mentioned",
    "Overall family educational background",
    "Family support for the student's decision to study abroad confirmed",
  ],
  "Sponsor and Financial Detail": [
    "Clear identification of the primary sponsor (father, self, education loan)",
    "Sponsor's annual income or total assets stated confidently",
    "Sufficient combined funds to cover full course tuition and living expenses",
    "Total cost awareness for the entire course duration",
    "Education loan details if applicable — bank name, amount, and approval status",
    "Bank balance or liquid savings available for immediate expenses",
    "Number of financial dependents of the sponsor mentioned",
  ],
  "Future Plans (Career Prospects)": [
    "Explicit and confident plan to return to home country after completing studies",
    "Specific job roles, industries, or companies targeted back home",
    "Expected salary or remuneration range stated confidently",
    "Clear explanation of how the US degree adds career value in the home country",
    "Non-immigrant intent reinforced — no plan to settle permanently in the US",
    "Strong home-country ties demonstrated (family, property, job prospects)",
  ],
  "Relatives in US": [
    "Honest and confident disclosure of relatives or acquaintances in the US",
    "If relatives exist, assurance that primary focus remains on studies",
    "Demonstration that family ties and career are anchored in the home country",
  ],
  "Visa or Refusal": [
    "Confident, structured statement of purpose and intent to study",
    "Strong ties to home country highlighted (family, career, assets)",
    "Non-immigrant intent demonstrated clearly and positively",
    "If previously refused a visa, honest explanation of what has changed since",
    "Preparation and research evident — the student knows exactly why they deserve the visa",
  ],
  "Miscellaneous": [
    "Any prior travel history mentioned honestly and confidently",
    "Clear plan to return home during summers or semester breaks if asked",
    "Productive and purposeful use of off-periods described (study, family, internship)",
  ],
};

// UK: guidelines are per QUESTION (each question has its own checklist)
export const UK_GUIDELINES: Record<string, string[]> = {
  "Why do you want to study in the UK?": [
    "Practical and application-based learning offered by UK institutions",
    "Industry-integrated curriculum and relevance to current job market",
    "Research and project-focused teaching methodology",
    "Exposure to international classrooms and diverse perspectives",
    "Skill enhancement aligned with global professional standards",
    "Development of a global mindset and international perspective",
    "Improved professional readiness and employability after graduation",
  ],
  "Why did you choose this particular course?": [
    "Exact course title and qualification level (MSc / MBA / MA / Diploma)",
    "Relevant modules and curriculum structure of the programme",
    "Practical exposure such as labs, projects, or real-world case studies",
    "Employability support and career services offered by the university",
    "Industry placement or internship opportunities if applicable",
    "Course or university rankings and reputation in the chosen subject area",
  ],
  "Why did you choose this university?": [
    "Course-specific modules and teaching approach at this university",
    "Student satisfaction scores and quality of academic support services",
    "Employability outcomes and career development support provided",
    "University facilities, library, and overall learning environment",
    "Reputation and standing in the chosen subject area",
  ],
  "Can you explain the course structure and key modules?": [
    "Taught and practical components of the programme",
    "Two to four key modules most relevant to career goals",
    "How modules build both theoretical and practical capability",
    "Role of dissertation, capstone project, or independent research if applicable",
    "Application of academic learning to real-world or industry problems",
  ],
  "How is this course different from similar courses in India?": [
    "Strong focus on practical learning and industry case studies in UK",
    "Research-driven and evidence-based teaching methods",
    "Exposure to international faculty and classmates from diverse backgrounds",
    "Global business perspectives and international professional networks",
  ],
  "What are your career plans after completing this course?": [
    "Clear post-study return plan to home country",
    "Relevant industries and example companies in the home country",
    "How specific skills gained from the course will be applied",
    "Career progression logic and long-term professional roadmap",
    "Professional value of international exposure for the home-country job market",
  ],
  "Who is sponsoring your education? How will you fund your studies?": [
    "Clear source of funding (self / parents / education loan)",
    "Stable and legitimate income of the sponsor",
    "Sufficient savings to cover tuition fees and living costs",
    "Exact tuition fee for the course in GBP",
    "Estimated monthly living expenses (London vs outside London)",
    "Total cost of study including tuition and living",
    "Comfort and familiarity with GBP figures",
  ],
  "What is the duration of your course?": [
    "Exact duration of the course stated confidently",
    "Awareness of programme structure across the study period",
    "Understanding that offer letters may show only one year's tuition at a time",
  ],
  "Can you explain your academic background?": [
    "Previous qualification clearly named",
    "Relevant subjects, skills, or learning from prior study",
    "Transferable skills such as analytical thinking, research, communication, or management",
    "Clear connection between prior education and the proposed programme",
  ],
  "Is there any gap in your education or employment?": [
    "Honest and confident explanation of the gap period",
    "Purpose or learning achieved during the gap",
    "Why the student is now ready and prepared for the proposed course",
  ],
  "Where is your university located? What do you know about the city? What facilities are available at your university?": [
    "City and region where the university is located",
    "Academic resources, library facilities, and qualified faculty",
    "Research facilities relevant to the course or future career trends",
    "Campus diversity, student clubs, societies, and social life",
    "Employability support and global alumni network",
  ],
  "Have you applied to any other universities or countries?": [
    "Clear preference for the UK as the chosen study destination",
    "Logical and researched comparison with other destinations explored",
    "Focused and deliberate decision-making process",
  ],
  "Where will you stay in the UK?": [
    "Confirmed or planned accommodation arrangement",
    "Awareness of the accommodation's location relative to the university",
    "Safety, convenience, and preparedness for the move",
  ],
  "Do you understand UK visa rules and work rights?": [
    "Work up to 20 hours per week permitted during term time",
    "Full-time work during official university vacation periods where permitted",
    "Primary focus must remain on studies at all times",
    "Full awareness of and willingness to comply with UKVI visa conditions",
  ],
};
