#!/usr/bin/env node
// Stop: 작업이 끝날 때마다
//  1) 코드에서 참조하는 환경변수(process.env.X, import.meta.env.X)를 수집하고
//  2) 하드코딩된 비밀값/접속정보(Supabase URL·키, JWT, API 키 등)를 탐지해
//  3) .env.example 을 갱신한다 (값은 항상 비워 둠 — 실제 비밀값은 절대 기록하지 않음).
// 하드코딩이 발견되면 Claude 에게 한 번 되돌려 환경변수로 옮기도록 요청한다.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

let input = {};
try { input = JSON.parse(readFileSync(0, "utf8") || "{}"); } catch {}
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

const SCAN_DIRS = ["app", "lib", "components", "supabase", "test", "src", "pages"];
const ROOT_FILES = /^(next|vitest|vite|eslint|postcss|tailwind)\.config\.(ts|js|mjs|cjs|mts)$/;
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".sql"]);
const SKIP = new Set(["node_modules", ".next", ".git", "coverage", "build", "out"]);

function walk(dir, out) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXTS.has(extname(name))) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(root, d), []));
for (const name of readdirSync(root)) if (ROOT_FILES.test(name)) files.push(join(root, name));

// 하드코딩 탐지 규칙: [설명, 정규식, 제안 변수명(함수 또는 문자열)]
const toSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^A-Za-z0-9]+/g, "_").toUpperCase();
const RULES = [
  ["Supabase 프로젝트 URL", /https:\/\/[a-z0-9]{20}\.supabase\.co/, "NEXT_PUBLIC_SUPABASE_URL"],
  ["Supabase publishable 키", /sb_publishable_[A-Za-z0-9_-]{10,}/, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  ["Supabase secret 키", /sb_secret_[A-Za-z0-9_-]{10,}/, "SUPABASE_SECRET_KEY"],
  ["JWT 토큰(anon/service_role 키 등)", /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, "SUPABASE_JWT_KEY"],
  ["Anthropic API 키", /sk-ant-[A-Za-z0-9_-]{20,}/, "ANTHROPIC_API_KEY"],
  ["OpenAI 스타일 API 키", /\bsk-(?!ant-)[A-Za-z0-9_-]{20,}/, "OPENAI_API_KEY"],
  ["AWS Access Key", /\bAKIA[0-9A-Z]{16}\b/, "AWS_ACCESS_KEY_ID"],
  ["GitHub 토큰", /\bgh[pousr]_[A-Za-z0-9]{30,}/, "GITHUB_TOKEN"],
  ["Slack 토큰", /\bxox[abprs]-[A-Za-z0-9-]{10,}/, "SLACK_TOKEN"],
  ["DB 접속 문자열", /\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis):\/\/[^\s'"`]+:[^\s'"`]+@/, "DATABASE_URL"],
  [
    "비밀값으로 보이는 문자열 할당",
    /\b([A-Za-z_]*(api_?key|secret|token|password|passwd|private_?key)[A-Za-z_]*)\s*[:=]\s*["'`]([^"'`\s]{12,})["'`]/i,
    (m) => toSnake(m[1]),
  ],
];

const referenced = new Set();
const findings = [];
for (const f of files) {
  const rel = relative(root, f);
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/(?:process\.env|import\.meta\.env)(?:\.([A-Z_][A-Z0-9_]*)|\[\s*["'`]([A-Z_][A-Z0-9_]*)["'`]\s*\])/g)) {
      referenced.add(m[1] || m[2]);
    }
    if (/process\.env|import\.meta\.env/.test(line)) return; // 이미 env 로 읽는 줄은 제외
    for (const [label, re, suggest] of RULES) {
      const m = line.match(re);
      if (m) {
        const name = typeof suggest === "function" ? suggest(m) : suggest;
        findings.push({ rel, line: i + 1, label, name });
        break;
      }
    }
  });
}

// .env.example 병합 (기존 키·주석은 보존, 새 키만 추가)
const examplePath = join(root, ".env.example");
const existing = existsSync(examplePath) ? readFileSync(examplePath, "utf8") : "";
const existingKeys = new Set(
  existing.split("\n").map((l) => l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1]).filter(Boolean),
);
const fromCode = [...referenced].filter((k) => !existingKeys.has(k)).sort();
const fromHardcoded = [...new Set(findings.map((f) => f.name))].filter((k) => !existingKeys.has(k) && !referenced.has(k)).sort();

let next = existing;
if (!next.trim()) next = "# 환경변수 템플릿 — .claude/hooks/env-example.mjs 가 자동 관리합니다.\n# 실제 값은 .env.local 에 넣고, 이 파일에는 값을 적지 마세요.\n";
const append = (header, keys) => {
  if (!keys.length) return;
  if (!next.endsWith("\n")) next += "\n";
  next += `\n# ${header}\n` + keys.map((k) => `${k}=`).join("\n") + "\n";
};
append("코드에서 참조 중인 변수", fromCode);
append("하드코딩이 감지되어 추가된 변수 (코드를 process.env 로 옮기세요)", fromHardcoded);

const changed = next !== existing;
if (changed) writeFileSync(examplePath, next);

const added = [...fromCode, ...fromHardcoded];
const msgs = [];
if (changed && added.length) msgs.push(`.env.example 갱신: ${added.join(", ")} 추가`);

if (findings.length) {
  const list = findings.map((f) => `- ${f.rel}:${f.line} ${f.label} → ${f.name}`).join("\n");
  if (!input.stop_hook_active) {
    process.stdout.write(JSON.stringify({
      decision: "block",
      reason: `하드코딩된 환경값이 감지되었습니다. 아래 위치의 값을 process.env.<변수명> 으로 바꾸고, .env.example 에 변수명이 있는지 확인하세요 (.env 파일은 수정 금지):\n${list}`,
      ...(msgs.length ? { systemMessage: msgs.join("\n") } : {}),
    }));
    process.exit(0);
  }
  msgs.push(`하드코딩 의심 ${findings.length}건이 남아 있습니다:\n${list}`);
}

if (msgs.length) process.stdout.write(JSON.stringify({ systemMessage: msgs.join("\n") }));
process.exit(0);
