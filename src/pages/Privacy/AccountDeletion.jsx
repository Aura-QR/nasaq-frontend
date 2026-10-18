import { useEffect } from "react";
import { Link } from "react-router-dom";
import { DeleteOutlineRounded, EmailOutlined, InfoOutlined, SecurityRounded } from "@mui/icons-material";
import nasaqLogo from "../../images/wadq-logo.png";
import "./QuickPrepPrivacy.css";
import "./AccountDeletion.css";

const supportEmail = "qraura0@gmail.com";
const developer = "Huda Ayed A Alosaimi";
const subject = "طلب حذف حساب - نسق";
const body = "الاسم:\nالمدرسة:\nنوع الحساب:\nالبريد أو الجوال المسجّل:";
const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export default function AccountDeletion() {
  useEffect(() => {
    const oldTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const oldDescription = meta?.getAttribute("content");
    document.title = "طلب حذف الحساب — تطبيق نسق";
    meta?.setAttribute("content", "كيفية طلب حذف حساب نسق وبياناته، والمدة اللازمة للحذف والبيانات التي قد تحتفظ بها المدرسة.");
    return () => {
      document.title = oldTitle;
      if (meta) {
        if (oldDescription === null) meta.removeAttribute("content");
        else meta.setAttribute("content", oldDescription);
      }
    };
  }, []);

  return (
    <div className="quick-prep-privacy account-deletion" dir="rtl">
      <header className="privacy-header">
        <div className="privacy-shell privacy-header__inner">
          <Link to="/" className="privacy-brand" aria-label="العودة إلى منصة نسق">
            <img src={nasaqLogo} alt="شعار منصة نسق" />
          </Link>
          <Link to="/" className="privacy-home-link">العودة إلى الرئيسية</Link>
        </div>
      </header>

      <main>
        <section className="privacy-hero">
          <div className="privacy-shell privacy-hero__content">
            <span className="privacy-kicker"><SecurityRounded /> الخصوصية والتحكم بالبيانات</span>
            <h1>طلب حذف الحساب — تطبيق «نسق»</h1>
            <p>يوضح هذا الطلب كيفية حذف حسابك وبياناتك في تطبيق «نسق» لإدارة المدارس، المقدَّم من {developer}.</p>
            <div className="privacy-effective-date">نسق (Nasaq) · com.nasaq.app</div>
          </div>
        </section>

        <article className="privacy-shell privacy-content">
          <section className="privacy-section">
            <h2>كيفية طلب حذف الحساب</h2>
            <ol className="deletion-steps">
              <li>أرسل رسالة إلى البريد الإلكتروني <a href={`mailto:${supportEmail}`}>{supportEmail}</a> بعنوان «طلب حذف حساب».</li>
              <li>اذكر في الرسالة: الاسم الكامل، واسم المدرسة، ونوع الحساب (طالب/ولي أمر، معلم، موظف، مالك مدرسة)، والبريد الإلكتروني أو رقم الجوال المسجّل في الحساب.</li>
              <li>نتحقق من ملكية الحساب بالتواصل معك أو مع إدارة مدرستك، ثم ننفّذ الطلب <strong>خلال 30 يومًا</strong> ونبلغك بذلك.</li>
            </ol>
            <p>يمكنك أيضًا طلب الحذف عن طريق إدارة مدرستك مباشرة.</p>
            <a className="deletion-action" href={mailto}><EmailOutlined /> إرسال طلب الحذف</a>
            <p className="deletion-email-note">إذا لم يُفتح تطبيق البريد، يمكنك إرسال الطلب يدويًا إلى: <a href={`mailto:${supportEmail}`} dir="ltr">{supportEmail}</a></p>
          </section>

          <div className="deletion-grid">
            <section className="privacy-section">
              <h2><DeleteOutlineRounded aria-hidden="true" /> البيانات التي تُحذف</h2>
              <ul>
                <li>بيانات الحساب: الاسم، والبريد الإلكتروني، ورقم الجوال، واسم المستخدم، وكلمة المرور.</li>
                <li>رموز الإشعارات الخاصة بأجهزتك.</li>
                <li>مواقع تسجيل الحضور (للمعلمين والموظفين).</li>
                <li>الملفات التي رفعتها، مثل مرفقات الأعذار والصور.</li>
              </ul>
            </section>
            <section className="privacy-section">
              <h2><InfoOutlined aria-hidden="true" /> البيانات التي قد يُحتفظ بها</h2>
              <p>السجلات المدرسية الرسمية (الدرجات، والحضور والغياب، والسجل المالي) مملوكة للمدرسة، وقد تحتفظ بها المدرسة وفق أنظمتها والتزاماتها النظامية، وتبقى غير مرتبطة بحساب يمكن الدخول إليه.</p>
              <p>تُحذف النسخ الاحتياطية تلقائيًا خلال <strong>90 يومًا</strong>.</p>
            </section>
          </div>

          <section className="privacy-section privacy-highlight">
            <div><span className="privacy-highlight__icon" aria-hidden="true"><SecurityRounded /></span></div>
            <div>
              <h2>حذف حساب مدرسة كاملة</h2>
              <p>يطلبه مالك المدرسة بالطريقة نفسها، فتُحذف بيانات المدرسة وحسابات مستخدميها كافة.</p>
            </div>
          </section>

          <section className="privacy-section deletion-english" lang="en" dir="ltr">
            <h2>Delete your Nasaq account</h2>
            <p><strong>App:</strong> Nasaq (نسق). <strong>Developer:</strong> {developer}.</p>
            <ul>
              <li><strong>How to request:</strong> Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with the subject “Account deletion request”. Include your full name, school, account type (student/parent, teacher, staff, school owner), and the email or phone number on the account. You can also ask your school’s administration.</li>
              <li><strong>Timing:</strong> We verify the request and delete the account within 30 days.</li>
              <li><strong>Deleted:</strong> Account details (name, email, phone, username, password), device notification tokens, attendance check-in locations, and files you uploaded.</li>
              <li><strong>May be kept:</strong> Official school records (grades, attendance, fees) belong to the school and may be retained under its legal obligations, no longer linked to a usable account. Backups are erased within 90 days.</li>
            </ul>
          </section>
        </article>
      </main>

      <footer className="privacy-footer">
        <div className="privacy-shell privacy-footer__inner">
          <p>جميع الحقوق محفوظة لمنصة نسق © {new Date().getFullYear()}</p>
          <Link to="/privacy">سياسة الخصوصية</Link>
        </div>
      </footer>
    </div>
  );
}
