import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function App() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requirement.trim()) return;

    setLoading(true);
    setResponse(null);
    setError("");

    try {
		const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/estimate`, {

        requirement,
      });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">🧠 Effort Estimation Agent</h1>
        <p className="text-gray-400 text-sm">
          Powered by RAG + LLM (LangChain + GPT-4o-mini)
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-xl p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <textarea
          className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none h-40"
          placeholder="Enter your software project requirement..."
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
        />
        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold disabled:opacity-50 transition"
          >
            {loading ? "Analyzing..." : "Estimate Effort"}
          </button>
        </div>
      </motion.form>

      {error && (
        <div className="mt-4 text-red-400 font-semibold">{error}</div>
      )}

      {loading && (
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mt-8 text-gray-400"
        >
          🤖 Thinking...
        </motion.div>
      )}

      {response && (
        <motion.div
          className="mt-8 max-w-3xl bg-gray-800 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-3 text-blue-400">Estimation Result:</h2>
          <p className="text-gray-200 whitespace-pre-line">{response.estimate}</p>

          {response.sources && response.sources.length > 0 && (
            <div className="mt-6 border-t border-gray-700 pt-4">
              <h3 className="font-semibold text-gray-300 mb-2">
                🔍 Referenced Past Projects:
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-400">
                {response.sources.map((src, idx) => (
                  <li key={idx}>
                    {src.metadata?.source || "Unknown source"} —{" "}
                    <span className="italic">
                      {src.snippet?.slice(0, 100)}...
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
