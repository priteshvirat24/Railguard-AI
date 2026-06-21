"""RailGuard AI — Railway Operations Knowledge Base (RAG)"""

from __future__ import annotations
from typing import Optional
import os
import numpy as np

# Try to import FAISS; fall back to simple cosine similarity
try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

load_dotenv()


# Railway operations knowledge documents
RAILWAY_KNOWLEDGE = [
    # Safety Rules
    "SAFETY-001: Maximum platform occupancy must not exceed 85% of rated capacity. "
    "When occupancy reaches 70%, crowd management measures must be activated. "
    "At 85%, emergency protocols must be triggered including entry restriction.",

    "SAFETY-002: Minimum safe clearance between platform edge and passenger crowd is 1.5 meters. "
    "Platform marshals must enforce this clearance at all times during peak hours.",

    "SAFETY-003: Emergency evacuation routes must be kept clear at all times. "
    "Platform exits must maintain a minimum flow rate of 40 passengers per minute per meter of exit width.",

    # Platform Capacity Limits
    "CAPACITY-001: Platform 1 rated capacity: 450 passengers. Peak hour expected load: 320 passengers. "
    "Overflow threshold: 380 passengers. Critical threshold: 405 passengers.",

    "CAPACITY-002: Platform 2 rated capacity: 500 passengers. Peak hour expected load: 380 passengers. "
    "Overflow threshold: 425 passengers. Critical threshold: 450 passengers.",

    "CAPACITY-003: Platform 3 rated capacity: 500 passengers. Peak hour expected load: 350 passengers. "
    "Overflow threshold: 425 passengers. Critical threshold: 450 passengers.",

    "CAPACITY-004: Platform 4 rated capacity: 400 passengers. Peak hour expected load: 280 passengers. "
    "Overflow threshold: 340 passengers. Critical threshold: 360 passengers.",

    "CAPACITY-005: Platform 5 rated capacity: 350 passengers. Peak hour expected load: 220 passengers. "
    "Overflow threshold: 300 passengers. Critical threshold: 315 passengers.",

    "CAPACITY-006: Platform 6 rated capacity: 350 passengers. Peak hour expected load: 200 passengers. "
    "Overflow threshold: 300 passengers. Critical threshold: 315 passengers.",

    # Operating Procedures
    "OPS-001: Train holding procedure — A train may be held at platform for a maximum of 15 minutes "
    "before requiring divisional controller approval. Holding reduces platform throughput but prevents "
    "downstream crowding when departure platform is at capacity.",

    "OPS-002: Platform closure procedure — When a platform must be closed, all waiting passengers "
    "must be redirected to the nearest available platform. Announcements must be made in all three "
    "languages. Crowd marshals must be deployed at redirection points within 2 minutes.",

    "OPS-003: Overflow gate procedure — Overflow gates connect platforms to the main concourse. "
    "Opening overflow gates increases outflow by approximately 25 passengers per minute. "
    "Gates should be opened when platform occupancy exceeds 75%.",

    "OPS-004: Entry restriction procedure — Station entry can be throttled by reducing gate opening "
    "frequency. 50% restriction reduces inflow by approximately 40%. Full restriction stops all entry "
    "but may cause external crowd buildup. Duration should not exceed 20 minutes.",

    # Emergency Response Playbooks
    "EMERGENCY-001: Signal failure response — Immediately notify all approaching trains on affected track. "
    "Hold all trains at previous station. Deploy technicians within 10 minutes. Estimated repair time: "
    "15-45 minutes. Impact: Complete blockage of affected track, potential platform overcrowding.",

    "EMERGENCY-002: Mass casualty event response — Activate emergency code RED. Clear affected platform. "
    "Establish triage at concourse. Redirect all trains. Close station to new entry. "
    "Coordinate with emergency services.",

    "EMERGENCY-003: Crowd crush prevention — When density exceeds 6 persons per square meter, "
    "IMMEDIATE action required: Stop all inflow, open all overflow gates, make emergency announcements, "
    "deploy all available staff. Priority is reducing density, not maintaining schedule.",

    # Historical Incident Reports
    "INCIDENT-H001: 2024-01-15 — Platform 2 overcrowding event. Cause: simultaneous arrival of "
    "two delayed trains (Rajdhani Express and Shatabdi Express). Peak density: 92% capacity (460 passengers). "
    "Resolution: Overflow gates opened, entry restricted for 12 minutes. Recovery time: 18 minutes.",

    "INCIDENT-H002: 2024-03-22 — Signal failure on Track 2 during evening peak. Duration: 35 minutes. "
    "Impact: 4 trains delayed, Platform 2 and 3 reached warning levels. Resolution: Passengers redirected "
    "to Platform 4 and 5. One train cancelled. Recovery time: 45 minutes.",

    "INCIDENT-H003: 2024-06-08 — Platform 3 closure due to waterlogging. Duration: 2 hours. "
    "Impact: Severe overcrowding on Platform 2. Peak density reached 95% (475 passengers). "
    "Resolution: Entry restriction applied, trains rescheduled. Recovery time: 30 minutes after reopening.",

    # Crowd Management Guidelines
    "CROWD-001: Passenger flow optimization — Maintain unidirectional flow where possible. "
    "Contraflow reduces effective capacity by 40%. Deploy barriers for flow separation during peak hours.",

    "CROWD-002: Dwell time management — Average boarding time is 45 seconds per door. "
    "Train with 16 doors and 200 passengers: expected dwell time is 3-4 minutes. "
    "Delayed trains increase dwell time due to frustrated passengers.",

    "CROWD-003: Peak hour prediction — Morning peak: 0800-1000, Evening peak: 1700-1930. "
    "Festival seasons increase baseline load by 35-50%. "
    "Rain events increase platform dwell time by 20% due to slower movement.",

    # Intervention Effectiveness Data
    "INTERVENTION-001: Train holding effectiveness — Holding an approaching train for 5 minutes "
    "reduces platform density by 15-20% by allowing current passengers to clear. "
    "Trade-off: 5-minute delay propagates to 2-3 downstream trains.",

    "INTERVENTION-002: Platform redirect effectiveness — Redirecting passengers to alternate platform "
    "reduces source platform density by 20-30% within 5 minutes. "
    "Trade-off: Increases destination platform load. Requires adequate underpass capacity.",

    "INTERVENTION-003: Entry restriction effectiveness — 50% entry restriction reduces net inflow "
    "by 35-45%. Full restriction eliminates inflow but causes external buildup. "
    "Maximum recommended duration: 15 minutes for 50%, 8 minutes for full.",
]


class KnowledgeBase:
    """
    Railway Operations Knowledge Base with vector search.
    Uses FAISS for vector similarity search with OpenAI embeddings.
    Falls back to TF-IDF based similarity if FAISS/embeddings unavailable.
    """

    def __init__(self):
        self.documents = RAILWAY_KNOWLEDGE
        self._embeddings_model: Optional[OpenAIEmbeddings] = None
        self._index = None
        self._doc_embeddings: Optional[np.ndarray] = None
        self._initialized = False

    async def initialize(self):
        """Initialize the knowledge base with embeddings."""
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            print("[KnowledgeBase] No OPENAI_API_KEY — using TF-IDF fallback")
            self._init_tfidf()
            return

        try:
            self._embeddings_model = OpenAIEmbeddings(
                model="text-embedding-3-small",
                api_key=api_key,
            )
            # Embed all documents
            embeddings = await self._embeddings_model.aembed_documents(self.documents)
            self._doc_embeddings = np.array(embeddings, dtype=np.float32)

            if HAS_FAISS:
                dim = self._doc_embeddings.shape[1]
                self._index = faiss.IndexFlatIP(dim)
                # Normalize for cosine similarity
                faiss.normalize_L2(self._doc_embeddings)
                self._index.add(self._doc_embeddings)
                print(f"[KnowledgeBase] FAISS index built with {len(self.documents)} documents")
            else:
                print(f"[KnowledgeBase] Using numpy cosine similarity with {len(self.documents)} documents")

            self._initialized = True
        except Exception as e:
            print(f"[KnowledgeBase] Embedding init failed: {e} — using TF-IDF fallback")
            self._init_tfidf()

    def _init_tfidf(self):
        """Fallback: Build a simple TF-IDF index."""
        from sklearn.feature_extraction.text import TfidfVectorizer
        self._tfidf = TfidfVectorizer(stop_words="english")
        self._tfidf_matrix = self._tfidf.fit_transform(self.documents)
        self._initialized = True
        print(f"[KnowledgeBase] TF-IDF index built with {len(self.documents)} documents")

    async def search(self, query: str, top_k: int = 5) -> list[str]:
        """Search the knowledge base for relevant documents."""
        if not self._initialized:
            await self.initialize()

        if self._embeddings_model and self._doc_embeddings is not None:
            return await self._vector_search(query, top_k)
        else:
            return self._tfidf_search(query, top_k)

    async def _vector_search(self, query: str, top_k: int) -> list[str]:
        """Search using vector embeddings."""
        try:
            query_embedding = await self._embeddings_model.aembed_query(query)
            query_vec = np.array([query_embedding], dtype=np.float32)

            if self._index and HAS_FAISS:
                faiss.normalize_L2(query_vec)
                scores, indices = self._index.search(query_vec, top_k)
                return [self.documents[i] for i in indices[0] if i < len(self.documents)]
            else:
                # Numpy fallback
                from numpy.linalg import norm
                doc_norms = norm(self._doc_embeddings, axis=1, keepdims=True)
                query_norm = norm(query_vec)
                similarities = (self._doc_embeddings @ query_vec.T).flatten() / (doc_norms.flatten() * query_norm)
                top_indices = np.argsort(similarities)[-top_k:][::-1]
                return [self.documents[i] for i in top_indices]
        except Exception as e:
            print(f"[KnowledgeBase] Vector search failed: {e}")
            return self._tfidf_search(query, top_k)

    def _tfidf_search(self, query: str, top_k: int) -> list[str]:
        """Fallback TF-IDF search."""
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            query_vec = self._tfidf.transform([query])
            similarities = cosine_similarity(query_vec, self._tfidf_matrix).flatten()
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            return [self.documents[i] for i in top_indices]
        except Exception:
            return self.documents[:top_k]


# Singleton instance
knowledge_base = KnowledgeBase()
