// gh-wrapped — "GitHub Wrapped" share card as a dependency-free SVG (risograph editorial).
// Fonts inlined as base64 → self-contained, portable, no canvas / no Chrome.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.join(HERE, "..", "assets", "fonts");

const INK = "#111111", PAPER = "#FAF7F0", ACCENT = "#FF3B12", DIM = "#6B6B6B";
const W = 1080, H = 1350, M = 90;

const commas = (n) => Math.round(n || 0).toLocaleString("en-US");
const kfmt = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : String(Math.round(n || 0));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

const b64 = (file) => fs.readFileSync(path.join(FONTS, file)).toString("base64");
function fontFace() {
  const f = (fam, wt, file) =>
    `@font-face{font-family:'${fam}';font-weight:${wt};src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`;
  return [
    f("Grotesk", 700, "space-grotesk-700.woff2"),
    f("Mono", 400, "jetbrains-mono-400.woff2"),
    f("Mono", 700, "jetbrains-mono-700.woff2"),
  ].join("");
}

// s = engine stats object
export function wrappedSVG(s) {
  const hero = commas(s.stars);
  const heroSize = Math.min(210, Math.floor(880 / (hero.length * 0.6)));
  const repoStr = s.topRepo ? `${s.topRepo.name} ★${kfmt(s.topRepo.stars)}` : "—";

  const rows = [
    ["PUBLIC REPOS", commas(s.repos)],
    ["FOLLOWERS", commas(s.followers)],
    ["TOP LANGUAGE", esc(s.topLang)],
    ["TOP REPO", esc(repoStr.slice(0, 26))],
  ];
  let ry = 730;
  const rowSVG = rows.map(([k, v]) => {
    const y = ry; ry += 62;
    return `<text x="${M}" y="${y}" font-family="Mono" font-size="26" fill="${INK}">${k}</text>
    <line x1="${M}" y1="${y + 8}" x2="${W - M}" y2="${y + 8}" stroke="${DIM}" stroke-width="1" stroke-dasharray="1 9" opacity="0.6"/>
    <text x="${W - M}" y="${y}" text-anchor="end" font-family="Grotesk" font-weight="700" font-size="30" fill="${INK}">${v}</text>`;
  }).join("\n");

  let dots = "";
  for (let x = M; x < W - M; x += 22) dots += `<circle cx="${x}" cy="1060" r="4" fill="${INK}"/>`;
  const note = s.complete ? "every public repo" : `across the top ${s.scanned} repos`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${fontFace()}</style>
<rect width="${W}" height="${H}" fill="${PAPER}"/>

<text x="${M}" y="120" font-family="Mono" font-weight="700" font-size="38" fill="${INK}">GITHUB</text>
<text x="${W - M}" y="122" text-anchor="end" font-family="Grotesk" font-weight="700" font-size="38" fill="${ACCENT}">✺</text>
<rect x="${M}" y="150" width="${W - 2 * M}" height="5" fill="${INK}"/>
<text x="${M}" y="196" font-family="Mono" font-size="22" fill="${DIM}">✺ WRAPPED · @${esc(s.login)}</text>
<text x="${W - M}" y="196" text-anchor="end" font-family="Mono" font-size="22" fill="${DIM}">since ${esc(s.since)}</text>

<text x="${M + 6}" y="476" font-family="Grotesk" font-weight="700" font-size="${heroSize}" fill="${ACCENT}">${hero}</text>
<text x="${M}" y="470" font-family="Grotesk" font-weight="700" font-size="${heroSize}" fill="${INK}">${hero}</text>
<text x="${M}" y="528" font-family="Mono" font-weight="700" font-size="30" fill="${INK}">★ S T A R S   E A R N E D</text>
<text x="${M}" y="566" font-family="Mono" font-size="24" fill="${DIM}">${esc(s.name)} · ${note}</text>

<rect x="${M}" y="604" width="${W - 2 * M}" height="2" fill="${INK}"/>
<text x="${M}" y="668" font-family="Grotesk" font-weight="700" font-size="46" fill="${ACCENT}">${commas(s.repos)} repos</text>
<text x="${W - M}" y="668" text-anchor="end" font-family="Mono" font-size="22" fill="${DIM}">${kfmt(s.forks)} forks</text>

${rowSVG}

${dots}
<text x="${W / 2}" y="1036" text-anchor="middle" font-family="Mono" font-size="18" fill="${DIM}">— — — — —   github.com/${esc(s.login)}   — — — — —</text>

<text x="${M}" y="1120" font-family="Mono" font-size="20" fill="${DIM}">✺ Public profile data · stars summed ${esc(note)}.</text>
<text x="${M}" y="1150" font-family="Mono" font-size="20" fill="${DIM}">Generated locally with no token.</text>

<text x="${M}" y="1258" font-family="Mono" font-weight="700" font-size="40" fill="${INK}">GHWRAPPED</text>
<rect x="${M}" y="1274" width="220" height="5" fill="${ACCENT}"/>
<text x="${W - M}" y="1250" text-anchor="end" font-family="Mono" font-size="22" fill="${INK}">npm i -g @greymoth/ghwrapped</text>
<text x="${W - M}" y="1280" text-anchor="end" font-family="Mono" font-size="20" fill="${DIM}">local · open-source</text>
</svg>`;
}
