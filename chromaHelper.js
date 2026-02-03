// chromaHelper.js
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { NomicEmbeddings } from "@langchain/nomic";

const COLLECTION_NAME = process.env.COLLECTION_NAME || "effort_estimation";
const CHROMA_PERSIST_DIR = process.env.CHROMA_PERSIST_DIR || "./chroma_db";
const NOMIC_API_TOKEN = process.env.NOMIC_API_TOKEN;

if (!NOMIC_API_TOKEN) {
  throw new Error("❌ Missing NOMIC_API_TOKEN environment variable.");
}

/**
 * Initialize ChromaDB collection with Nomic embeddings
 */
export async function initChromaCollection() {
  const embeddings = new NomicEmbeddings({
    apiKey: NOMIC_API_TOKEN,
    modelName: "nomic-embed-text-v1.5",
  });

  const vectorStore = await Chroma.fromExistingCollection(embeddings, {
    collectionName: COLLECTION_NAME,
    persistDirectory: CHROMA_PERSIST_DIR,
  });

  const rawCollection = vectorStore.collection;

  console.log(`✅ Initialized Chroma collection: ${COLLECTION_NAME}`);
  return { vectorStore, rawCollection };
}

/**
 * Query top-k relevant documents with custom ranking
 * @param {{ vectorStore: any, rawCollection: any }} chromaObjects
 * @param {string} queryText
 * @param {number} k
 * @param {number|null} userEffortHours
 */
export async function queryDocuments(chromaObjects, queryText, k = 5, userEffortHours = null) {
  const { rawCollection } = chromaObjects;

  const embeddings = new NomicEmbeddings({
    apiKey: NOMIC_API_TOKEN,
    modelName: "nomic-embed-text-v1.5",
  });

  const queryVector = await embeddings.embedQuery(queryText);

  // Get more candidates to allow smart re-ranking
  const queryResponse = await rawCollection.query({
    queryEmbeddings: [queryVector],
    nResults: 20,
    where: null,
  });

  let results = queryResponse.documents[0].map((docText, i) => {
    const metadata = queryResponse.metadatas[0][i];
    return {
      id: queryResponse.ids[0][i],
      text: docText,
      metadata: {
        ...metadata,
        score: queryResponse.distances[0][i], // semantic similarity
      },
    };
  });

  // Custom scoring: semantic similarity + confidence + effort match
  results = results.map((r) => {
    let effortMatch = 0;
    if (userEffortHours && r.metadata.effort_hours) {
      effortMatch =
        1 -
        Math.min(
          Math.abs(userEffortHours - r.metadata.effort_hours) /
            Math.max(userEffortHours, r.metadata.effort_hours),
          1
        );
    }
    const finalScore =
      0.6 * r.metadata.score + 0.3 * (r.metadata.confidence ?? 0.5) + 0.1 * effortMatch;
    return { ...r, finalScore };
  });

  // Sort descending by finalScore
  results.sort((a, b) => b.finalScore - a.finalScore);

  return results.slice(0, k);
}
