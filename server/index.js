// NOOR — serveur IA. Démarrage : ANTHROPIC_API_KEY=... node index.js
// L'application n'envoie que des questions ; ce serveur ajoute les règles et appelle Claude.
const http = require("http");
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic(); // lit ANTHROPIC_API_KEY
const PORT = process.env.PORT || 8787;
const MODEL = process.env.NOOR_MODEL || "claude-opus-5-5";

const RULES = `Tu es l'assistant d'étude du Coran de l'application NOOR, sérieux et respectueux, pour un public francophone.
RÈGLES ABSOLUES :
1. N'écris JAMAIS de texte arabe et ne présente jamais une phrase comme étant le texte du Coran. Renvoie aux versets uniquement par référence au format (sourate:verset), par ex. (2:255). L'application affiche elle-même le texte exact depuis le Mushaf.
2. Ne donne une référence que si tu en es certain. Si tu n'es pas sûr, dis-le.
3. Sépare clairement : ce que dit le verset (d'après la traduction fournie), l'explication des exégètes reconnus (Ibn Kathir, at-Tabari, al-Qurtubi, as-Sa'di — seulement si tu es sûr de leur avis) et le contexte de révélation s'il est établi.
4. Ne cite un hadith qu'avec sa source (Bukhari, Muslim…) et seulement si tu es certain de son authenticité. N'invente rien.
5. Pas de fatwa : pour une question de jurisprudence, présente brièvement les avis connus et recommande de consulter un savant qualifié.
6. Réponds clairement, en 200 mots maximum, sans titres markdown, dans la langue indiquée à la fin du message.`;
const LANGS = { fr: "Langue de la réponse : français.", en: "Answer language: English.", ar: "لغة الإجابة: العربية الفصحى. لا تقتبس نص الآيات، واكتفِ بذكر المراجع (سورة:آية)." };

const THEME_SCHEMA = {
  type: "object",
  properties: {
    intro: { type: "string" },
    versets: { type: "array", items: { type: "object", properties: { ref: { type: "string" }, pourquoi: { type: "string" } }, required: ["ref", "pourquoi"], additionalProperties: false } }
  },
  required: ["intro", "versets"], additionalProperties: false
};

// Limite simple : 20 requêtes / 10 min par adresse IP
const hits = new Map();
function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 600000);
  arr.push(now); hits.set(ip, arr); return arr.length > 20;
}

async function ask(task, prompt, lang) {
  const theme = task === "theme";
  const userText = (theme
    ? `Liste jusqu'à 12 versets du Coran qui traitent directement du thème « ${prompt} ». Pour chacun : "ref" au format sourate:verset (ex. 2:153) et "pourquoi" (une phrase). "intro" : une phrase de présentation du thème. Uniquement des références dont tu es certain. Pas de texte arabe coranique.`
    : prompt) + "\n\n" + (LANGS[lang] || LANGS.fr);
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: RULES,
    output_config: theme ? { effort: "medium", format: { type: "json_schema", schema: THEME_SCHEMA } } : { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: userText }],
  });
  if (res.stop_reason === "refusal") return { text: "Je ne peux pas répondre à cette demande." };
  const text = res.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim();
  if (theme) { try { return { json: JSON.parse(text) } } catch { return { json: { intro: "", versets: [] } } } }
  return { text };
}

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" });
  res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/") return send(res, 200, { ok: true, app: "NOOR" });
  if (req.method !== "POST" || req.url !== "/api/ai") return send(res, 404, { error: "not_found" });
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (limited(ip)) return send(res, 429, { error: "rate_limited" });
  let body = "";
  req.on("data", c => { body += c; if (body.length > 20000) req.destroy() });
  req.on("end", async () => {
    try {
      const { task, prompt, lang } = JSON.parse(body || "{}");
      if (!["ask", "explain", "summary", "theme", "tafsir"].includes(task) || typeof prompt !== "string" || !prompt.trim() || prompt.length > 8000) return send(res, 400, { error: "bad_request" });
      send(res, 200, await ask(task, prompt.trim(), lang));
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return send(res, 429, { error: "rate_limited" });
      console.error(e?.status || "", e?.message || e);
      send(res, 502, { error: "ai_error" });
    }
  });
}).listen(PORT, () => console.log(`NOOR IA prêt sur http://localhost:${PORT} (modèle ${MODEL})`));
