import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AttachFileRounded,
  BadgeRounded,
  LocationOnRounded,
  NotificationsActiveRounded,
  SchoolRounded,
  SecurityRounded,
} from "@mui/icons-material";

import nasaqLogo from "../../images/wadq-logo.png";
import "./QuickPrepPrivacy.css";

/*
 * سياسة خصوصية منصة نسق وتطبيقها — الرابط الذي يُقدَّم لمتجري Google Play
 * وApp Store. تصف ما يجمعه النظام فعلًا اليوم؛ أي ميزة جديدة تعالج بيانات
 * شخصية يجب أن تُذكر هنا قبل نشرها.
 */
const dataCards = [
  {
    icon: <BadgeRounded />,
    title: "بيانات الحساب",
    text: "الاسم، والبريد الإلكتروني أو اسم المستخدم، ورقم الجوال عند إدخاله، والدور في المدرسة (مالك، مدير، مساعد إداري، معلم، طالب، موظف خدمات). تُنشئ المدرسة هذه الحسابات، ولا يتيح التطبيق التسجيل الذاتي.",
  },
  {
    icon: <SchoolRounded />,
    title: "البيانات التعليمية",
    text: "الفصول والجداول والحصص، والحضور والغياب والتأخير، والدرجات والاختبارات والمشاريع، والمتابعة اليومية، والتحاضير، والأعذار والاستئذانات وقرارات مراجعتها.",
  },
  {
    icon: <LocationOnRounded />,
    title: "الموقع الجغرافي",
    text: "يُطلب الموقع عند تسجيل الحضور فقط، للتحقق من وجود المعلم أو الموظف داخل نطاق المدرسة. يُحفظ موقع لحظة التسجيل والمسافة من المدرسة ضمن سجل الحضور، ولا يُتتبَّع الموقع في الخلفية ولا بصورة مستمرة.",
  },
  {
    icon: <AttachFileRounded />,
    title: "الملفات المرفقة",
    text: "ما يرفعه المستخدم بنفسه، مثل التقارير الطبية المرفقة بالأعذار، وملفات تسليم المشاريع، ومرفقات التحضير. لا يصل التطبيق إلى ملفات الجهاز إلا ما يختاره المستخدم.",
  },
  {
    icon: <NotificationsActiveRounded />,
    title: "الإشعارات",
    text: "معرّف الجهاز اللازم لإرسال الإشعارات عبر Firebase Cloud Messaging، مثل إشعارات الغياب والأعذار والاحتياط والاستئذان.",
  },
];

function AppPrivacy() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute("content") ?? "";

    document.title = "سياسة الخصوصية — نسق";
    description?.setAttribute(
      "content",
      "سياسة خصوصية منصة نسق لإدارة المدارس وتطبيقها على أندرويد وiOS.",
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
            <h1>سياسة خصوصية منصة «نسق» وتطبيقها</h1>
            <p>
              توضّح هذه السياسة البيانات التي تعالجها منصة نسق لإدارة المدارس،
              على الموقع وفي تطبيق نسق لأجهزة أندرويد وiOS، ولماذا تحتاج إليها،
              وكيف تُحمى.
            </p>
            <div className="privacy-effective-date">
              تاريخ السريان: 7 أكتوبر 2026
            </div>
          </div>
        </section>

        <article className="privacy-shell privacy-content">
          <section className="privacy-section privacy-intro">
            <h2>نطاق هذه السياسة</h2>
            <p>
              نسق نظام تشغيل مدرسي تستخدمه المدارس لإدارة الطلاب والمعلمين
              والجداول والحضور والتحضير والدرجات. المدرسة هي التي تُنشئ حسابات
              مستخدميها وتُدخل بيانات طلابها، وهي المسؤولة عن هذه البيانات أمام
              أولياء الأمور، بما في ذلك الحصول على موافقتهم حيث يلزم. وتعالج نسق
              البيانات نيابةً عن المدرسة ولتقديم الخدمة لها فقط.
            </p>
          </section>

          <section className="privacy-section" aria-labelledby="handled-data">
            <h2 id="handled-data">البيانات التي نعالجها</h2>
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
              <li>تسجيل الدخول والتحقق من هوية المستخدم وصلاحياته داخل مدرسته.</li>
              <li>عرض الجداول والحصص وتسجيل الحضور والمتابعة والدرجات.</li>
              <li>إشعار المعنيين بالغياب والأعذار والاستئذانات والاحتياط وقرارات المراجعة.</li>
              <li>إعداد التقارير التي تطلبها إدارة المدرسة.</li>
              <li>حماية المنصة من الاستخدام غير المصرّح به.</li>
            </ul>
            <p>
              لا نستخدم البيانات للإعلانات، ولا نتتبّع نشاط المستخدم على تطبيقات
              أو مواقع أخرى، ولا نبيع بيانات المستخدمين.
            </p>
          </section>

          <section className="privacy-section privacy-highlight">
            <div>
              <span className="privacy-highlight__icon" aria-hidden="true">
                <LocationOnRounded />
              </span>
            </div>
            <div>
              <h2>الموقع الجغرافي</h2>
              <p>
                يطلب التطبيق إذن الموقع أثناء استخدامه فقط، ويستعمله لحظة تسجيل
                المعلم أو الموظف حضوره أو انصرافه، للتأكد من وجوده داخل نطاق
                المدرسة. لا يعمل تحديد الموقع في الخلفية، ولا يُطلب من الطلاب.
                ويمكن للمستخدم رفض الإذن، فيُسجَّل حضوره عندئذٍ من قبل إدارة
                المدرسة.
              </p>
            </div>
          </section>

          <section className="privacy-section">
            <h2>مشاركة البيانات</h2>
            <p>
              لا تُشارك البيانات إلا مع مقدمي الخدمات الذين نحتاجهم لتشغيل
              المنصة، وبالقدر اللازم لذلك:
            </p>
            <ul>
              <li>مزوّد الاستضافة الذي تعمل عليه خوادم نسق وقاعدة بياناتها.</li>
              <li>Firebase Cloud Messaging من Google لإيصال الإشعارات إلى الأجهزة.</li>
              <li>
                خدمة الذكاء الاصطناعي (Anthropic) عند طلب المعلم توليد محتوى
                للتحضير؛ ويُرسل حينها محتوى تعليمي محدود كاسم الدرس والمادة
                والصف والأهداف، دون بيانات الطلاب.
              </li>
              <li>
                خدمة واتساب لإرسال بيانات الدخول إلى المعلم أو ولي أمر الطالب عند
                إنشاء الحساب أو إعادة تعيين كلمة المرور، على الرقم الذي أدخلته
                المدرسة.
              </li>
            </ul>
            <p>
              وقد تُكشف البيانات إذا كان ذلك مطلوبًا بموجب القانون أو ضروريًا
              لحماية أمن المنصة ومستخدميها.
            </p>
          </section>

          <section className="privacy-section">
            <h2>بيانات الطلاب</h2>
            <p>
              لا ينشئ الطالب حسابه بنفسه؛ تُدخل المدرسة بياناته وتمنحه حسابًا
              للاطلاع على جدوله وواجباته ودرجاته. يرى الطالب بياناته فقط، ولا
              تُستخدم بيانات الطلاب لأي غرض خارج العملية التعليمية في مدرستهم.
            </p>
          </section>

          <section className="privacy-section">
            <h2>الحماية</h2>
            <p>
              تتصل التطبيقات بخوادم نسق عبر HTTPS، وتُحفظ كلمات المرور مشفّرة
              تشفيرًا أحاديًا، ويُحفظ رمز الدخول على الجهاز في التخزين الآمن.
              وتُفصل بيانات كل مدرسة عن غيرها، ولا يصل المستخدم إلا إلى ما تسمح
              به صلاحيات دوره في مدرسته.
            </p>
          </section>

          <section className="privacy-section">
            <h2>الاحتفاظ والحذف</h2>
            <p>
              تُحفظ البيانات ما دامت المدرسة مشتركة في الخدمة، أو المدة التي
              تحددها المدرسة لسجلاتها. ولطلب الوصول إلى البيانات أو تصحيحها أو
              حذفها، أو حذف الحساب، يتواصل المستخدم مع إدارة مدرسته، إذ إنها
              الجهة التي أنشأت الحساب وتملك إدارته. وعند انتهاء اشتراك المدرسة
              تُحذف بياناتها أو تُسلَّم إليها وفق الاتفاق معها.
            </p>
          </section>

          <section className="privacy-section">
            <h2>تحديث السياسة والتواصل</h2>
            <p>
              قد تُحدّث هذه السياسة عند تغيير وظائف المنصة أو ممارسات معالجة
              البيانات، ويظهر تاريخ السريان المحدّث أعلى الصفحة. للاستفسارات
              المتعلقة بالخصوصية، يُرجى التواصل مع إدارة المدرسة أو عبر قناة
              الدعم الرسمية المتاحة في منصة نسق.
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

export default AppPrivacy;
