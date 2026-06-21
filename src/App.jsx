import React, { useEffect, useState } from "react";
import Quiz from "./components/Quiz";

export default function App() {
  const [questions, setQuestions] = useState([]);
  useEffect(() => {
    fetch("/src/data/mockQuestions.json")
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, []);

  return (
    <div className="app">
      <h1>Mock Test — Practice</h1>
      <p className="small">
        Load your questions by running `npm run generate:questions` then `npm
        install` and `npm run dev`.
      </p>
      <Quiz questions={questions} />
    </div>
  );
}
