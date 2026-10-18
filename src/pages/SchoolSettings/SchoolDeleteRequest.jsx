import { Link } from "react-router-dom";
import { useAuthUser } from "react-auth-kit";

const SUPPORT = "qraura0@gmail.com";

export default function SchoolDeleteRequest() {
  const getAuthUser = useAuthUser();
  const session = getAuthUser?.() || {};
  const user = session?.user || session?.data?.user || session;
  const school = user?.school?.name || user?.schoolName || "";
  const name = user?.name || user?.fullName || "";
  const subject = "طلب حذف مدرسة بالكامل - نسق";
  const body = `السلام عليكم،\nأرغب في طلب حذف المدرسة بالكامل من منصة نسق.\nاسم المدرسة: ${school}\nاسم مالك المدرسة: ${name}\nبريد التواصل: \n\nأقرّ بأنني أطلب مراجعة حذف المدرسة وما يرتبط بها من حسابات وبيانات، وأنتظر التحقق من ملكية المدرسة وتوضيح ما سيُحذف وما يجب الاحتفاظ به قانونيًا قبل التنفيذ.`;
  const mailto = `mailto:${SUPPORT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <main dir="rtl" style={{maxWidth: 820, margin: "36px auto", padding: "0 20px", fontFamily: "inherit", color: "#133657"}}>
      <Link to="/school/settings" style={{color: "#245b88"}}>→ العودة إلى إعدادات المدرسة</Link>
      <section style={{marginTop: 22, background: "#fff", border: "1px solid #eadbc1", borderRadius: 18, padding: "28px 24px", boxShadow: "0 8px 24px #1737540c"}}>
        <h1 style={{fontSize: "clamp(23px, 3vw, 32px)", marginTop: 0}}>طلب حذف المدرسة بالكامل</h1>
        <p>هذه الخدمة مخصصة لمالك المدرسة فقط. يمكنك إرسال طلب لمراجعة حذف المدرسة من منصة نسق.</p>
        <div style={{background: "#fff4eb", border: "1px solid #f0d1b1", borderRadius: 12, padding: 18, lineHeight: 2}}>
          <strong>تنبيه مهم قبل إرسال الطلب</strong>
          <p style={{margin: 0}}>قد يشمل حذف المدرسة الحسابات المرتبطة بها وبيانات الطلاب والمعلمين والسجلات. لن يتم الحذف تلقائيًا من هذه الصفحة؛ سيراجع فريق الدعم الطلب ويتحقق من صلاحية مالك المدرسة ويحدد البيانات التي يمكن حذفها أو يلزم الاحتفاظ بها.</p>
        </div>
        <p>لطلب الحذف، اضغط الزر التالي وأرسل الرسالة من بريدك المسجّل في المنصة إن أمكن.</p>
        <a href={mailto} style={{display: "inline-block", padding: "13px 22px", borderRadius: 12, color: "white", background: "#123b60", textDecoration: "none", fontWeight: 700}}>إرسال طلب حذف المدرسة</a>
        <p style={{fontSize: 14, lineHeight: 1.8}}>إذا لم يفتح تطبيق البريد، أرسل رسالتك يدويًا إلى: <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a></p>
      </section>
    </main>
  );
}
