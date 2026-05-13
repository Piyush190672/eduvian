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

/**
 * PDF text extraction with a two-stage fallback chain (13 May 2026, after
 * users reported "Could not extract text" on real CVs).
 *
 *  1. pdf-parse v2 (PDFParse class). Fastest and simplest.
 *  2. pdfjs-dist legacy build, called directly with workers disabled.
 *     This is the engine pdf-parse wraps, but using it directly skips
 *     the worker-spawn path that occasionally fails on serverless /
 *     Next.js runtimes.
 *
 * Either path can yield "" — that's a valid result for image-only PDFs
 * (text rasterised, no extractable text layer). The caller surfaces a
 * distinct error in that case.
 */
async function extractPdfText(data: Uint8Array): Promise<string> {
  // ── Path 1: pdf-parse v2 ─────────────────────────────────────────────
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data });
    const r = await parser.getText();
    const text = r.text ?? r.pages?.map((p: { text: string }) => p.text).join("\n") ?? "";
    if (text.trim().length > 0) return text;
    // Empty result — fall through to path 2 in case the wrapper choked
    // on a quirk pdfjs handles directly.
  } catch (err) {
    // Log so the diagnostic shows up in Sentry / dev console rather than
    // being swallowed by the outer catch. Continue to fallback.
    console.warn("[extract-text] pdf-parse failed, trying pdfjs-dist fallback:", (err as Error)?.message);
  }

  // ── Path 2: pdfjs-dist (legacy build, worker disabled) ──────────────
  // Used when pdf-parse throws OR returns empty (some quirky PDFs do
  // both). The legacy build is the Node-safe variant; standard build
  // assumes browser globals and crashes on cold-start. We feed the
  // ArrayBuffer (not the Uint8Array view) because postMessage cloning
  // can otherwise fail with "Unable to deserialize cloned data".
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs") as typeof import("pdfjs-dist/legacy/build/pdf.mjs") & { GlobalWorkerOptions?: { workerSrc?: string } };
    // Point pdfjs at the bundled worker file. Empty workerSrc throws
    // "No 'GlobalWorkerOptions.workerSrc' specified" — disableWorker
    // isn't surfaced on the loading-task API, so we point at the worker
    // shipped in node_modules instead.
    if (pdfjs.GlobalWorkerOptions) {
      const { createRequire } = await import("node:module");
      const req = createRequire(import.meta.url);
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = req.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
      } catch {
        // require.resolve fails in some bundles — pdfjs will use a fake worker.
      }
    }
    // Copy into a fresh ArrayBuffer to avoid postMessage cloning issues
    // with shared-buffer views.
    const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
    const loadingTask = pdfjs.getDocument({
      data: ab,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
    } as Parameters<typeof pdfjs.getDocument>[0]);
    const pdf = await loadingTask.promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it) => ("str" in it && typeof it.str === "string" ? it.str : ""))
        .join(" ");
      pages.push(pageText);
    }
    return pages.join("\n\n");
  } catch (err) {
    console.error("[extract-text] pdfjs-dist fallback also failed:", (err as Error)?.message);
    // Re-throw so the route's outer catch returns the user-facing error.
    throw err;
  }
}

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
      text = await extractPdfText(new Uint8Array(buffer));
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
      // Distinguish image-only PDFs from corrupt / non-PDFs in the message —
      // the typical Canva/Word "export as PDF" with rasterised text lands
      // here, and the actionable hint is to re-export with the text layer
      // preserved (or paste the content directly).
      return NextResponse.json(
        {
          error:
            ext === "pdf"
              ? "This PDF doesn't have a selectable text layer (e.g. it was exported as image, scanned, or rasterised). Re-export with text preserved, or paste your CV / SOP content into the box below."
              : "No readable text found in this file. Try copying and pasting the content instead.",
        },
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
