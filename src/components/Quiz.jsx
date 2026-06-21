import React, { useState, useMemo } from "react";

function shuffle(a) {
  return [...a].sort(() => Math.random() - 0.5);
}

export default function Quiz({ questions: allQuestions }) {
  const [mode, setMode] = useState("30");
  const [shuffleOn, setShuffleOn] = useState(true);
  const [started, setStarted] = useState(false);
  const [qset, setQset] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [checked, setChecked] = useState({});

  const start = () => {
    let pool = allQuestions || [];
    if (shuffleOn) pool = shuffle(pool);
    let count =
      mode === "all" ? pool.length : Math.min(pool.length, Number(mode));
    setQset(pool.slice(0, count));
    setStarted(true);
    setIndex(0);
    setAnswers({});
    setSubmitted(false);
    setChecked({});
  };

  const cur = qset[index];

  const toggleOption = (qno, optIndex, checked) => {
    // Determine question type from qset so multi-selects are stored as arrays
    const q = qset.find((x) => x && String(x.questionNo) === String(qno));
    setAnswers((prev) => {
      const prevAns = prev[qno];
      if (q && q.type === "multi") {
        const base = Array.isArray(prevAns) ? prevAns : [];
        const next = checked
          ? [...base, optIndex]
          : base.filter((i) => i !== optIndex);
        return { ...prev, [qno]: next };
      }
      // single-select
      return { ...prev, [qno]: optIndex };
    });
  };

  const submit = () => {
    setSubmitted(true);
  };

  const score = useMemo(() => {
    if (!submitted) return null;
    let s = 0;
    qset.forEach((q, idx) => {
      const got = answers[q.questionNo];
      if (q.type === "single") {
        if (typeof got === "number" && q.answerIndex === got) s += 1;
      } else {
        const expected = (q.answerIndexArr || []).sort().join(",");
        const given = (Array.isArray(got) ? got : []).sort().join(",");
        if (expected && expected === given) s += 1;
      }
    });
    return s;
  }, [submitted, qset, answers]);

  const percent = useMemo(() => {
    if (score == null) return null;
    return Math.round((score / Math.max(1, qset.length)) * 100);
  }, [score, qset.length]);

  const pass = percent != null ? percent >= 85 : null;

  const isOptionCorrect = (q, i) => {
    if (q.type === "single") return q.answerIndex === i;
    return Array.isArray(q.answerIndexArr) && q.answerIndexArr.includes(i);
  };

  const shouldShowFeedbackFor = (q) => {
    // show feedback on summary (submitted) or inline when mode is 'all' after user presses Check
    return submitted || (mode === "all" && checked[q.questionNo]);
  };

  if (!started)
    return (
      <div>
        <div className="controls">
          <label>Test length: </label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="30">30 questions</option>
            <option value="50">50 questions</option>
            <option value="all">All questions</option>
          </select>
          <label style={{ marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={shuffleOn}
              onChange={(e) => setShuffleOn(e.target.checked)}
            />{" "}
            Shuffle
          </label>
          <button
            className="btn btn-primary"
            onClick={start}
            style={{ marginLeft: 12 }}
          >
            Start Test
          </button>
        </div>
        <div className="small">Available questions: {allQuestions.length}</div>
      </div>
    );
  if (submitted)
    return (
      <div>
        <div className="summary">
          <h2>Results</h2>
          <div className="summary-score">
            Score: {score} / {qset.length} — {percent}%
            <span
              style={{ marginLeft: 12 }}
              className={pass ? "result-pass" : "result-fail"}
            >
              {pass ? "PASS" : "FAIL"}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            {qset.map((q, idx) => {
              const userAns = answers[q.questionNo];
              let correct = false;
              if (q.type === "single") correct = userAns === q.answerIndex;
              else {
                const expected = (q.answerIndexArr || []).sort().join(",");
                const given = (Array.isArray(userAns) ? userAns : [])
                  .sort()
                  .join(",");
                correct = expected && expected === given;
              }
              return (
                <div
                  key={q.questionNo}
                  className={`questionCard ${correct ? "correct" : "incorrect"}`}
                >
                  <div>
                    <b>
                      {idx + 1}. {q.question}
                    </b>
                  </div>
                  <div className="options">
                    {q.options.map((opt, i) => {
                      const cls = isOptionCorrect(q, i)
                        ? "optionLabel correct"
                        : (
                              Array.isArray(userAns)
                                ? userAns.includes(i)
                                : userAns === i
                            )
                          ? "optionLabel incorrect"
                          : "optionLabel";
                      return (
                        <div key={i} className={cls}>
                          <div style={{ width: 18 }}>
                            {String.fromCharCode(65 + i)}.
                          </div>
                          <div>{opt}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="small">Reason: {q.reason}</div>
                </div>
              );
            })}
          </div>
          <button
            className="btn"
            onClick={() => {
              setStarted(false);
              setSubmitted(false);
            }}
          >
            Back to settings
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="questionCard">
        <div>
          <b>
            {index + 1}. {cur.question}
          </b>
        </div>
        <div className="options">
          {cur.options.map((opt, i) => {
            const userAns = answers[cur.questionNo];
            const feedbackShown = shouldShowFeedbackFor(cur);
            let cls = "optionLabel";
            if (feedbackShown) {
              if (isOptionCorrect(cur, i)) cls += " correct";
              else if (
                Array.isArray(userAns) ? userAns.includes(i) : userAns === i
              )
                cls += " incorrect";
            }
            return (
              <label key={i} className={cls}>
                {cur.type === "single" ? (
                  <input
                    type="radio"
                    name={cur.questionNo}
                    checked={answers[cur.questionNo] === i}
                    onChange={() => toggleOption(cur.questionNo, i, true)}
                    disabled={feedbackShown}
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={(answers[cur.questionNo] || []).includes(i)}
                    onChange={(e) =>
                      toggleOption(cur.questionNo, i, e.target.checked)
                    }
                    disabled={feedbackShown}
                  />
                )}
                <span style={{ marginLeft: 8 }}>{opt}</span>
              </label>
            );
          })}
        </div>
        {/* Inline feedback (shown in 'all' mode after pressing Check) */}
        {mode === "all" && checked[cur.questionNo] && (
          <div className="explanation">
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              {(() => {
                const got = answers[cur.questionNo];
                let correct = false;
                if (cur.type === "single") correct = got === cur.answerIndex;
                else {
                  const expected = (cur.answerIndexArr || []).sort().join(",");
                  const given = (Array.isArray(got) ? got : [])
                    .sort()
                    .join(",");
                  correct = expected && expected === given;
                }
                return correct ? "Correct" : "Incorrect";
              })()}
            </div>
            <div className="small">Reason: {cur.reason}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          Prev
        </button>
        <button
          className="btn"
          onClick={() => {
            // In 'all' mode: first press checks answer, second press moves to next
            if (mode === "all") {
              if (!checked[cur.questionNo]) {
                setChecked((p) => ({ ...p, [cur.questionNo]: true }));
                return;
              }
              // already checked -> move next
              setIndex((i) => Math.min(qset.length - 1, i + 1));
            } else {
              setIndex((i) => Math.min(qset.length - 1, i + 1));
            }
          }}
        >
          {mode === "all"
            ? checked[cur.questionNo]
              ? "Next"
              : "Check Answer"
            : "Next"}
        </button>
        <button className="btn btn-primary" onClick={submit}>
          Submit Test
        </button>
        <div style={{ marginLeft: "auto" }}>
          Progress: {index + 1}/{qset.length}
        </div>
      </div>
    </div>
  );
}

function renderAnswer(q, ans) {
  if (ans == null) return "—";
  if (q.type === "single") return q.options[ans] || ans;
  return Array.isArray(ans) ? ans.map((i) => q.options[i]).join(", ") : ans;
}
