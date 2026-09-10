import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AutoAwesomeRounded,
  CookieRounded,
  SecurityRounded,
  StorageRounded,
} from "@mui/icons-material";

import nasaqLogo from "../../images/wadq-logo.png";
import "./QuickPrepPrivacy.css";

const dataCards = [
  {
    icon: <CookieRounded />,
    title: "معلومات المصادقة",
    text: "تقرأ الإضافة ملف تعريف الارتباط _auth الخاص بمنصة نسق للتحقق من الجلسة وتنفيذ طلبات المستخدم المصرّح بها. يبقى رمز الجلسة في الذاكرة ولا يُحفظ في تخزين الإضافة.",
  },
  {
    icon: <StorageRounded />,
    title: "إعدادات الإضافة",
    text: "يُحفظ عنوان خادم نسق المعتمد باستخدام Chrome Sync، وقد يزامنه Chrome بين أجهزة المستخدم المسجّل بالحساب نفسه. لا تُحفظ كلمات المرور أو محتويات التحاضير في هذا التخزين.",
  },
  {
    icon: <AutoAwesomeRounded />,
    title: "البيانات التعليمية",
    text: "تعالج الإضافة ما يلزم لعرض الجدول والمنهج والتحاضير، مثل اسم المعلم ومعرّفات الحساب والحصص والمادة والصف والدرس وحالة التحضير والخيارات التي يحددها المستخدم.",
  },
];

function QuickPrepPrivacy() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content") ?? "";

    document.title = "سياسة خصوصية نسق — تحضير سريع";
    description?.setAttribute(
      "content",
      "سياسة خصوصية إضافة نسق — تحضير سريع لمتصفح Chrome.",
    );

    return () => {
      document.title = previousTitle;
      description?.setAttribute("content", previousDescription);
    };
  }, []);

  return (
    <div className="quick-prep-privacy" dir="rtl">
      <header className="privacy-header">
        <div className="privacy-shell privacy-header__inner">
          <Link to="/" className="privacy-brand" aria-label="العودة إلى منصة نسق">
            <img src={nasaqLogo} alt="شعار منصة نسق" />
          </Link>

          <Link to="/" className="privacy-home-link">
            العودة إلى الرئيسية
          </Link>
        </div>
      </header>

      <main>
        <section className="privacy-hero">
          <div className="privacy-shell privacy-hero__content">
            <span className="privacy-kicker">
              <SecurityRounded />
              الخصوصية وحماية البيانات
            </span>
            <h1>سياسة خصوصية إضافة «نسق — تحضير سريع»</h1>
            <p>
              توضّح هذه السياسة البيانات التي تتعامل معها إضافة نسق لمتصفح
              Chrome، ولماذا تحتاج إليها، وكيف تُستخدم عند إعداد تحاضير حصص
              الأسبوع.
            </p>
            <div className="privacy-effective-date">
              تاريخ السريان: 10 سبتمبر 2026
            </div>
          </div>
        </section>

        <article className="privacy-shell privacy-content">
          <section className="privacy-section privacy-intro">
            <h2>نطاق هذه السياسة</h2>
            <p>
              تنطبق هذه السياسة على إضافة «نسق — تحضير سريع». الإضافة أداة
              مساعدة لمستخدمي منصة نسق، وتعمل داخل الموقع الرسمي للمنصة لعرض
              الجدول والمنهج، وربط كل حصة بدرسها، وإنشاء التحاضير أو استكمالها
              وتوليد الإضافات التعليمية التي يطلبها المستخدم.
            </p>
          </section>

          <section className="privacy-section" aria-labelledby="handled-data">
            <h2 id="handled-data">البيانات التي تتعامل معها الإضافة</h2>
            <div className="privacy-data-grid">
              {dataCards.map((item) => (
                <div className="privacy-data-card" key={item.title}>
                  <span className="privacy-data-card__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="privacy-section">
            <h2>كيف نستخدم البيانات؟</h2>
            <ul>
              <li>التحقق من هوية المستخدم وصلاحياته داخل منصة نسق.</li>
              <li>عرض حصص الأسبوع والمناهج والدروس وحالات التحضير.</li>
              <li>حفظ اختيارات الدروس وإنشاء المسودات أو تحديثها.</li>
              <li>توليد المحتوى والإثراء والواجبات والأنشطة والاختبارات عند طلب المستخدم.</li>
              <li>إرسال التحاضير المكتملة للمراجعة وعرض نتائج العمليات والأخطاء.</li>
            </ul>
            <p>
              لا تستخدم الإضافة البيانات لإنشاء إعلانات، ولا تتتبّع نشاط
              المستخدم على مواقع أخرى، ولا تبيع بيانات المستخدمين.
            </p>
          </section>

          <section className="privacy-section privacy-highlight">
            <div>
              <span className="privacy-highlight__icon" aria-hidden="true">
                <AutoAwesomeRounded />
              </span>
            </div>
            <div>
              <h2>التوليد باستخدام الذكاء الاصطناعي</h2>
              <p>
                عند اختيار التوليد، يرسل خادم نسق بيانات تعليمية محدودة إلى
                سير عمل n8n ثم إلى خدمة Anthropic، مثل اسم الدرس والمادة والصف
                والوحدة والأهداف، لإنتاج المحتوى المطلوب. لا يُرسل ملف تعريف
                الارتباط أو رمز جلسة المستخدم إلى n8n أو Anthropic ضمن طلب
                التوليد.
              </p>
              <p>
                المحتوى الناتج مقترح آليًا، وعلى المعلم مراجعته قبل اعتماده أو
                إتاحته للطلاب.
              </p>
            </div>
          </section>

          <section className="privacy-section">
            <h2>مشاركة البيانات</h2>
            <p>
              تُنقل البيانات إلى خادم نسق لتقديم وظائف الإضافة. ولا تُشارك
              بيانات تعليمية مع n8n وAnthropic إلا عندما يطلب المستخدم ميزة
              التوليد، وبالقدر اللازم لتنفيذها. قد تُكشف البيانات كذلك إذا كان
              ذلك مطلوبًا بموجب القانون أو ضروريًا لحماية أمن المنصة ومستخدميها.
            </p>
            <p>
              لا نبيع بيانات المستخدمين، ولا ننقلها لأغراض إعلانية، ولا
              نستخدمها لتحديد الأهلية الائتمانية أو لأغراض الإقراض.
            </p>
          </section>

          <section className="privacy-section">
            <h2>التخزين والاحتفاظ</h2>
            <p>
              لا تدير الإضافة قاعدة بيانات مستقلة. تحتفظ الإضافة بعنوان خادم
              نسق المعتمد حتى يغيّره المستخدم أو يزيل الإضافة، بينما تبقى حالة
              العمل المؤقتة في صفحة نسق إلى أن تُغلق الصفحة أو تُعاد تحميلها.
              أما التحاضير والواجبات والأنشطة والاختبارات التي يحفظها المستخدم
              فتُخزّن ضمن حسابه في منصة نسق وتخضع لسياسات الاحتفاظ الخاصة
              بالمنصة والجهة التعليمية.
            </p>
          </section>

          <section className="privacy-section">
            <h2>الحماية والصلاحيات</h2>
            <p>
              تستخدم الإضافة اتصال HTTPS مع خدمات نسق الرسمية، وتطلب أقل قدر
              من الصلاحيات اللازمة لغرضها. يقتصر إذن ملفات تعريف الارتباط وإذن
              المضيف على التحقق من جلسة نسق وتشغيل واجهة التحضير داخل المنصة.
              جميع ملفات JavaScript وCSS التنفيذية مضمنة داخل حزمة الإضافة، ولا
              تنفّذ الإضافة رمزًا برمجيًا مستضافًا عن بُعد.
            </p>
          </section>

          <section className="privacy-section">
            <h2>التحكم في البيانات</h2>
            <p>
              يمكن للمستخدم إيقاف تعامل الإضافة مع البيانات بإغلاق لوحة
              التحضير أو تعطيل الإضافة أو إزالتها من Chrome. ولطلب الوصول إلى
              البيانات المحفوظة في منصة نسق أو تصحيحها أو حذفها، يتواصل
              المستخدم مع إدارة مدرسته أو مع قناة الدعم الرسمية المتاحة له في
              منصة نسق.
            </p>
          </section>

          <section className="privacy-section">
            <h2>الاستخدام المحدود</h2>
            <p>
              يقتصر استخدام البيانات التي تحصل عليها الإضافة على تقديم غرضها
              المعلن وتحسينه وحمايته. ولا تُستخدم البيانات أو تُنقل لأغراض غير
              مرتبطة بإعداد التحاضير، باستثناء ما يلزم لتقديم الخدمة أو الامتثال
              للقانون أو حماية المستخدمين والمنصة.
            </p>
          </section>

          <section className="privacy-section">
            <h2>تحديث السياسة والتواصل</h2>
            <p>
              قد تُحدّث هذه السياسة عند تغيير وظائف الإضافة أو ممارسات معالجة
              البيانات. سيظهر تاريخ السريان المحدّث أعلى الصفحة. للاستفسارات
              المتعلقة بالخصوصية، يُرجى التواصل عبر قناة الدعم الرسمية المتاحة
              في منصة نسق أو من خلال إدارة الجهة التعليمية المشتركة في الخدمة.
            </p>
          </section>
        </article>
      </main>

      <footer className="privacy-footer">
        <div className="privacy-shell privacy-footer__inner">
          <p>جميع الحقوق محفوظة لمنصة نسق © {new Date().getFullYear()}</p>
          <Link to="/">الصفحة الرئيسية</Link>
        </div>
      </footer>
    </div>
  );
}

export default QuickPrepPrivacy;
