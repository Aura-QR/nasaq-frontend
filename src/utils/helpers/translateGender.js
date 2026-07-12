export const translateGender = (gender , type = "student") => {
  switch (gender) {
    case "male":
      return type === "student" ? "ذكر" : "بنين";
    case "female":
      return type === "student" ? "أنثى" : "بنات";
    case "both":
      return "مشترك";
    default:
      return "غير محدد";
  }
};
