const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const COMMON_NAMES = {
  "احمد": "ahmed",
  "أحمد": "ahmed",
  "محمد": "mohamed",
  "محمود": "mahmoud",
  "مصطفى": "mostafa",
  "مصطفي": "mostafa",
  "علي": "ali",
  "على": "ali",
  "عمر": "omar",
  "مريم": "mariam",
  "مريام": "mariam",
  "سارة": "sara",
  "سارا": "sara",
  "نورا": "noura",
  "نورة": "noura",
  "نور": "noor",
  "خالد": "khaled",
  "خليل": "khalil",
  "يوسف": "youssef",
  "يحيى": "yehia",
  "يحيي": "yehia",
  "عبدالله": "abdallah",
  "عبد الله": "abdallah",
  "عبدالرحمن": "abdelrahman",
  "عبد الرحمن": "abdelrahman",
  "عبدالعزيز": "abdelaziz",
  "عبد العزيز": "abdelaziz",
  "حسن": "hassan",
  "حسين": "hussein",
  "ابراهيم": "ibrahim",
  "إبراهيم": "ibrahim",
  "اسماعيل": "ismail",
  "إسماعيل": "ismail",
  "طارق": "tarek",
  "عمرو": "amr",
  "هشام": "hesham",
  "هاني": "hani",
  "هانيه": "hania",
  "هناء": "hanaa",
  "منة": "menna",
  "منى": "mona",
  "مني": "mona",
  "دعاء": "doaa",
  "رحاب": "rehab",
  "آية": "aya",
  "اية": "aya",
  "ايه": "aya",
  "ملك": "malak",
  "جنى": "jana",
  "جنا": "jana",
  "ريم": "reem",
  "رانيا": "rania",
  "رانا": "rana",
  "كريم": "karim",
  "كاملة": "kamela",
  "وليد": "waleed",
  "زياد": "ziad",
  "معاذ": "moaz",
  "معز": "moez",
  "سالم": "salem",
  "صالح": "saleh",
  "عادل": "adel",
  "رامي": "ramy",
  "رنا": "rana",
  "روان": "rawan",
  "شهد": "shahd",
  "شيماء": "shaimaa",
  "فاطمة": "fatma",
  "فاطمه": "fatma",
  "زينب": "zeinab",
  "نجلاء": "naglaa",
  "نهى": "noha",
  "نهي": "noha",
};

const ARABIC_CHAR_MAP = {
  ا: "a",
  أ: "a",
  إ: "e",
  آ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "g",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  ة: "a",
  و: "o",
  ؤ: "o",
  ي: "y",
  ى: "a",
  ئ: "y",
  ء: "",
};

const cleanArabic = (value = "") =>
  String(value)
    .replace(ARABIC_DIACRITICS, "")
    .replace(/ـ/g, "")
    .trim();

const transliterateArabic = (value = "") =>
  cleanArabic(value)
    .split("")
    .map((char) => ARABIC_CHAR_MAP[char] ?? char)
    .join("");

export const normalizeCredentialPart = (value = "") => {
  const cleaned = cleanArabic(value);
  if (!cleaned) return "";

  const common = COMMON_NAMES[cleaned];
  const source = common || transliterateArabic(cleaned);

  return source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^\.+|\.+$/g, "");
};

export const generateNasaqEmail = (
  firstName,
  fatherName,
  { suffix = "", domain = "nasaq.edu" } = {}
) => {
  const first = normalizeCredentialPart(firstName);
  const father = normalizeCredentialPart(fatherName);

  if (!first && !father) return "";

  const base = [first, father].filter(Boolean).join(".") || "user";
  const normalizedSuffix = suffix ? `.${String(suffix).replace(/\D/g, "")}` : "";

  return `${base}${normalizedSuffix}@${domain}`;
};

const randomInt = (max) => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
};

const pick = (chars) => chars[randomInt(chars.length)];

export const generateStrongPassword = (length = 12) => {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "@#$!";
  const all = `${lower}${upper}${digits}${symbols}`;

  const chars = [
    pick(upper),
    pick(lower),
    pick(digits),
    pick(symbols),
  ];

  while (chars.length < Math.max(8, length)) {
    chars.push(pick(all));
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1);
    [chars[index], chars[target]] = [chars[target], chars[index]];
  }

  return chars.join("");
};

export const getTeacherNameParts = (fullName = "") => {
  const parts = cleanArabic(fullName)
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || "",
    fatherName: parts[1] || parts[0] || "",
  };
};

export const createDuplicateSafeEmail = (firstName, fatherName) =>
  generateNasaqEmail(firstName, fatherName, {
    suffix: 100 + randomInt(900),
  });

export const looksLikeDuplicateEmailError = (response) => {
  const message = String(response?.message || "").toLowerCase();

  return (
    response?.statusCode === 409 ||
    message.includes("email") &&
      (message.includes("exist") ||
        message.includes("duplicate") ||
        message.includes("already")) ||
    message.includes("البريد") &&
      (message.includes("موجود") || message.includes("مستخدم"))
  );
};
