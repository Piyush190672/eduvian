// One-shot probe: dump full response.content structure for one UK uni so
// we can see how the web_search tool composes blocks. Throwaway debug.
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
async function main() {
  const SYSTEM_PROMPT = `You are a careful data extractor for a UK higher-education comparison tool.
When asked about a UK university, SEARCH THE WEB for authoritative
sources (HESA, Office for Students, Discover Uni / discoveruni.gov.uk,
Complete University Guide, Universities UK, the university's own
official stats page) and return STRICTLY a JSON object with the
requested fields.
Hard rules:
- Return JSON only. No prose, no fences, no commentary.
- ALWAYS use the web_search tool — do not answer from memory.
- If a value isn't published or you can't find it on an authoritative
  source after searching, set the field to null. Never invent or estimate.`;
  const r = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 3 } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [
      {
        role: "user",
        content: `University: "Cardiff University" (UK)

Return JSON with these exact keys:
{
  "enrollment_undergrad": number|null,
  "enrollment_total": number|null,
  "tef_rating": "gold"|"silver"|"bronze"|"provisional"|null,
  "ukprn": number|null
}`,
      },
    ],
  });
  console.log("STOP_REASON:", r.stop_reason);
  console.log("CONTENT_BLOCK_TYPES:", r.content.map((b) => b.type));
  for (let i = 0; i < r.content.length; i++) {
    const b = r.content[i];
    console.log(`\n--- block ${i} (type=${b.type}) ---`);
    if (b.type === "text") {
      console.log(b.text);
    } else {
      console.log(JSON.stringify(b, null, 2).slice(0, 400));
    }
  }
  const u = r.usage as unknown as { input_tokens: number; output_tokens: number };
  console.log("\nUSAGE:", u);
}
main();
