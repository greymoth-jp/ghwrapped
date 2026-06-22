#!/usr/bin/env node
// ghwrapped — print your GitHub profile as a shareable risograph card. Public data, no token.
import fs from "fs";
import { fetchStats } from "../src/engine.mjs";
import { wrappedSVG } from "../src/card.mjs";

const A = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`, dim: (s) => `\x1b[90m${s}\x1b[0m`,
  red: (s) => `\x1b[38;5;202m${s}\x1b[0m`, inv: (s) => `\x1b[7m ${s} \x1b[0m`,
};
const commas = (n) => Math.round(n || 0).toLocaleString("en-US");

function help() {
  console.log(`${A.bold("ghwrapped")} — your GitHub profile as a shareable card

usage:  ghwrapped <username> [--wrapped [file.svg]] [--json]

Fetches public GitHub data only (no token, 60 req/hr unauthenticated).
--wrapped writes a self-contained SVG card → open in a browser, screenshot, share.`);
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args[0] === "-h" || args[0] === "--help") return help();
  const username = args.find((a) => !a.startsWith("-"));
  if (!username) return help();
  const wrapped = args.includes("--wrapped");
  const json = args.includes("--json");
  let out = null;
  const wi = args.indexOf("--wrapped");
  if (wrapped && args[wi + 1] && !args[wi + 1].startsWith("-")) out = args[wi + 1];

  let s;
  try { s = await fetchStats(username); }
  catch (e) {
    console.error(A.red(e.message === "not-found" ? `user '${username}' not found` : "error: " + e.message));
    process.exit(1);
  }

  if (json) { console.log(JSON.stringify(s, null, 2)); return; }

  if (wrapped) {
    const file = out || `github-wrapped-${s.login}.svg`;
    fs.writeFileSync(file, wrappedSVG(s));
    console.log(`${A.bold("✺ wrapped card saved:")} ${file}  ${A.dim("(open in a browser → screenshot to share)")}`);
    return;
  }

  console.log();
  console.log(`  ${A.inv("✺ GITHUB")}  ${A.dim("@" + s.login)}`);
  console.log(`  ${A.red(A.bold("★ " + commas(s.stars)))} ${A.dim("stars")}  ·  ${A.bold(commas(s.repos))} repos  ·  ${A.bold(commas(s.followers))} followers`);
  console.log(`  ${A.dim("since " + s.since + (s.complete ? "" : ` · stars across top ${s.scanned} repos`))}`);
  console.log(`  ${A.dim("top language:")} ${s.topLang}`);
  if (s.topRepo) console.log(`  ${A.dim("top repo:")} ${s.topRepo.name} ${A.red("★" + commas(s.topRepo.stars))}`);
  console.log();
  console.log(`  ${A.dim("✺ public data · ghwrapped --wrapped to make a share card · --help")}`);
  console.log();
}

main();
