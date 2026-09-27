import { MenuBook } from "@mui/icons-material";
import SUBJECT_PALETTES from "@/utils/constants/SubjectPalettes";
import { Link } from "react-router-dom";

const SubjectCard = ({ subject, index }) => {
  const palette = SUBJECT_PALETTES[index % SUBJECT_PALETTES.length];

  return (
    <Link to={`/student-dashboard/subjects/${subject._id}`} className={`group relative overflow-hidden rounded-2xl border ${palette.border} ${palette.bg} p-6 flex flex-col items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-500 cursor-pointer`}>
      {/* Decorative half-circles in corner */}
      <span className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full ${palette.badge} opacity-[0.13] pointer-events-none transition-transform duration-500 group-hover:scale-[3]`} />
      <span className={`absolute -bottom-4 -right-4 w-14 h-14 rounded-full ${palette.badge} opacity-[0.09] pointer-events-none transition-transform duration-500 group-hover:scale-[3]`} />

      {/* Icon circle */}
      <div className={`relative z-10 w-14 h-14 rounded-full border ${palette.border} bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <MenuBook className={`text-2xl ${palette.icon}`} />
      </div>

      {/* Subject name */}
      <p className="relative z-10 text-base font-bold text-gray-800 text-center leading-snug">
        {subject.subjectName}
      </p>

      {/* Subject code badge - top left corner */}
      {subject.subjectCode && (
        <span
          className={`absolute top-3 left-3 z-10 ${palette.badge} text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide`}
        >
          {subject.subjectCode}
        </span>
      )}
    </Link>
  );
};

export default SubjectCard;
