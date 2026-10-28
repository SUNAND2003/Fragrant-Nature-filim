/**
 * End-to-end check that the public menu follows the admin/backend:
 *   1. rename "Movies" → "Films" and hide "Gallery" through the API,
 *   2. open the real site menu in headless Chrome and report what's rendered,
 *   3. restore both changes.
 * Usage: node scripts/verify-nav-live.mjs
 */
const DEBUG_PORT = 9336;
const SITE = "http://localhost:5173";

const login = await fetch(`${SITE}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin", password: "admin1234" }),
}).then((r) => r.json());
if (!login.token) throw new Error("login failed: " + JSON.stringify(login));
const auth = {
  Authorization: `Bearer ${login.token}`,
  "Content-Type": "application/json",
};

const list = await fetch(`${SITE}/api/navigation?all=true`, { headers: auth }).then((r) =>
  r.json(),
);
const movies = list.find((i) => i.to === "/films");
const gallery = list.find((i) => i.to === "/gallery");
if (!movies || !gallery) throw new Error("expected menu items not found");

const restore = [];
try {
  await fetch(`${SITE}/api/navigation/${movies._id}`, {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ label: "Films" }),
  });
  restore.push({ id: movies._id, body: { label: "Movies" } });
  await fetch(`${SITE}/api/navigation/${gallery._id}`, {
    method: "PUT",
    headers: auth,
    body: JSON.stringify({ visible: false }),
  });
  restore.push({ id: gallery._id, body: { visible: true } });

  // --- render the public menu in a real browser ---
  const chrome = await import("node:child_process");
  const proc = chrome.spawn(
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${process.env.TEMP}/fn-chrome-nav-live`,
      "--window-size=1440,900",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let target;
  for (let i = 0; i < 40; i++) {
    try {
      const found = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`).then((r) => r.json());
      target = found.find((t) => t.type === "page");
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
  await evaluate(`document.querySelector('button[aria-label="Menu"]')?.click()`);
  await sleep(1000);

  const report = await evaluate(`(() => {
    const overlay = [...document.querySelectorAll("div")].find((d) =>
      d.className.includes("my-auto flex w-full max-w-2xl"),
    );
    if (!overlay) return JSON.stringify({ error: "menu container not found" });
    const items = [...overlay.querySelectorAll("a")]
      .map((a) => ({ text: a.innerText.trim().replace(/\\s+/g, " "), href: a.getAttribute("href") }))
      .filter((l) => l.text);
    return JSON.stringify({ menuItems: items }, null, 1);
  })()`);

  console.log("--- public menu with 'Movies' renamed to 'Films' and 'Gallery' hidden ---");
  console.log(report);

  ws.close();
  proc.kill();
} finally {
  // Always put the menu back the way it was.
  for (const entry of restore) {
    await fetch(`${SITE}/api/navigation/${entry.id}`, {
      method: "PUT",
      headers: auth,
      body: JSON.stringify(entry.body),
    });
  }
  console.log("restored:", JSON.stringify(restore.map((r) => r.body)));
}

process.exit(0);
