import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isToday,
  startOfMonth,
  subMonths,
} from "date-fns";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { useStudentAttendance } from "@/utils/hooks/apis/student/useStudent";
import Loading from "@/components/Loading";

const WEEK_DAYS_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
];

const arabicWithEnglishNumbers = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  month: "long",
  year: "numeric",
});

const dayNumberFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
});

const isSchoolDay = (date) => {
  const weekDay = getDay(date);
  return weekDay !== 5 && weekDay !== 6;
};

const getStatusStyles = (status) => {
  if (status === "present") {
    return {
      label: "حاضر",
      color: "#0E9F6E",
      bg: "#E7F8F1",
      border: "#9DE2C6",
    };
  }

  if (status === "absent") {
    return {
      label: "غائب",
      color: "#D14343",
      bg: "#FDECEC",
      border: "#F4B5B5",
    };
  }

  return {
    label: "حاضر",
    color: "#0E9F6E",
    bg: "#E7F8F1",
    border: "#9DE2C6",
  };
};

const Attendance = () => {
  const [monthCursor, setMonthCursor] = useState(new Date());
  const { attendance, loading } = useStudentAttendance();

  const absentDays = useMemo(
    () =>
      new Set(
        (attendance || [])
          .map((item) => item?.date?.slice(0, 10))
          .filter(Boolean)
      ),
    [attendance]
  );

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const schoolDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(isSchoolDay);

  const monthlyStats = useMemo(() => {
    const absent = schoolDays.filter((day) => absentDays.has(format(day, "yyyy-MM-dd"))).length;
    const recorded = schoolDays.length;
    const present = recorded - absent;

    return {
      present,
      absent,
      recorded,
    };
  }, [absentDays, schoolDays]);

  const attendanceRate = monthlyStats.recorded
    ? Math.round((monthlyStats.present / monthlyStats.recorded) * 100)
    : 0;

  if (loading) {
    return <Loading />;
  }

  return (
    <Container noSidebar={true}>
      <Back title={"تقويم الحضور"} />

      <div className="mt-4 min-h-[calc(100vh-220px)] rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6 lg:p-12">
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#323449] sm:text-xl">عرض شهري لحالة الحضور</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#35413E]">
              تم استبعاد يومي الجمعة والسبت كعطلة، وباقي الأيام تعتبر حضور ما لم تسجل كغياب.
            </p>
          </div>

          <div className="flex w-full items-center justify-between gap-2 self-start sm:w-auto sm:justify-start md:self-auto">
            <button
              type="button"
              onClick={() => setMonthCursor((prev) => addMonths(prev, 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DEE3E2] bg-[#F9FAFB] text-[#323449] transition hover:border-[#318dce] hover:text-[#318dce]"
            >
              →
            </button>

            <div className="flex-1 text-center text-sm font-bold text-[#323449] sm:min-w-[170px] sm:flex-none sm:text-base">
              {arabicWithEnglishNumbers.format(monthCursor)}
            </div>

            <button
              type="button"
              onClick={() => setMonthCursor((prev) => subMonths(prev, 1))}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DEE3E2] bg-[#F9FAFB] text-[#323449] transition hover:border-[#318dce] hover:text-[#318dce]"
            >
              ←
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 md:mb-8 md:grid-cols-3">
          <div className="rounded-[10px] border border-[#9DE2C6] bg-[#E7F8F1] p-4">
            <p className="text-xs font-bold text-[#0E9F6E]">أيام الحضور</p>
            <p className="mt-1 text-2xl font-bold text-[#065F46]">{monthlyStats.present}</p>
          </div>

          <div className="rounded-[10px] border border-[#F4B5B5] bg-[#FDECEC] p-4">
            <p className="text-xs font-bold text-[#D14343]">أيام الغياب</p>
            <p className="mt-1 text-2xl font-bold text-[#991B1B]">{monthlyStats.absent}</p>
          </div>

          <div className="rounded-[10px] border border-[#BCD7FF] bg-[#EEF5FF] p-4">
            <p className="text-xs font-bold text-[#0F4C81]">نسبة الالتزام</p>
            <p className="mt-1 text-2xl font-bold text-[#0B3558]">{attendanceRate}%</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#E7F8F1] px-3 py-1 text-xs font-semibold text-[#0E9F6E]">
            حاضر
          </span>
          <span className="rounded-full bg-[#FDECEC] px-3 py-1 text-xs font-semibold text-[#D14343]">
            غائب
          </span>
          <span className="rounded-full bg-[#F3F6FB] px-3 py-1 text-xs font-semibold text-[#38506B]">
            إجمالي الأيام المسجلة: {monthlyStats.recorded}
          </span>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#6B7280]">
            الجمعة والسبت عطلة
          </span>
        </div>

        <div className="mb-6 h-px w-full bg-[#E5E7EB]" />

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[640px] grid-cols-5 gap-2 xl:gap-3">
            {WEEK_DAYS_AR.map((day) => (
              <div
                key={day}
                className="rounded-[10px] border border-[#E5E7EB] bg-[#F9FAFB] py-2 text-center text-xs font-bold text-[#35413E] sm:py-3"
              >
                {day}
              </div>
            ))}

            {schoolDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const status = absentDays.has(key) ? "absent" : "present";
              const statusStyles = getStatusStyles(status);
              const dayIsToday = isToday(day);

              return (
                <div
                  key={key}
                  className="min-h-[72px] rounded-[10px] border p-2 sm:min-h-[82px] sm:p-3 md:min-h-[96px]"
                  style={{
                    borderColor: dayIsToday ? "#318dce" : statusStyles.border,
                    borderWidth: dayIsToday ? 2 : 1,
                    backgroundColor: statusStyles.bg,
                  }}
                >
                  <div className="text-sm font-bold text-[#050F0D] sm:text-base">
                    {dayNumberFormatter.format(day)}
                  </div>

                  {dayIsToday && (
                    <div className="mt-2 text-xs font-bold text-[#1D4ED8]">اليوم</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Attendance;