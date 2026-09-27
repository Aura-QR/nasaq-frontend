const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "@#$%";
const ALL = `${UPPER}${LOWER}${DIGITS}${SYMBOLS}`;

const randomNumber = (max) => {
  if (!max || max <= 0) {
    return 0;
  }

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.getRandomValues
  ) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);

    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
};

const pick = (characters) =>
  characters[randomNumber(characters.length)];

const shuffle = (values) => {
  const result = [...values];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const target = randomNumber(index + 1);

    [result[index], result[target]] = [
      result[target],
      result[index],
    ];
  }

  return result;
};

/**
 * كلمة مرور مؤقتة قوية نسبيًا:
 * - حرف كبير
 * - حرف صغير
 * - رقم
 * - رمز
 *
 * لا يتم حفظها في localStorage/sessionStorage.
 */
export const generateStudentEmail = () => {
  const now = new Date();

  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  // جزء عشوائي لتقليل احتمالية التكرار حتى لو تم إنشاء أكثر من طالب بسرعة.
  const randomPart = Array.from(
    { length: 6 },
    () => DIGITS[randomNumber(DIGITS.length)]
  ).join("");

  return `student${yy}${mm}${dd}${randomPart}@nasaq.edu`;
};

export const generateTemporaryPassword = (
  length = 12
) => {
  const safeLength = Math.max(
    Number(length) || 12,
    8
  );

  const password = [
    pick(UPPER),
    pick(LOWER),
    pick(DIGITS),
    pick(SYMBOLS),
  ];

  while (password.length < safeLength) {
    password.push(pick(ALL));
  }

  return shuffle(password).join("");
};

const normalizeText = (value) =>
  typeof value === "string"
    ? value.trim()
    : "";

const responseCandidates = (
  response,
  entityKey
) =>
  [
    response?.data?.[entityKey],
    response?.data?.data?.[entityKey],
    response?.[entityKey],

    response?.data?.user,
    response?.data?.data?.user,
    response?.user,

    response?.data?.data,
    response?.data,
    response,
  ].filter(Boolean);

/**
 * الـ Backend الحالي لا يعرّف username منفصلًا
 * في CreateTeacherDto / CreateStudentDto.
 *
 * لذلك نعرض معرّف الدخول الحقيقي القادم من الباك
 * إن وُجد، بالترتيب:
 * username -> schoolEmail -> loginIdentifier -> email
 *
 * ولو لم يرجع الباك أيًّا منها نستخدم البريد الذي
 * تم إدخاله في الفورم.
 */
export const extractLoginIdentifier = (
  response,
  fallback = "",
  entityKey = ""
) => {
  const keys = [
    "username",
    "schoolEmail",
    "school_email",
    "loginIdentifier",
    "loginEmail",
    "email",
  ];

  const candidates =
    responseCandidates(
      response,
      entityKey
    );

  for (const candidate of candidates) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }

    for (const key of keys) {
      const value =
        normalizeText(candidate?.[key]);

      if (value) {
        return value;
      }
    }
  }

  return normalizeText(fallback);
};

export const getCreatedEntityId = (
  response,
  entityKey = ""
) => {
  const candidates =
    responseCandidates(
      response,
      entityKey
    );

  for (const candidate of candidates) {
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }

    const id =
      candidate?._id ||
      candidate?.id;

    if (id) {
      return String(id);
    }
  }

  return "";
};

export const isFailedApiResponse = (
  response
) =>
  response?.status === false ||
  (
    typeof response === "string" &&
    response.trim().length > 0
  ) ||
  Number(response?.statusCode) >= 400;

export const getApiResponseMessage = (
  response,
  fallback = "حدث خطأ ما"
) =>
  response?.message ||
  response?.data?.message ||
  (
    typeof response === "string"
      ? response
      : fallback
  );
