#!/usr/bin/env node
// PreToolUse: .env 계열 파일(.env, .env.local, .env.production 등)에 대한 읽기·수정·삭제를 차단한다.
// .env.example / .env.sample / .env.template 은 비밀값이 없는 템플릿이므로 허용한다.
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const tool = input.tool_name ?? "";
const ti = input.tool_input ?? {};

const ALLOWED = /\.env\.(example|sample|template)$/i;
const isSecretEnvPath = (p) => {
  if (!p) return false;
  const base = String(p).split(/[\\/]/).pop();
  return /^\.env(\..+)?$/i.test(base) && !ALLOWED.test(base);
};

let reason = null;

if (tool === "Bash") {
  const cmd = String(ti.command ?? "");
  // 쉘 토큰 단위로 .env 파일을 가리키는지 검사 (따옴표·리다이렉션·경로 포함)
  const tokens = cmd.split(/[\s'"`;|&<>()=]+/).filter(Boolean);
  if (tokens.some(isSecretEnvPath) || /(^|[\s/'"])\.env\*/.test(cmd)) {
    reason = `Bash 명령이 .env 파일에 접근합니다: ${cmd}`;
  }
} else {
  const candidates = [ti.file_path, ti.notebook_path, ti.path, ti.pattern, ti.glob];
  const hit = candidates.find(isSecretEnvPath);
  if (hit) reason = `${tool} 도구가 .env 파일에 접근합니다: ${hit}`;
}

if (reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `${reason}\n.env 파일은 읽기/수정/삭제가 금지되어 있습니다. 필요한 변수는 .env.example 을 참고하세요.`,
      },
    }),
  );
}
process.exit(0);
