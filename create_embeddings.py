import os
import json
from tqdm import tqdm
from nomic import embed, login
import chromadb

# ==== CONFIG ====
INPUT_JSON = "software_projects_500.json"
DB_DIR = "chroma_db"
COLLECTION_NAME = "effort_estimation"
TEXT_FIELDS = ["title", "requirements", "notes"]
MODEL = "nomic-embed-text-v1.5"
BATCH_SIZE = 50
CHECKPOINT_FILE = "embedding_checkpoint.json"
CHUNK_SIZE = 300  # tokens approximation
CHUNK_OVERLAP = 50

# ==== VERIFY TOKEN ====
api_token = os.getenv("NOMIC_API_TOKEN")
print("🔑 NOMIC_API_TOKEN detected:", bool(api_token))
if not api_token:
    raise ValueError("❌ No NOMIC_API_TOKEN found! Please set it using: setx NOMIC_API_TOKEN <your_token>")

# Authenticate programmatically
login(api_token)
print("✅ Authenticated with Nomic API.")

# ==== LOAD DATA ====
with open(INPUT_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)
print(f"✅ Loaded {len(data)} records from {INPUT_JSON}")

# ==== HELPER FUNCTIONS ====
def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap  # overlap to preserve context
    return chunks

# ==== PREPARE DOCUMENTS ====
documents, ids, metadatas = [], [], []
for item in data:
    combined_text = " ".join([item.get(field, "") for field in TEXT_FIELDS]).strip()
    text_chunks = chunk_text(combined_text)
    for idx, chunk in enumerate(text_chunks):
        documents.append(chunk)
        ids.append(f"{item['id']}_{idx}")
        metadatas.append({
            "source": item.get("source", ""),
            "tags": ", ".join(item.get("tags", [])) if isinstance(item.get("tags", []), list) else str(item.get("tags", "")),
            "confidence": float(item.get("confidence", 1.0)) if item.get("confidence") is not None else 1.0,
            "effort_hours": item.get("effort_hours", None),
            "project_id": item['id']
        })

print(f"✅ Prepared {len(documents)} chunks from {len(data)} projects")

# ==== INIT CHROMA ====
client = chromadb.PersistentClient(path=DB_DIR)
collection = client.get_or_create_collection(name=COLLECTION_NAME)

# ==== LOAD CHECKPOINT ====
if os.path.exists(CHECKPOINT_FILE):
    with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
        completed_ids = set(json.load(f))
    print(f"⏩ Resuming from checkpoint: {len(completed_ids)} embeddings already stored")
else:
    completed_ids = set()

# ==== EMBEDDING GENERATION ====
print(f"🔹 Generating embeddings in batches of {BATCH_SIZE} using {MODEL}")

for i in tqdm(range(0, len(documents), BATCH_SIZE), desc="Embedding progress"):
    batch_docs = documents[i:i + BATCH_SIZE]
    batch_ids = ids[i:i + BATCH_SIZE]
    batch_meta = metadatas[i:i + BATCH_SIZE]

    if set(batch_ids).issubset(completed_ids):
        continue

    try:
        response = embed.text(texts=batch_docs, model=MODEL)
        embeddings = response["embeddings"]

        collection.add(
            documents=batch_docs,
            embeddings=embeddings,
            ids=batch_ids,
            metadatas=batch_meta
        )

        completed_ids.update(batch_ids)
        with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
            json.dump(list(completed_ids), f, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"⚠️ Error embedding batch {i//BATCH_SIZE + 1}: {e}")
        continue

print(f"✅ Completed embedding generation. Total stored: {len(completed_ids)} items.")
print(f"💾 Embeddings saved persistently in {DB_DIR}/{COLLECTION_NAME}")
