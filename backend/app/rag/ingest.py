import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.rag.embeddings import embedding_engine
from app.rag.store import vector_store

# Ensure we are looking at the correct directory
DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")

def run_ingestion():
    print("🚀 Starting Production Ingestion...")
    
    # Clear existing collection to avoid duplicates or old data
    try:
        count = vector_store.collection.count()
        if count > 0:
            print(f"🧹 Clearing {count} old records...")
            # ChromaDB doesn't have a simple 'clear', we just delete the collection and recreate
            vector_store.client.delete_collection("weather_rag")
            vector_store.collection = vector_store.client.get_or_create_collection("weather_rag")
    except Exception:
        pass

    all_chunks = []
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    # 1. Load every file in the documents folder
    if not os.path.exists(DOCS_DIR):
        print(f"❌ Documents directory not found at {DOCS_DIR}")
        return

    files = [f for f in os.listdir(DOCS_DIR) if f.endswith(".txt")]
    for filename in files:
        file_path = os.path.join(DOCS_DIR, filename)
        print(f"📄 Processing: {filename}")
        with open(file_path, "r") as f:
            text = f.read()
            chunks = splitter.split_text(text)
            all_chunks.extend(chunks)

    if not all_chunks:
        print("❌ No chunks created. Check your .txt files.")
        return

    # 2. Add to Vector DB using our modular components
    print(f"🧠 Generating embeddings and saving to VectorDB...")
    
    for i, chunk in enumerate(all_chunks):
        embedding = embedding_engine.encode(chunk)
        vector_store.collection.add(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"chunk_{i}"]
        )

    print(f"✅ Ingestion Complete! {len(all_chunks)} chunks added to 'weather_rag'.")

if __name__ == "__main__":
    run_ingestion()