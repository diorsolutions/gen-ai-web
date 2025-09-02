# Gen-ai-web — Gemini-powered web starter (Vite)

Fast, minimalist web client for Google’s **Gemini** models. Built with **Vite**. Ships with streaming responses, snappy UI animations, and room to grow.

> **Stack**: Vite 7 · Vanilla JS (framework-agnostic) · `@google/genai` (Gemini JS SDK) · ESM · CSS utilities

---
## Let's see:😉

### Pretty animation waiting
<img width="1920" height="986" alt="image" src="https://github.com/user-attachments/assets/73b06437-39df-445f-9f66-8489d4d462a8" />

### Advanced Markdown Support
<img width="1920" height="975" alt="image" src="https://github.com/user-attachments/assets/e3384629-4f86-4379-a233-0747c74d5367" />

---
## Why this exists

You want a tiny, modern front‑end that talks to Gemini, answers fast, and *feels* fast. This repo gives you:

* ⚡ **Token‑level streaming** (typewriter output)
* 🟣 **Micro‑animations** (skeleton shimmer, message enter, caret blink)
* 🧰 **Clean API wrapper** (Gemini JS SDK)
* 🛑 **Abort / cancel** on new prompt
* 🔁 **Retry** with exponential backoff
* 🌓 **Dark mode** (prefers-color-scheme)
* 🧪 **Dev‑friendly**: isolated modules, no framework lock-in

> If you need React/Svelte/TS variants, see **Roadmap**.

---

## Models

Default: `gemini-2.0-flash-001` (low‑latency). You can switch to `gemini-2.5-flash` or any available model.

---

## Project structure

```
root/
├─ index.html
├─ src/
│  ├─ main.js            # App bootstrap
│  ├─ gemini.js          # SDK init + helpers (stream, retry)
│  ├─ ui.js              # DOM helpers, animations
│  ├─ styles.css         # Shimmer, typewriter, theming
│  └─ state.js           # Simple in-memory chat state
├─ public/
│  └─ favicon.svg
├─ .env.example          # Env template
├─ package.json          # { vite }
└─ README.md
```

---

## Prerequisites

* **Node 20+**
* A **Gemini API key** from \[Google AI Studio]

> **Security note**: Never ship client‑side code with a real API key. For production, put the key behind a server/edge proxy (see **Secure backend proxy**).

---

## Quick start (local dev)

1. **Install**

```bash
npm i
npm i @google/genai nanoid
```

2. **Configure env**
   Create `.env` from the example:

```bash
cp .env.example .env
```

Add your key. For Vite, variables exposed to the browser must start with `VITE_`.

```
VITE_GEMINI_API_KEY=your_key_here
VITE_GEMINI_MODEL=gemini-2.0-flash-001
```

> For server‑side usage, prefer `GEMINI_API_KEY` or `GOOGLE_API_KEY`. In the browser we use the `VITE_` prefix **only for local testing**.

3. **Run**

```bash
npm run dev
```

Visit the printed localhost URL.

---

## Using the Gemini JS SDK (`@google/genai`)

Minimal init + single‑shot call:

```js
// src/gemini.js
import { GoogleGenAI } from '@google/genai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
export const modelName = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-001'

export const ai = new GoogleGenAI({ apiKey })

export async function generate(text) {
  const res = await ai.models.generateContent({
    model: modelName,
    contents: text,
  })
  return res.text
}
```

### Streaming response (token‑by‑token)

```js
// src/gemini.js (continued)
export async function* stream(text, opts = {}) {
  const { signal } = opts
  const stream = await ai.models.generateContentStream({
    model: modelName,
    contents: text,
    // Optional: config: { temperature: 0.6, maxOutputTokens: 1024 }
    // Optional: safety settings / tool calling here
  })
  for await (const chunk of stream) {
    if (signal?.aborted) break
    yield chunk.text
  }
}
```

---

## Minimal UI (vanilla JS)

```html
<!-- index.html -->
<body>
  <main class="app">
    <header>gen‑ai‑web</header>
    <section id="messages" class="messages"></section>
    <form id="composer" class="composer">
      <input id="prompt" placeholder="Ask anything…" autocomplete="off" />
      <button id="send" type="submit">Send</button>
    </form>
  </main>
  <script type="module" src="/src/main.js"></script>
</body>
```

```js
// src/main.js
import { stream } from './gemini.js'
import { el, appendMessage, setTyping, stopTyping } from './ui.js'

const form = document.getElementById('composer')
const input = document.getElementById('prompt')
const messages = document.getElementById('messages')
let controller = null

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const text = input.value.trim()
  if (!text) return

  // Cancel previous stream if any
  controller?.abort()
  controller = new AbortController()

  appendMessage(messages, { role: 'user', text })
  input.value = ''

  const node = appendMessage(messages, { role: 'model', text: '' })
  setTyping(node)

  try {
    for await (const token of stream(text, { signal: controller.signal })) {
      node.textContent += token
      node.scrollIntoView({ behavior: 'instant', block: 'end' })
    }
  } finally {
    stopTyping(node)
  }
})
```

```js
// src/ui.js
export function el(tag, className, text) {
  const n = document.createElement(tag)
  if (className) n.className = className
  if (text) n.textContent = text
  return n
}

export function appendMessage(container, { role, text }) {
  const bubble = el('div', `bubble ${role}`)
  const content = el('div', 'content', text)
  bubble.appendChild(content)
  container.appendChild(bubble)
  return content
}

export function setTyping(node) { node.classList.add('typing') }
export function stopTyping(node) { node.classList.remove('typing') }
```

```css
/* src/styles.css */
:root { color-scheme: light dark; }
body { font: 16px/1.5 system-ui, sans-serif; margin: 0; }
.app { max-width: 820px; margin: 0 auto; padding: 16px; }
header { font-weight: 700; margin-bottom: 12px; }
.messages { display: grid; gap: 12px; margin-bottom: 12px; }
.bubble { padding: 12px 14px; border-radius: 14px; box-shadow: 0 1px 3px hsl(0 0% 0% / 0.1); }
.bubble.user { background: hsl(210 30% 96%); justify-self: end; }
.bubble.model { background: hsl(270 30% 96%); }

/* Typing caret */
.typing::after { content: '\2588'; display: inline-block; width: .5ch; margin-left: .5ch; animation: caret 1s steps(1) infinite; }
@keyframes caret { 50% { opacity: 0; } }

/* Skeleton shimmer (for list/loading rows) */
.skeleton { position: relative; overflow: hidden; background: linear-gradient(90deg, transparent, hsl(0 0% 100% / .3), transparent); }
.skeleton::before { content: ''; position: absolute; inset: 0; transform: translateX(-100%); animation: shimmer 1.2s infinite; background: linear-gradient(90deg, transparent, hsl(0 0% 100% / .5), transparent); }
@keyframes shimmer { from { transform: translateX(-100%) } to { transform: translateX(100%) } }

/* Composer */
.composer { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
input { padding: 10px 12px; border-radius: 10px; border: 1px solid hsl(0 0% 70% / .4); }
button { padding: 10px 14px; border-radius: 10px; border: 0; cursor: pointer; }
```

Include the stylesheet in `index.html`:

```html
<link rel="stylesheet" href="/src/styles.css" />
```

---

## Fast UX: patterns included

* **Typewriter streaming**: renders tokens as they arrive
* **Caret blink**: subtle “alive” signal
* **Message enter**: CSS `transform/opacity` (omit for brevity)
* **Instant scroll‑to‑bottom** on new tokens
* **Cancel on new prompt**: `AbortController`

---

## Secure backend proxy (production)

Don’t expose keys in the browser. Put a tiny proxy in front of Gemini.

**Express example (Node 20+)**

```js
// server/index.js
import express from 'express'
import cors from 'cors'
import { GoogleGenAI } from '@google/genai'

const app = express()
app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001'

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const stream = await ai.models.generateContentStream({ model, contents: prompt })
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ token: chunk.text })}\n\n`)
    }
    res.end()
  } catch (e) {
    res.write(`event: error\n`)
    res.write(`data: ${JSON.stringify({ message: e.message })}\n\n`)
    res.end()
  }
})

app.listen(8787, () => console.log('API on :8787'))
```

Client side, switch to consuming `EventSource` from `/api/chat`.

**Deploy**: Render, Railway, Fly.io, Vercel (Node), Cloud Run, etc.

---

## Vite scripts

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Environment

`.env.example`:

```
# Local/browser (dev only)
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.0-flash-001

# Server (production)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash-001
```

---

## Troubleshooting

* **401/Permission**: key invalid or model not enabled
* **CORS**: when using a proxy, set appropriate `cors()` origin
* **429/Quota**: implement retries with jitter
* **Empty text**: ensure `chunk.text` handling; some chunks may be control tokens
* **Node version**: require Node 20+

---

## Roadmap

* React + Tailwind example
* TypeScript types + stricter state
* Tool/function calling demo
* File uploads (images/PDF) -> multimodal prompts
* Live API (streaming audio) mode

---

## License

MIT

---

## References

* Gemini JS SDK `@google/genai` – streaming, init, and API surface.
* Gemini API guides – content generation, safety, and model list.

> This README is tailored for the **Vite + Vanilla JS** setup you provided. If you switch to React/Next/Svelte, only the UI layer changes; the `@google/genai` integration stays the same.
