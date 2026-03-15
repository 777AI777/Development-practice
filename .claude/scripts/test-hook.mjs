// 最小テスト: stdinを読んでファイルパスを出力するだけ
const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(Buffer.concat(chunks).toString());
    const filePath = input.tool_input?.file_path || "NO_FILE_PATH";
    process.stdout.write("[test-hook] " + filePath + "\n");
  } catch (err) {
    process.stdout.write("[test-hook] error: " + err.message + "\n");
  }
});
