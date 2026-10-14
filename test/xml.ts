// A small XML reader for the tests: the markup a drawing writes, as a tree of nodes with attributes and text. It reads what the package writes (quoted attributes,
// no CDATA, no processing instructions) and throws on markup that does not nest.
export interface Node {
  name: string;
  attrs: Record<string, string>;
  children: Node[];
  /** The text of the node and everything under it. */
  text: string;
}

const unescape = (s: string): string => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

export function parseXml(xml: string): Node {
  const root: Node = { name: "#root", attrs: {}, children: [], text: "" };
  const stack: Node[] = [root];
  const token = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  for (let m = token.exec(xml); m; m = token.exec(xml)) {
    if (m[5] !== undefined) {
      const text = unescape(m[5]);
      for (const n of stack) n.text += text;
      continue;
    }
    if (m[1]) {
      const closed = stack.pop();
      if (!closed || closed.name !== m[2]) throw new Error(`</${m[2]}> closes <${closed?.name}>`);
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of m[3].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = unescape(a[2] ?? "");
    const node: Node = { name: m[2], attrs, children: [], text: "" };
    stack[stack.length - 1].children.push(node);
    if (!m[4]) stack.push(node);
  }
  if (stack.length !== 1) throw new Error(`unclosed <${stack.at(-1)?.name}>`);
  const only = root.children;
  if (only.length !== 1) throw new Error("not one root element");
  return only[0];
}

/** Every node under (and including) `node`, in document order. */
export function walk(node: Node): Node[] {
  return [node, ...node.children.flatMap(walk)];
}

/** The nodes that carry a class. */
export function withClass(node: Node, cls: string): Node[] {
  return walk(node).filter((n) => (n.attrs.class ?? "").split(/\s+/).includes(cls));
}

/** How many of each element and class a drawing is made of: its structure, for a snapshot. */
export function structure(xml: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of walk(parseXml(xml))) {
    const key = node.attrs.class === undefined ? node.name : `${node.name}.${node.attrs.class.split(/\s+/).sort().join(".")}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => (a < b ? -1 : 1)));
}
