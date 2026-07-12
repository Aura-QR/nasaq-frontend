const getLectureOrder = (slot) => {
  const order = {
    "1": "الحصة الأولى",
    "2": "الحصة الثانية",
    "3": "الحصة الثالثة",
    "4": "الحصة الرابعة",
    "5": "الحصة الخامسة",
    "6": "الحصة السادسة",
    "7": "الحصة السابعة",
    "8": "الحصة الثامنة",
  };
  return order[slot] || 0;
};

export default getLectureOrder;