/**
 * Drives headless Chrome over CDP to view the admin panel as a signed-in admin
 * and dump the rendered DOM, so the sidebar's black background + logo can be
 * verified from actual output instead of source reading.
 * Usage: node scripts/verify-admin-ui.mjs
 */
const DEBUG_PORT = 9333;
const SITE = "http://localhost:5173";

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
    `--user-data-dir=${process.env.TEMP}/fn-chrome-profile`,
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

await send("Page.enable");

// Land on the origin first so localStorage is scoped to it, then sign in.
await send("Page.navigate", { url: `${SITE}/` });
await sleep(1500);
await send("Runtime.evaluate", {
  expression: `localStorage.setItem("fn-admin-token", ${JSON.stringify(login.token)})`,
});
await send("Page.navigate", { url: `${SITE}/admin` });
await sleep(2500);

const { result } = await send("Runtime.evaluate", {
  expression: "document.documentElement.outerHTML",
  returnByValue: true,
});
const html = result.value ?? "";

const probes = [
  ["<aside", "sidebar renders"],
  ["bg-black", "sidebar is black"],
  ["theme-dark", "dark palette scoped to sidebar"],
  ['alt="Fragrant Nature Film Creations"', "logo image in sidebar"],
  ["Studio Admin", "sidebar caption"],
  ["Dashboard", "nav links"],
  ["flex-1 space-y-1 overflow-y-auto", "the quoted nav area"],
];

console.log("--- admin panel DOM ---");
for (const [needle, label] of probes) {
  console.log(`${html.includes(needle) ? "PRESENT" : "absent "} : ${label}`);
}

// Pull the sidebar's computed background + logo box for hard proof.
const { result: style } = await send("Runtime.evaluate", {
  expression: `(() => {
    const aside = document.querySelector("aside");
    if (!aside) return JSON.stringify({ error: "no aside" });
    const nav = aside.querySelector("nav");
    const img = aside.querySelector("img");
    const label = img ? getComputedStyle(img) : null;
    return JSON.stringify({
      asideBg: getComputedStyle(aside).backgroundColor,
      navBg: nav ? getComputedStyle(nav).backgroundColor : null,
      navClass: nav ? nav.className : null,
      logo: img ? { w: Math.round(img.getBoundingClientRect().width), h: Math.round(img.getBoundingClientRect().height), visible: label.display !== "none" && img.naturalWidth > 0 } : null,
      navText: nav ? nav.innerText.replace(/\\n+/g, " | ") : null,
    });
  })()`,
  returnByValue: true,
});
console.log("--- computed ---");
console.log(style.value);

ws.close();
proc.kill();
process.exit(0);
