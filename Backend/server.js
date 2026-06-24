const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const isValidEdge = (entry) => /^[A-Z]->[A-Z]$/.test(entry) && entry[0] !== entry[3];
const buildComponent = (start, graph, reverse) => {
  const component = new Set([start]);
  const stack = [start];
  while (stack.length) {
    const node = stack.pop();
    for (const child of graph[node] || []) {
      if (!component.has(child)) {
        component.add(child);
        stack.push(child);
      }
    }
    for (const parent of reverse[node] || []) {
      if (!component.has(parent)) {
        component.add(parent);
        stack.push(parent);
      }
    }
  }
  return component;
};
const detectCycle = (start, graph) => {
  const visiting = new Set();
  const visited = new Set();
  let found = false;
  const dfs = (node) => {
    if (found) return;
    if (visiting.has(node)) {
      found = true;
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    for (const child of graph[node] || []) {
      dfs(child);
      if (found) return;
    }
    visiting.delete(node);
    visited.add(node);
  };
  dfs(start);
  return found;
};
const buildTree = (node, graph) => {
  const result = {};
  for (const child of (graph[node] || []).slice().sort()) {
    result[child] = buildTree(child, graph);
  }
  return result;
};
const getDepth = (node, graph) => {
  const children = graph[node] || [];
  if (!children.length) return 1;
  let max = 0;
  for (const child of children) {
    max = Math.max(max, getDepth(child, graph));
  }
  return max + 1;
};

app.post("/bfhl", (req, res) => {
  const data = Array.isArray(req.body.data) ? req.body.data : [];
  const invalid_entries = [];
  const duplicate_edges = [];
  const uniqueEdges = [];
  const seen = new Set();
  for (const raw of data) {
    const entry = typeof raw === "string" ? raw.trim() : "";
    if (!isValidEdge(entry)) {
      invalid_entries.push(entry);
      continue;
    }
    if (seen.has(entry)) {
      if (!duplicate_edges.includes(entry)) duplicate_edges.push(entry);
      continue;
    }
    seen.add(entry);
    uniqueEdges.push(entry);
  }

  const graph = {};
  const reverse = {};
  const childParent = {};
  const nodes = new Set();
  for (const edge of uniqueEdges) {
    const [parent, child] = edge.split("->");
    nodes.add(parent);
    nodes.add(child);
    if (childParent[child]) continue;
    childParent[child] = parent;
    graph[parent] = graph[parent] || [];
    graph[parent].push(child);
    reverse[child] = reverse[child] || [];
    reverse[child].push(parent);
    reverse[parent] = reverse[parent] || [];
  }
  for (const node of nodes) {
    graph[node] = graph[node] || [];
    reverse[node] = reverse[node] || [];
  }

  const roots = [...nodes].filter((node) => !childParent[node]);
  const hierarchies = [];
  const seenGroup = new Set();
  let total_trees = 0;
  let total_cycles = 0;
  let largestDepth = 0;
  let largest_tree_root = "";

  const processRoot = (root) => {
    const component = buildComponent(root, graph, reverse);
    component.forEach((node) => seenGroup.add(node));
    const cycle = detectCycle(root, graph);
    if (cycle) {
      total_cycles += 1;
      hierarchies.push({ root, tree: {}, has_cycle: true });
      return;
    }
    const tree = { [root]: buildTree(root, graph) };
    const depth = getDepth(root, graph);
    total_trees += 1;
    if (depth > largestDepth || (depth === largestDepth && (!largest_tree_root || root < largest_tree_root))) {
      largestDepth = depth;
      largest_tree_root = root;
    }
    hierarchies.push({ root, tree, depth });
  };

  for (const root of roots) {
    if (!seenGroup.has(root)) processRoot(root);
  }

  const remaining = [...nodes].filter((node) => !seenGroup.has(node));
  const handled = new Set();
  for (const node of remaining) {
    if (handled.has(node)) continue;
    const component = buildComponent(node, graph, reverse);
    component.forEach((current) => handled.add(current));
    const root = [...component].sort()[0];
    if (!seenGroup.has(root)) processRoot(root);
  }

  const response = {
    user_id: "madhu_231024",
    email_id: "madhu2056.be23@chitkara.edu.in",
    college_roll_number: "2310992056",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root,
    },
  };
  res.json(response);
});

app.listen(process.env.PORT || 5000);
