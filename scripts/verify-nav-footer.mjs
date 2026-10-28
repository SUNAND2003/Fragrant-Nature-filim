/**
 * Dumps the footer's "Navigation" column from a real browser session.
 * Usage: node scripts/verify-nav-footer.mjs
 */
const DEBUG_PORT = 9337;
const SITE = "http://localhost:5173";

const chrome = await import("node:child_process");
const proc = chrome.spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${process.env.TEMP}/fn-chrome-nav-footer`,
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
await sleep(2500);

const report = await evaluate(`(() => {
  const heading = [...document.querySelectorAll("h4")].find(
    (h) => h.textContent.trim().toLowerCase() === "navigation",
  );
  if (!heading) return JSON.stringify({ error: "footer Navigation heading not found" });
  const col = heading.closest("div");
  const links = [...col.querySelectorAll("a")]
    .map((a) => ({ text: a.innerText.trim().replace(/\\s+/g, " "), href: a.getAttribute("href") }))
    .filter((l) => l.text);
  return JSON.stringify({ footerLinks: links }, null, 1);
})()`);

console.log("--- footer Navigation column (", SITE, ") ---");
console.log(report);

ws.close();
proc.kill();
process.exit(0);
