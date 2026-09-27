const StatCard = ({ count, label, colorClass, bgClass, borderClass, Icon }) => (
  <div className={`rounded-2xl border ${borderClass} ${bgClass} p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl ${bgClass} border ${borderClass} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`text-2xl ${colorClass}`} />
    </div>
    <div>
      <p className={`text-2xl font-bold ${colorClass}`}>{count}</p>
      <p className={`text-xs font-semibold ${colorClass} opacity-80`}>{label}</p>
    </div>
  </div>
);

export default StatCard;