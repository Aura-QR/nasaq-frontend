export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export const normalizeStartedExam = (rawExam) => {
  // Handle both wrapped { status, data: { remainingSeconds, exam } }
  // and direct       { remainingSeconds, exam }
  const dataLevel = rawExam?.data ?? rawExam;
  const source = dataLevel?.exam ?? dataLevel;

  return {
    ...source,
    duration:
      source?.duration ?? dataLevel?.duration ?? rawExam?.duration,
    remainingSeconds:
      dataLevel?.remainingSeconds ?? rawExam?.remainingSeconds,
    startedAt:
      dataLevel?.startedAt ?? rawExam?.startedAt,
    questions: (source?.questions || []).map((q, index) => ({
      id: q?._id || q?.id || `q-${index}`,
      text: q?.question || q?.text || "",
      choices: (q?.options || q?.choices || []).filter((c) => c && String(c).trim() !== ""),
    })),
  };
};

/** Returns true when the API returned a real grade result (not an error string). */
export const isGradeResponse = (res) => {
  if (!res || typeof res === "string") return false;
  const payload = res?.data || res;
  return payload?.examId !== undefined || payload?.passed !== undefined;
};

/** Extracts the grade data from either wrapped or direct response. */
export const extractGradeResult = (res) => res?.data || res;

/**
 * Computes remaining seconds from a normalized exam.
 * Prefers startedAt + duration (re-computed each time, accurate after reopen).
 * Falls back to remainingSeconds from the /start response.
 */
export const computeInitialSeconds = (exam) => {
  const { startedAt, duration, remainingSeconds } = exam || {};
  if (startedAt && typeof duration === "number" && duration > 0) {
    const endMs = new Date(startedAt).getTime() + duration * 60 * 1000;
    return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  }
  if (typeof remainingSeconds === "number" && remainingSeconds > 0) {
    return remainingSeconds;
  }
  return 0;
};

export const buildSubmitPayload = (examQuestions, answers) => {
  const answersArray = examQuestions
    .filter((q) => typeof answers[q.id] === "string" && answers[q.id].trim() !== "")
    .map((q) => ({ questionId: q.id, answer: answers[q.id] }));
  return { answers: answersArray };
};
