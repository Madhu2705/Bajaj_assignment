import { useState } from "react";
import "./App.css";

const TreeView = ({ node }) => {
  if (!node || Object.keys(node).length === 0) return null;
  return (
    <ul>
      {Object.entries(node).map(([key, child]) => (
        <li key={key}>
          <span className="tree-node">{key}</span>
          <TreeView node={child} />
        </li>
      ))}
    </ul>
  );
};

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitData = async () => {
    setError("");
    setResult(null);
    const arr = input.split("\n").map((x) => x.trim()).filter(Boolean);
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: arr }),
      });
      if (!response.ok) throw new Error("Server returned an error");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Unable to reach the API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="card">
        <div className="hero">
          <div>
            <h1>BFHL Hierarchy Explorer</h1>
            <p>Enter one edge per line using the format A-&gt;B.</p>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`A->B\nA->C\nB->D`}
        />
        <div className="actions">
          <button onClick={submitData} disabled={loading}>
            {loading ? "Processing..." : "Submit"}
          </button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
      {result && (
        <div className="result-grid">
          <div className="card">
            <h2>Identity</h2>
            <p><strong>User ID:</strong> {result.user_id}</p>
            <p><strong>Email:</strong> {result.email_id}</p>
            <p><strong>Roll No:</strong> {result.college_roll_number}</p>
          </div>
          <div className="card">
            <h2>Summary</h2>
            <p><strong>Total Trees:</strong> {result.summary.total_trees}</p>
            <p><strong>Total Cycles:</strong> {result.summary.total_cycles}</p>
            <p><strong>Largest Tree Root:</strong> {result.summary.largest_tree_root || "-"}</p>
          </div>
          <div className="card">
            <h2>Invalid Entries</h2>
            {result.invalid_entries.length ? (
              <ul>{result.invalid_entries.map((item) => <li key={item}>{item || "(empty)"}</li>)}</ul>
            ) : (
              <p>None</p>
            )}
          </div>
          <div className="card">
            <h2>Duplicate Edges</h2>
            {result.duplicate_edges.length ? (
              <ul>{result.duplicate_edges.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p>None</p>
            )}
          </div>
          <div className="card card-wide">
            <h2>Hierarchies</h2>
            {result.hierarchies.length ? (
              result.hierarchies.map((item) => (
                <div className="hierarchy-card" key={item.root}>
                  <div className="hierarchy-header">
                    <h3>{item.root}</h3>
                    {item.has_cycle && <span className="cycle-tag">Cycle detected</span>}
                  </div>
                  {item.has_cycle ? (
                    <p className="cycle-info">Cycle found in this group</p>
                  ) : (
                    <>
                      <div className="tree-box">
                        <TreeView node={item.tree} />
                      </div>
                      <p><strong>Depth:</strong> {item.depth}</p>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No hierarchies found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;