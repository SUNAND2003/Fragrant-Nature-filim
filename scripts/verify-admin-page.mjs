/**
 * Signs in to the admin panel over CDP, opens a given admin route and reports
 * what is rendered (headings, links, list rows).
 * Usage: node scripts/verify-admin-page.mjs /admin/categories
 */
const DEBUG_PORT = 9335;
const SITE = "http://localhost:5173";
const ROUTE = process.argv[2] || "/admin/categories";

const login = await fetch(`${SITE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin", password: "admin1234" }),
}).then((r) => r.json());
if (!login.token) throw new Error("login failed: " + JSON.stringify(login));

const chrome = await import("node:child_process");
const proc = chrome.spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${process.env.TEMP}/fn-chrome-admin-page`,
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 40; i++) {
  try {
    const list = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json());
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch {
    /* chrome not up yet */
  }
  await sleep(250);
}
if (!target) throw new Error("no CDP target");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let id = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
const evaluate = async (expression) => {
  const { result } = await send("Runtime.evaluate", { expression, returnByValue: true });
  return result.value;
};

await send("Page.enable");
await send("Page.navigate", { url: `${SITE}/` });
await sleep(1500);
await evaluate(`localStorage.setItem("fn-admin-token", ${JSON.stringify(login.token)})`);
await send("Page.navigate", { url: `${SITE}${ROUTE}` });
await sleep(2500);

const report = await evaluate(`(() => {
  const main = document.querySelector("main") || document.body;
  const headings = [...main.querySelectorAll("h1,h2,h3,p")].slice(0, 40).map((h) => h.innerText.trim()).filter(Boolean);
  const links = [...main.querySelectorAll("a")].map((a) => ({ text: a.innerText.trim(), href: a.getAttribute("href") })).filter((l) => l.text);
  const rows = [...main.querySelectorAll("ul li, ul > div, [class*='border-border']")].length;
  return JSON.stringify({ headings: [...new Set(headings)], links, roughRowCount: rows }, null, 1);
})()`);

console.log("--- admin route:", ROUTE, "---");
console.log(report);

ws.close();
proc.kill();
process.exit(0);
