import { AI_FILES, SITE_URL } from "@/lib/seo/config";
import { TEXT_HEADERS } from "@/lib/seo/llms";

// https://site.spawning.ai/spawning-ai-txt
export function GET() {
  const body = `# ai.txt — AI content permissions for HomeLoop: all text and images may be used.
User-Agent: *
Allow: /

# Context for AI assistants: ${SITE_URL}${AI_FILES.llms}
# Full context: ${SITE_URL}${AI_FILES.llmsFull}
`;
  return new Response(body, { headers: TEXT_HEADERS });
}
