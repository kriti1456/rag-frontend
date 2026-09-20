import { useState } from "react";

const API_URL = "https://rag-wsb2.onrender.com";

function App() {
  const [file, setFile] = useState(null);
  const [strategy, setStrategy] = useState("recursive");
  const [documentPath, setDocumentPath] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [confidence, setConfidence] = useState(null);
  const [latency, setLatency] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function uploadDocument() {
    if (!file) {
      setMessage("Please select a document first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Upload failed");
      }

      setDocumentPath(data.document_path);
      setMessage(`Uploaded: ${data.filename}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function ingestDocument() {
    if (!documentPath) {
      setMessage("Upload a document first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_path: documentPath,
          strategy: strategy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ingestion failed");
      }

      setMessage(`Ingestion complete. ${data.chunks_indexed || 0} chunks indexed.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function askQuestion() {
    if (!question.trim()) {
      setMessage("Enter a question first.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);
    setConfidence(null);
    setLatency(null);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/v1/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Question failed");
      }

      setAnswer(data.answer || "");
      setSources(data.sources || []);
      setConfidence(data.confidence ?? null);
      setLatency(data.latency_ms ?? null);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>RAG Document Assistant</h1>
        <p>Upload documents, index them, and ask questions.</p>
      </header>

      <section className="card">
        <h2>1. Upload Document</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={uploadDocument} disabled={loading}>
          Upload
        </button>
      </section>

      <section className="card">
        <h2>2. Ingest Document</h2>

        <label>Chunking strategy:</label>

        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
        >
          <option value="fixed">Fixed</option>
          <option value="recursive">Recursive</option>
          <option value="semantic">Semantic</option>
        </select>

        <button onClick={ingestDocument} disabled={loading}>
          Ingest
        </button>
      </section>

      <section className="card">
        <h2>3. Ask a Question</h2>

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about your documents..."
          rows="4"
        />

        <button onClick={askQuestion} disabled={loading}>
          Ask
        </button>
      </section>

      {loading && <p className="status">Processing...</p>}

      {message && <p className="status">{message}</p>}

      {answer && (
        <section className="card">
          <h2>Answer</h2>

          <p>{answer}</p>

          {confidence !== null && (
            <p>
              <strong>Confidence:</strong> {confidence}
            </p>
          )}

          {latency !== null && (
            <p>
              <strong>Latency:</strong> {latency} ms
            </p>
          )}
        </section>
      )}

      {sources.length > 0 && (
        <section className="card">
          <h2>Sources</h2>

          {sources.map((source, index) => (
            <div className="source" key={source.id || index}>
              <strong>{source.title || source.id}</strong>

              {source.page !== null && source.page !== undefined && (
                <p>Page: {source.page}</p>
              )}

              {source.chunk_index !== null &&
                source.chunk_index !== undefined && (
                  <p>Chunk: {source.chunk_index}</p>
                )}

              {source.strategy && <p>Strategy: {source.strategy}</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default App;