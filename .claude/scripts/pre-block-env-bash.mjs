// PreToolUse hook: Bash経由の .env ファイル参照をブロック
//
// 防御レイヤー:
// 1. ファイル操作コマンド + .env パターン → ブロック
// 2. リダイレクト入力 (< .env) → ブロック
// 3. ドットソース (. .env) → ブロック
// 4. node -e / python -c 等のインラインコード内に .env パターン → ブロック
// 5. node/python <script> 実行時にスクリプト内容をチェック → ブロック
//
// 新しいコマンドを発見したら FILE_CMDS に追加すること。

import { readFileSync } from "fs";
import { resolve } from "path";

const FILE_CMDS = [
  // 表示系
  "cat", "tac", "head", "tail", "less", "more", "bat", "batcat", "type", "nl", "pr",
  // 検索系
  "grep", "egrep", "fgrep", "rg", "ag", "ack",
  // 加工系
  "sed", "awk", "gawk", "mawk", "cut", "sort", "uniq", "wc", "tr", "fold", "fmt",
  "paste", "join", "comm",
  // ダンプ・エンコード系
  "od", "xxd", "hexdump", "strings", "base64",
  // 比較系
  "diff", "cmp",
  // コピー・移動系
  "cp", "mv", "tee", "dd", "install", "rsync",
  // アーカイブ系
  "tar", "zip", "gzip", "bzip2", "xz", "7z",
  // ネットワーク系（ローカルファイル参照可能）
  "curl", "wget",
  // シェル系
  "source", "bash", "sh", "zsh",
  // Windows/PowerShell系
  "powershell", "cmd",
  // その他
  "xargs", "file", "jq", "yq",
];

const ENV_FILE = String.raw`\.env(\.[a-zA-Z0-9_-]+)?(\s|$|["'|;>&])`;

const cmdPattern = new RegExp(
  `\\b(${FILE_CMDS.join("|")})\\b.*${ENV_FILE}`,
  "i",
);

// リダイレクト入力: cmd < .env.local
const redirectPattern = new RegExp(`<\\s*\\S*${ENV_FILE}`, "i");

// ドットコマンド: . .env.local
const dotSourcePattern = new RegExp(`^\\.\\s+\\S*${ENV_FILE}`, "i");

// node -e "...env..." / python -c "...env..." のインラインコード検出
const inlineCodePattern = /\b(node|python3?|ruby|perl)\s+(-e|--eval|-c)\s+/i;
const envStringLiteral = /\.env(\.[a-zA-Z0-9_-]+)?/i;

// node/python <script> のスクリプトファイル実行パターン
const scriptExecPattern = /\b(node|python3?|ruby|perl)\s+(?!-)([\w./_-]+\.(mjs|js|cjs|py|rb|pl))\b/;

function block(message) {
  process.stderr.write(message);
  process.exit(2);
}

function checkScriptContent(scriptPath) {
  try {
    const absPath = resolve(scriptPath);
    const content = readFileSync(absPath, "utf8");
    if (envStringLiteral.test(content)) {
      return true;
    }
  } catch {
    // ファイルが読めない場合は通過（存在しないスクリプト等）
  }
  return false;
}

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const cmd = input.tool_input?.command || "";

    // Layer 1: ファイル操作コマンド + .env
    if (cmdPattern.test(cmd)) {
      block("BLOCK: .env系ファイルへのBash参照は禁止です。");
    }

    // Layer 2: リダイレクト入力
    if (redirectPattern.test(cmd)) {
      block("BLOCK: .env系ファイルへのリダイレクト参照は禁止です。");
    }

    // Layer 3: ドットソース
    if (dotSourcePattern.test(cmd)) {
      block("BLOCK: .env系ファイルのドットソースは禁止です。");
    }

    // Layer 4: インラインコード内の .env 参照
    if (inlineCodePattern.test(cmd) && envStringLiteral.test(cmd)) {
      block("BLOCK: インラインコード内での.env参照は禁止です。");
    }

    // Layer 5: スクリプトファイル実行時の内容チェック
    const scriptMatch = cmd.match(scriptExecPattern);
    if (scriptMatch) {
      const scriptFile = scriptMatch[2];
      if (checkScriptContent(scriptFile)) {
        block("BLOCK: .envを参照するスクリプトの実行は禁止です。");
      }
    }
  } catch {
    // パースエラーは無視して通過させる
  }
});
