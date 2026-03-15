// PostToolUse hook: .ts/.tsx 編集後に tsc --noEmit を実行
import { execSync } from "child_process";

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const filePath = input.tool_input?.file_path || "";

    if (!/\.tsx?$/.test(filePath)) {
      process.exit(0);
    }

    const normalized = filePath.replace(/\\/g, "/");
    const match = normalized.match(/.*okiny-web/);
    if (!match) {
      process.exit(0);
    }

    const cwd = match[0];
    try {
      execSync("npx tsc --noEmit --pretty 2>&1", {
        cwd,
        timeout: 30000,
      });
      process.stdout.write("tsc: OK\n");
    } catch (e) {
      const output = e.stdout?.toString() || e.stderr?.toString() || e.message;
      const lines = output.split("\n").slice(0, 20).join("\n");
      process.stdout.write(lines + "\n");
    }
  } catch (err) {
    process.stdout.write("[tsc-hook] parse error: " + err.message + "\n");
  }
});
