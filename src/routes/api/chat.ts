import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

interface ChatBody {
  messages?: UIMessage[];
  datasetContext?: string;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, datasetContext } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system = `You are Lumen, an expert AI Data Analyst. You answer questions about the user's uploaded dataset with concise, actionable insights.
Rules:
- Use only the dataset context provided; never invent numbers.
- Prefer short, structured answers with markdown (bullets, small tables).
- When asked for predictions/trends, reason from the summary statistics.
- If the data cannot answer a question, say so directly.

DATASET CONTEXT:
${datasetContext ?? "(no dataset uploaded yet — ask the user to upload one)"}`;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
