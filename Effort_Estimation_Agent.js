import express from "express";
import bodyParser from "body-parser";
import { PromptTemplate } from "@langchain/core/prompts";
import { RetrievalQAChain } from "langchain/chains";
import { ChatOpenAI } from "@langchain/openai";
import { initChromaCollection, queryDocuments } from "./chromaHelper.js";
import cors from "cors";

const PORT = process.env.PORT || 5000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL_NAME = process.env.MODEL_NAME || "openai/gpt-4o-mini";

if (!OPENROUTER_API_KEY) {
  console.error("❌ Missing OPENROUTER_API_KEY environment variable.");
  process.exit(1);
}

// -----------------------------
// Create the RAG + LLM chain
// -----------------------------
async function createChain(chromaObjects) {
  const retriever = {
    async getRelevantDocuments(query, userEffortHours = null) {
      const docs = await queryDocuments(chromaObjects, query, 3, userEffortHours);

      console.log("\n📄 Retrieved Documents for Query:");
      docs.forEach((doc, idx) => {
        console.log(`\n[${idx + 1}] Score: ${doc.finalScore.toFixed(4)}`);
        console.log("Metadata:", doc.metadata);
        console.log(`Snippet: ${doc.text?.slice(0, 150)}...`);
      });

      return docs;
    },
  };

  const llm = new ChatOpenAI({
    modelName: MODEL_NAME,
    temperature: 0.2,
    openAIApiKey: OPENROUTER_API_KEY,
    configuration: { baseURL: OPENROUTER_BASE_URL },
  });

const promptTemplate = new PromptTemplate({
  template: `
You are an expert software project estimator in the era of AI.
You will ONLY use the retrieved context (past projects) below to answer the user's request.
Do NOT add any assumptions or invent estimates beyond what the retrieved projects show.

Context (relevant past projects):
{context}

User Requirement:
{query}

Instructions:
- Provide a realistic effort estimate in hours or days based ONLY on the context.
- Only include work areas present in the retrieved documents.
- Developers today leverage AI tools to speed up their work; consider which AI tools could help reduce effort for this requirement.
- Suggest relevant AI tools for each work area based on the user’s requirement (e.g., frontend design, testing, automation, code generation), but do NOT invent unrelated tools.
- Give a confidence level (Low/Medium/High) and justify briefly.
- Keep your response concise, professional, and strictly aligned with the context.

Answer format:
Estimate: <hours/days>
Work Areas: <list of work areas with estimated hours>
AI Tools: <list of relevant AI tools for each work area>
Confidence: <Low/Medium/High>
Justification: <1-2 sentences>
`,
  inputVariables: ["context", "query"],
});

  return RetrievalQAChain.fromLLM(llm, retriever, {
    returnSourceDocuments: true,
    prompt: promptTemplate,
  });
}

// -----------------------------
// Express API
// -----------------------------
async function main() {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  console.log("🚀 Initializing Effort Estimation Agent...");

  const chromaObjects = await initChromaCollection();
  const chain = await createChain(chromaObjects);

  console.log(`✅ Connected to ChromaDB at: ${process.env.CHROMA_PERSIST_DIR || "./chroma_db"}`);
  console.log(`✅ Using model: ${MODEL_NAME}`);
  console.log(`✅ Using Nomic embeddings for retrieval.`);
  console.log(`✅ Effort Estimation Agent running on http://localhost:${PORT}`);

  app.post("/api/estimate", async (req, res) => {
    try {
      const { requirement, roughEffortHours } = req.body;
      if (!requirement || typeof requirement !== "string") {
        return res.status(400).json({ error: "requirement (string) is required" });
      }

      console.log("\n🟦 Incoming requirement:", requirement);

      // Retrieve top documents first for logging
      const docs = await chain.retriever.getRelevantDocuments(requirement, roughEffortHours);

      // Let the chain handle context injection internally
      const result = await chain.call({ query: requirement });

      // LangChain may return { text } or { output_text } depending on version
      const estimateText = result.text || result.output_text || result;

      console.log("\n🤖 Model Response:");
      console.log(estimateText);

      res.json({
        estimate: estimateText,
        sources: docs.map((d) => ({
          id: d.id || null,
          metadata: d.metadata,
          snippet: d.text?.slice(0, 300),
        })),
      });
    } catch (err) {
      console.error("❌ Error during estimation:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`✅ Server is live at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("❌ Startup error:", err);
  process.exit(1);
});
