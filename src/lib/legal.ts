import { readFile } from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

// The combined About/Terms/Privacy page renders this doc as its source
// of truth — content stays editable markdown, not JSX, matching the
// listing-studio/when-we-meet portfolio pattern. Before any real deploy,
// the Dockerfile must copy docs/legal into the runtime image alongside
// the build output (see HANDOVER).
const DOC_PATH = path.join(process.cwd(), "docs", "legal", "about-terms-privacy.md");

export async function legalDocHtml(): Promise<string> {
  const markdown = await readFile(DOC_PATH, "utf8");
  return marked.parse(markdown, { async: false });
}
