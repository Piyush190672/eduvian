import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp, aiToolLimit } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";

export const maxDuration = 30;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = new Set([
  "text/plain",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(req: NextRequest) {
  try {
    // Read & verify cookie BEFORE parsing FormData (cheaper rejection path).
    const user = await getUserFromRequest(req);
    const gate = await checkBetaAccess(user?.email ?? null, "extract-text");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason },
        { status: gate.reason === "no_user" ? 401 : 403 }
      );
    }
    const limited = await aiToolLimit(req, "extract-text", user?.email, { limit: 20 });
    if (limited) return limited;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // ── 10 MB cap ─────────────────────────────────────────────────────────
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    // ── MIME-type allowlist ───────────────────────────────────────────────
    // Browsers occasionally omit `type` — fall back to extension check below.
    if (file.type && !ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .txt, .pdf, or .docx file." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = "";

    if (ext === "txt") {
      text = buffer.toString("utf-8");
    } else if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text ?? result.pages?.map((p: { text: string }) => p.text).join("\n") ?? "";
    } else if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a .txt, .pdf, or .docx file." },
        { status: 400 }
      );
    }

    // Normalise whitespace
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "No readable text found in this file. Try copying and pasting the content instead." },
        { status: 422 }
      );
    }

    if (user) await logToolUsage(user.email, "extract-text", getClientIp(req.headers));
    return NextResponse.json({ text });
  } catch (err) {
    return apiErrorResponse(
      err,
      { route: "extract-text" },
      "Could not extract text from this file. Please paste the content manually."
    );
  }
}
