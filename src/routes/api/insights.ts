import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/insights")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { context } = (await request.json()) as { context: string };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        try {
          const { text } = await generateText({
            model,
            system:
              "You are a senior business analyst. Given a dataset profile, produce an executive brief.",
            prompt: `Analyze this dataset and produce:
1. A one-paragraph **Executive Summary** a CEO can grasp.
2. **Top 5 Insights** as a bullet list, each with a number and a takeaway.
3. **3 Risks / Anomalies** you can infer from stats (outliers, missing, imbalance).
4. **3 Actionable Recommendations**.

Use crisp markdown. No preamble.

DATASET:
${context}`,
          });
          return Response.json({ text });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "AI request failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
