import { useState } from "react";
import { Button } from "./ui";

export interface QuizQuestionDTO {
  skill: string;
  question: string;
  options: string[];
}

export function QuizForm({
  questions,
  onSubmit,
  submitting,
  submitLabel = "Enviar respuestas",
}: {
  questions: QuizQuestionDTO[];
  onSubmit: (answers: { skill: string; selectedIndex: number }[]) => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const allAnswered = questions.length > 0 && questions.every((q) => selected[q.skill] !== undefined);

  return (
    <div className="space-y-5">
      {questions.map((q) => (
        <div key={q.skill}>
          <p className="mb-2 text-sm font-medium text-gray-800">{q.question}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-2.5 text-sm text-gray-700 hover:border-brand-300"
              >
                <input
                  type="radio"
                  name={q.skill}
                  checked={selected[q.skill] === i}
                  onChange={() => setSelected((prev) => ({ ...prev, [q.skill]: i }))}
                  className="mt-0.5 accent-brand-700"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button
        disabled={!allAnswered || submitting}
        onClick={() => onSubmit(questions.map((q) => ({ skill: q.skill, selectedIndex: selected[q.skill] })))}
      >
        {submitting ? "Guardando..." : submitLabel}
      </Button>
    </div>
  );
}
