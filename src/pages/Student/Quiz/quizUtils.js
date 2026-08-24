export const formatTime = (
  seconds
) => {
  const safeSeconds =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const mins =
    Math.floor(
      safeSeconds / 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );

  const secs =
    (
      safeSeconds % 60
    )
      .toString()
      .padStart(
        2,
        "0"
      );

  return `${mins}:${secs}`;
};


// =====================================================
// NORMALIZE STARTED EXAM
// =====================================================

export const normalizeStartedExam = (
  rawExam
) => {
  /*
   * Handles:
   *
   * {
   *   status,
   *   data: {
   *     remainingSeconds,
   *     startedAt,
   *     exam: {...}
   *   }
   * }
   *
   * OR:
   *
   * {
   *   remainingSeconds,
   *   startedAt,
   *   exam: {...}
   * }
   */

  const dataLevel =
    rawExam?.data ??
    rawExam;

  const source =
    dataLevel?.exam ??
    dataLevel;


  return {
    ...source,

    duration:
      source?.duration ??
      dataLevel?.duration ??
      rawExam?.duration,

    remainingSeconds:
      dataLevel?.remainingSeconds ??
      rawExam?.remainingSeconds,

    startedAt:
      dataLevel?.startedAt ??
      rawExam?.startedAt,

    examType:
      source?.examType ??
      dataLevel?.examType ??
      rawExam?.examType ??
      "quiz",

    questions: (
      source?.questions ||
      []
    ).map(
      (
        question,
        index
      ) => ({
        id:
          question?._id ||
          question?.id ||
          `q-${index}`,

        text:
          question?.question ||
          question?.text ||
          "",

        choices: (
          question?.options ||
          question?.choices ||
          []
        ).filter(
          (choice) =>
            choice &&
            String(
              choice
            ).trim() !==
              ""
        ),
      })
    ),
  };
};


// =====================================================
// GRADE RESPONSE CHECK
// =====================================================

/**
 * Check whether the API actually
 * returned a grade result rather
 * than an error.
 */
export const isGradeResponse = (
  response
) => {
  if (
    !response ||
    typeof response ===
      "string"
  ) {
    return false;
  }


  const payload =
    response?.data ||
    response;


  return (
    payload?.examId !==
      undefined ||
    payload?.passed !==
      undefined ||
    payload
      ?.achievedGrade !==
      undefined ||
    payload?.percentage !==
      undefined
  );
};


// =====================================================
// EXTRACT GRADE RESULT
// =====================================================

export const extractGradeResult = (
  response
) => {
  return (
    response?.data ||
    response
  );
};


// =====================================================
// INITIAL TIMER
// =====================================================

/**
 * Calculates the real remaining time.
 *
 * Prefer:
 * startedAt + duration
 *
 * This means refresh/reopen still has
 * authoritative remaining time.
 */
export const computeInitialSeconds = (
  exam
) => {
  const {
    startedAt,
    duration,
    remainingSeconds,
  } = exam || {};


  /*
   * المصدر الأساسي للوقت:
   *
   * startedAt + duration
   */
  if (
    startedAt &&
    typeof duration ===
      "number" &&
    duration > 0
  ) {
    const startMs =
      new Date(
        startedAt
      ).getTime();


    if (
      !Number.isNaN(
        startMs
      )
    ) {
      const endMs =
        startMs +
        duration *
          60 *
          1000;


      return Math.max(
        0,
        Math.floor(
          (
            endMs -
            Date.now()
          ) / 1000
        )
      );
    }
  }


  /*
   * fallback من الباك
   */
  if (
    typeof remainingSeconds ===
      "number" &&
    remainingSeconds > 0
  ) {
    return remainingSeconds;
  }


  return 0;
};


// =====================================================
// BUILD SUBMISSION PAYLOAD
// =====================================================

export const buildSubmitPayload = (
  examQuestions,
  answers
) => {
  const answersArray = (
    examQuestions || []
  )
    .filter(
      (question) => {
        const answer =
          answers?.[
            question.id
          ];


        return (
          typeof answer ===
            "string" &&
          answer.trim() !==
            ""
        );
      }
    )
    .map(
      (question) => ({
        questionId:
          question.id,

        answer:
          answers[
            question.id
          ],
      })
    );


  return {
    answers:
      answersArray,
  };
};


// =====================================================
// EXAM TYPE LABEL
// =====================================================

export const getExamTypeLabel = (
  examType
) => {
  const type =
    String(
      examType || ""
    )
      .trim()
      .toLowerCase();


  switch (type) {
    case "final":
      return "الاختبار النهائي";

    case "assignment":
      return "الواجب";

    case "activity":
      return "النشاط";

    case "quiz":
      return "الاختبار القصير";

    default:
      return "الاختبار";
  }
};


// =====================================================
// RESULT TITLE
// =====================================================

export const getExamResultTitle = (
  examType
) => {
  const type =
    String(
      examType || ""
    )
      .trim()
      .toLowerCase();


  switch (type) {
    case "final":
      return "نتيجة الاختبار النهائي";

    case "assignment":
      return "نتيجة الواجب";

    case "activity":
      return "نتيجة النشاط";

    case "quiz":
      return "نتيجة الاختبار القصير";

    default:
      return "نتيجة الاختبار";
  }
};