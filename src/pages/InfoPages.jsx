// src/pages/InfoPages.jsx
// صفحات المعلومات: من نحن، الشحن والاسترجاع، الخصوصية، تواصل معنا.
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import PageShell from "../components/layout/PageShell";
import useDocumentTitle from "../utils/useDocumentTitle";
import { WHATSAPP_NUMBER, DELIVERY_DAYS, RETURN_DAYS, STORE_EMAIL } from "../config/store";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "../context/CartContext";
import { formatPrice } from "../components/catalog/catalogConfig";

function Page({ title, intro, children }) {
  useDocumentTitle(`${title} | Velora`);
  return (
    <PageShell maxWidth="max-w-3xl">
      <nav aria-label="مسار الصفحة" className="mb-6 text-xs text-[#8C6F7B]">
        <Link to="/" className="hover:text-[#C2557A]">الرئيسية</Link> <span aria-hidden="true">/</span> {title}
      </nav>
      <h1 className="text-3xl font-bold text-[#4A2C3A] md:text-4xl">{title}</h1>
      {intro && <p className="mt-4 text-base leading-8 text-[#6B4A58]">{intro}</p>}
      <div className="mt-8 space-y-8">{children}</div>
    </PageShell>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-[#4A2C3A]">{title}</h2>
      <div className="space-y-3 text-sm leading-8 text-[#6B4A58]">{children}</div>
    </section>
  );
}

function WhatsAppCta({ text = "كلمينا على واتساب" }) {
  if (!WHATSAPP_NUMBER) return null;
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-12 items-center gap-2 rounded-full bg-[#1FAF5A] px-7 text-sm font-bold text-white transition hover:bg-[#188A47]"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
      {text}
    </a>
  );
}

export function AboutPage() {
  return (
    <Page title="من نحن" intro="Velora متجر مصري للعناية بالبشرة والمكياج والشنط والأحذية. بنختار منتجات بسيطة وأنيقة بأسعار مناسبة، ونوصلها لحد باب البيت.">
      <Section title="إحنا بنؤمن بإيه">
        <p>الجمال مش لازم يكون معقد ولا غالي. بنختار كل منتج بعناية، ونكتب عنه وصف واضح وصادق عشان تعرفي بتشتري إيه.</p>
        <p>بنقدّم الدفع عند الاستلام وتوصيل لكل محافظات مصر، وبنرد على استفساراتك على واتساب بشكل مباشر.</p>
      </Section>
      <Section title="هتلاقي عندنا">
        <ul className="list-disc space-y-1 pe-5">
          <li>العناية بالبشرة: سيروم، كريمات، تونر، غسول وواقي شمس.</li>
          <li>المكياج: ألوان يومية وناعمة.</li>
          <li>الشنط والأحذية: تصميمات عصرية للشغل والخروجات.</li>
        </ul>
      </Section>
      <div className="flex flex-wrap gap-3">
        <Link to="/shop" className="inline-flex h-12 items-center rounded-full bg-[#4A2C3A] px-8 text-sm font-bold text-white transition hover:bg-[#C2557A]">تسوّقي الآن</Link>
        <WhatsAppCta />
      </div>
    </Page>
  );
}

export function ShippingReturnsPage() {
  return (
    <Page title="الشحن والاسترجاع" intro="كل اللي محتاجة تعرفيه عن التوصيل والدفع والاسترجاع.">
      <Section title="التوصيل">
        <ul className="list-disc space-y-1 pe-5">
          <li>بنوصّل لكل محافظات مصر.</li>
          <li>مدة التوصيل المعتادة: {DELIVERY_DAYS}.</li>
          <li>رسوم الشحن {formatPrice(SHIPPING_FEE)}، والشحن مجاني للطلبات فوق {formatPrice(FREE_SHIPPING_THRESHOLD)}.</li>
          <li>هنتواصل معاكي بالتليفون أو واتساب لتأكيد الطلب وموعد التوصيل.</li>
        </ul>
      </Section>
      <Section title="الدفع">
        <p>الدفع عند الاستلام نقداً لمندوب الشحن. ولو الدفع بمحفظة اتصالات كاش متاح في صفحة الطلب، بتحوّلي المبلغ وبنأكد الطلب بعد وصول التحويل.</p>
      </Section>
      <Section title="الاسترجاع والاستبدال">
        <ul className="list-disc space-y-1 pe-5">
          <li>تقدري تطلبي الاسترجاع أو الاستبدال خلال {RETURN_DAYS} يوم من الاستلام.</li>
          <li>الشنط والأحذية: لازم تكون غير مستخدمة وبحالتها الأصلية.</li>
          <li>منتجات العناية والمكياج: لأسباب صحية، بنقبل استرجاعها لو كانت مقفولة وغير مستخدمة، أو لو وصلتك تالفة أو مختلفة عن طلبك.</li>
          <li>لو المنتج وصلك تالف أو غلط، كلمينا على واتساب بصورة للمنتج وهنحل الموضوع فوراً.</li>
        </ul>
      </Section>
      <WhatsAppCta text="عندك سؤال؟ كلمينا على واتساب" />
    </Page>
  );
}

export function PrivacyPage() {
  return (
    <Page title="سياسة الخصوصية" intro="بنحترم خصوصيتك وبنجمع أقل بيانات ممكنة لتنفيذ طلبك فقط.">
      <Section title="البيانات اللي بنجمعها">
        <p>عند إتمام الطلب بنحفظ: الاسم، رقم الموبايل، العنوان (المحافظة والمدينة والتفاصيل)، ملاحظات الطلب، والمنتجات المطلوبة وإجماليها.</p>
        <p>لا نطلب ولا نخزّن بيانات بطاقات بنكية على الموقع. الدفع عند الاستلام أو بتحويل محفظة.</p>
      </Section>
      <Section title="إزاي بنستخدمها">
        <p>نستخدم بياناتك فقط لتجهيز الطلب وشحنه والتواصل معاكي بخصوصه. لا نبيع بياناتك ولا نشاركها مع أي طرف لأغراض إعلانية.</p>
        <p>بيانات الطلبات بتتخزن على خدمة Google Firebase. وبنشاركها مع شركة الشحن بالقدر اللازم للتوصيل فقط.</p>
      </Section>
      <Section title="بيانات المتصفح">
        <p>الموقع بيحفظ سلة التسوق والمفضلة على جهازك (التخزين المحلي للمتصفح) عشان تلاقيهم لما ترجعي، ومبنستخدمش أي كوكيز إعلانية.</p>
      </Section>
      <Section title="حقوقك">
        <p>تقدري تطلبي تعديل أو حذف بياناتك في أي وقت عن طريق التواصل معنا.</p>
      </Section>
      <WhatsAppCta text="تواصلي معنا بخصوص بياناتك" />
    </Page>
  );
}

export function ContactPage() {
  return (
    <Page title="تواصل معنا" intro="أسرع طريقة للتواصل معانا هي واتساب. بنرد عليكي في أقرب وقت.">
      {WHATSAPP_NUMBER ? (
        <div className="rounded-2xl border border-[#F3D5DD] bg-white p-6">
          <p className="text-sm leading-8 text-[#6B4A58]">للاستفسار عن منتج، متابعة طلب، أو أي مساعدة:</p>
          <div className="mt-4"><WhatsAppCta text="ابدأي محادثة على واتساب" /></div>
        </div>
      ) : (
        <p className="text-sm text-[#6B4A58]">بيانات التواصل هتتضاف قريباً.</p>
      )}
      {STORE_EMAIL && <p className="text-sm text-[#6B4A58]">البريد الإلكتروني: {STORE_EMAIL}</p>}
      <Section title="قبل ما تتواصلي">
        <p>مواعيد التوصيل والرسوم والاسترجاع متوضحة في صفحة <Link to="/shipping-returns" className="font-bold text-[#C2557A] hover:underline">الشحن والاسترجاع</Link>.</p>
      </Section>
    </Page>
  );
}
