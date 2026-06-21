const fs = require("fs");
const path = require("path");

const dataPath = path.resolve(process.cwd(), "src/data/mockQuestions.json");
if (!fs.existsSync(dataPath)) {
  console.error("mockQuestions.json not found");
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(dataPath, "utf8"));

function isTrueFalse(q) {
  if (!q.options || q.options.length !== 2) return false;
  const opts = q.options.map((s) => String(s).toLowerCase().trim());
  return (
    (opts.includes("true") && opts.includes("false")) ||
    (opts.includes("t") && opts.includes("f"))
  );
}

const bad = raw.filter((q) => {
  if (!q.options) return true;
  if (isTrueFalse(q)) return false;
  return q.options.length !== 4;
});

if (bad.length === 0) {
  console.log("All questions have 4 options (or are True/False).");
} else {
  console.log("Questions with option count !== 4 (excluding True/False):");
  bad.forEach((q) => {
    console.log(
      `- Q${q.questionNo}: options=${q.options ? q.options.length : 0} type=${q.type}`,
    );
  });
}

// also write a report file
fs.writeFileSync(
  path.resolve(process.cwd(), "src/data/validation-report.txt"),
  bad
    .map(
      (q) =>
        `Q${q.questionNo}: options=${q.options ? q.options.length : 0} type=${q.type}`,
    )
    .join("\n"),
);
console.log("Wrote src/data/validation-report.txt");
