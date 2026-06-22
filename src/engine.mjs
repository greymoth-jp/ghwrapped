// gh-wrapped engine — fetch public GitHub stats (unauthenticated, 60 req/hr) and aggregate.
// Network: only api.github.com, only the username the user passes. No tokens, nothing stored.

const API = "https://api.github.com";
const HEADERS = { "User-Agent": "ghwrapped", Accept: "application/vnd.github+json" };
const MAX_PAGES = 3; // 300 repos covers the vast majority; caps unauth rate-limit burn

async function gh(path) {
  const res = await fetch(API + path, { headers: HEADERS });
  if (res.status === 404) throw new Error("not-found");
  if (res.status === 403) throw new Error("rate-limited (unauthenticated GitHub API = 60 req/hr)");
  if (!res.ok) throw new Error("GitHub API " + res.status);
  return res.json();
}

export async function fetchStats(username) {
  const u = await gh(`/users/${encodeURIComponent(username)}`);
  const repos = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await gh(`/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=pushed`);
    if (!Array.isArray(r) || r.length === 0) break;
    repos.push(...r);
    if (r.length < 100) break;
  }
  return aggregate(u, repos);
}

// pure: turn raw user + repo array into card-ready stats (testable without network)
export function aggregate(u, repos) {
  const own = repos.filter((r) => !r.fork);
  const stars = own.reduce((t, r) => t + (r.stargazers_count || 0), 0);
  const forks = own.reduce((t, r) => t + (r.forks_count || 0), 0);
  const langs = {};
  for (const r of own) if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
  const topLang = Object.entries(langs).sort((a, b) => b[1] - a[1])[0];
  const topRepo = own.slice().sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))[0];
  return {
    login: u.login,
    name: u.name || u.login,
    repos: u.public_repos || 0,
    followers: u.followers || 0,
    following: u.following || 0,
    since: (u.created_at || "").slice(0, 4),
    stars,
    forks,
    scanned: repos.length,
    complete: repos.length >= (u.public_repos || 0),
    topLang: topLang ? topLang[0] : "—",
    topRepo: topRepo ? { name: topRepo.name, stars: topRepo.stargazers_count || 0 } : null,
  };
}

// --- self-check (pure aggregate; node engine.mjs selfcheck) --------------------
function selfCheck() {
  const a = require_assert();
  const u = { login: "x", name: "X", public_repos: 3, followers: 10, created_at: "2015-06-01T00:00:00Z" };
  const repos = [
    { stargazers_count: 100, forks_count: 5, language: "TypeScript", fork: false, name: "big" },
    { stargazers_count: 20, forks_count: 1, language: "TypeScript", fork: false, name: "mid" },
    { stargazers_count: 9999, forks_count: 1, language: "Go", fork: true, name: "forked" }, // fork → excluded
  ];
  const s = aggregate(u, repos);
  a(s.stars === 120, "stars exclude forks");
  a(s.topRepo.name === "big" && s.topRepo.stars === 100, "top repo");
  a(s.topLang === "TypeScript", "top lang");
  a(s.since === "2015", "since year");
  console.log("engine.mjs self-check: PASS");
}
function require_assert() {
  return (c, m) => { if (!c) { throw new Error("FAIL " + m); } };
}

if (process.argv[1] && process.argv[1].endsWith("engine.mjs")) {
  const arg = process.argv[2];
  if (arg === "selfcheck") selfCheck();
  else if (arg) {
    fetchStats(arg).then((s) => console.log(JSON.stringify(s, null, 2)))
      .catch((e) => { console.error("error:", e.message); process.exit(1); });
  } else console.log("usage: node engine.mjs <github-username> | selfcheck");
}
