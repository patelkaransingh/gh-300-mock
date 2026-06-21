const fs = require("fs");
const path = require("path");

const file = path.resolve(process.cwd(), "mockTest.txt");
const out = path.resolve(process.cwd(), "src/data/mockQuestions.json");

if (!fs.existsSync(file)) {
  console.error("mockTest.txt not found in project root");
  process.exit(1);
}

const raw = fs.readFileSync(file, "utf8");
const lines = raw.split(/\r?\n/);

const questions = [];
let i = 0;
while (i < lines.length) {
  const line = lines[i].trim();
  if (/^Question:\s*\d+/i.test(line)) {
    // start question
    const qNoMatch = line.match(/^Question:\s*(\d+)/i);
    const qno = qNoMatch ? qNoMatch[1] : (questions.length + 1).toString();
    i++;
    // gather question text until option line (A. ...)
    const qLines = [];
    while (i < lines.length && !/^[A-Z]\./.test(lines[i].trim())) {
      if (/^Answer:/i.test(lines[i])) break;
      qLines.push(lines[i]);
      i++;
    }
    const questionText = qLines.join(" ").replace(/\s+/g, " ").trim();

    // options
    const options = [];
    while (i < lines.length && /^[A-Z]\./.test(lines[i].trim())) {
      const l = lines[i].trim();
      const m = l.match(/^[A-Z]\.\s*(.*)$/);
      options.push(m ? m[1].trim() : l);
      i++;
    }

    // find Answer:
    let answerLine = null;
    while (i < lines.length && !/^Answer:/i.test(lines[i])) i++;
    if (i < lines.length && /^Answer:/i.test(lines[i])) {
      answerLine = lines[i].replace(/^Answer:\s*/i, "").trim();
      i++;
    }

    // Explanation
    let reasonLines = [];
    while (i < lines.length && !/^Question:\s*\d+/i.test(lines[i])) {
      if (/^Explanation:/i.test(lines[i])) {
        // skip the Explanation: header
        i++;
        while (i < lines.length && !/^Question:\s*\d+/i.test(lines[i])) {
          // stop when next Question occurs
          if (/^Question:\s*\d+/i.test(lines[i])) break;
          reasonLines.push(lines[i]);
          i++;
        }
        break;
      }
      i++;
    }

    const reason = reasonLines.join(" ").replace(/\s+/g, " ").trim();

    // interpret answers
    let type = "single";
    let answerIndex = null;
    let answerIndexArr = null;
    if (answerLine) {
      const clean = answerLine.replace(/[^A-Z]/gi, "").toUpperCase();
      if (clean.length > 1) {
        type = "multi";
        answerIndexArr = clean.split("").map((ch) => ch.charCodeAt(0) - 65);
      } else {
        type = "single";
        answerIndex = clean ? clean.charCodeAt(0) - 65 : null;
      }
    }

    questions.push({
      questionNo: qno,
      question: questionText,
      options,
      type,
      answer:
        type === "single"
          ? answerIndex != null
            ? options[answerIndex]
            : ""
          : (answerIndexArr || []).map((i) => options[i]),
      answerIndex,
      answerIndexArr,
      reason,
    });
  } else {
    i++;
  }
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(questions, null, 2), "utf8");
console.log("Wrote", out, "with", questions.length, "questions");
