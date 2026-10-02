/**
 * Long-form page copy (About, Privacy, Terms) in both languages.
 * The legal text is a starting point written for a UAE business; have it reviewed
 * by a lawyer before launch and update LAST_UPDATED when it changes.
 */
import type { Locale } from "@/i18n/routing";
import { REPORT_WINDOW_HOURS } from "@/lib/policy";
import { DUBAI_AREAS } from "@/lib/seo/config";

export const LAST_UPDATED = "2026-09-30";

/** A service the admin can switch off: copy about it is only shown while it's on. */
export type Need = "store" | "moving" | "technician";
export type ServicesOn = Record<Need, boolean>;
/** A paragraph, or one about a service (left out while that service is off). */
type Paragraph = string | { text: string; needs: Need };

export type Section = { heading: string; body: string[]; /** Anchor for deep links, e.g. /terms#returns */ id?: string };
type Faq = { q: string; a: string; needs?: Need };

type Page = {
  title: string;
  description: string;
  intro: string;
  sections: (Omit<Section, "body"> & { body: Paragraph[] })[];
  /** Short breadcrumb label. */
  crumb?: string;
  /** Shown under the page with FAQPage structured data. */
  faqs?: Faq[];
};

const about: Record<Locale, Page> = {
  en: {
    title: "About LoopHome",
    description:
      "LoopHome is a Dubai-based company that buys, refurbishes and resells used furniture and appliances in Dubai and across the UAE.",
    intro:
      "LoopHome gives good home items a second life. Based in Dubai, we buy used furniture, appliances and everyday things, restore them in our own workshop and sell them at fair prices.",
    sections: [
      {
        heading: "What we do",
        body: [
          "Most items in our store were bought by us and then inspected, cleaned and, where needed, repaired by our team before listing. We also show items listed by their owners: these are clearly tagged \"Unchecked by our experts\". We sell them on the owner's behalf and deliver them, but we don't inspect or guarantee them.",
          "Every item shows a condition tag (New, Premium, Semi-new, Good condition or Fair) and real photos; items we sell ourselves also list what we fixed.",
        ],
      },
      {
        heading: "Why it matters",
        body: [
          "Moving homes, upgrading or decluttering often means perfectly usable things end up in a skip. Buying refurbished saves money and keeps furniture and appliances out of landfill.",
        ],
      },
      {
        heading: "How it works",
        body: [
          {
            text: "Buying: choose an item, tap Buy, and we confirm on WhatsApp. You pay cash on delivery, and you can add services such as installation or assembly where an item offers them.",
            needs: "store",
          },
          "Selling: send photos of your item. We reply with a cash offer on WhatsApp, collect it from your home, and pay you on pickup.",
        ],
      },
      {
        heading: "Moving and home services",
        body: [
          { text: "We move apartments, villas and offices within Dubai and between emirates, always starting with a free site visit.", needs: "moving" },
          {
            text: "Our technicians handle plumbing, electrical work, AC maintenance, curtains and blinds, furniture assembly and small repairs.",
            needs: "technician",
          },
        ],
      },
      {
        heading: "Who we help",
        body: [
          "People moving into, around and out of Dubai: newcomers furnishing an unfurnished apartment, families moving between communities, residents leaving the UAE at the end of a contract, and companies setting up or moving an office.",
        ],
      },
      {
        heading: "Where we operate",
        body: [
          `We're based in Dubai, with our warehouse in Al Quoz, and do most of our work here, all over the city, including ${DUBAI_AREAS.map((a) => a.en).join(", ")}. We also serve Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain and Al Ain.`,
        ],
      },
    ],
  },
  ar: {
    title: "عن لوب هوم",
    description:
      "لوب هوم شركة مقرّها دبي تشتري الأثاث والأجهزة المستعملة وتجدّدها وتعيد بيعها في دبي وجميع الإمارات.",
    intro:
      "لوب هوم يمنح الأغراض المنزلية الجيدة حياة ثانية. من مقرّنا في دبي نشتري الأثاث والأجهزة والأغراض اليومية المستعملة، ونجدّدها في ورشتنا، ونبيعها بأسعار عادلة.",
    sections: [
      {
        heading: "ماذا نفعل",
        body: [
          "معظم القطع في متجرنا اشتريناها ثم فحصناها ونظّفناها وأصلحناها عند الحاجة قبل عرضها. ونعرض أيضاً قطعاً يعرضها أصحابها، وتحمل بوضوح وسم \"غير مفحوص من خبرائنا\"، نبيعها نيابة عن أصحابها ونوصلها، لكننا لا نفحصها ولا نضمنها.",
          "تحمل كل قطعة وسماً لحالتها (جديد، ممتاز، شبه جديد، حالة جيدة، مقبول) وصوراً حقيقية، وتعرض القطع التي نبيعها بأنفسنا أيضاً قائمة بما أصلحناه.",
        ],
      },
      {
        heading: "لماذا يهمّ ذلك",
        body: [
          "عند الانتقال أو التجديد يُرمى كثير من الأغراض الصالحة للاستخدام. شراء القطع المجدّدة يوفّر المال ويقلّل النفايات.",
        ],
      },
      {
        heading: "كيف نعمل",
        body: [
          {
            text: "الشراء: اختر قطعة واضغط شراء، ونؤكد الطلب عبر واتساب. تدفع نقداً عند الاستلام، ويمكنك إضافة خدمات مثل التركيب أو التجميع إن كانت متاحة للقطعة.",
            needs: "store",
          },
          "البيع: أرسل صور القطعة، نرسل لك عرضاً نقدياً عبر واتساب، ونستلمها من منزلك وندفع لك عند الاستلام.",
        ],
      },
      {
        heading: "النقل والخدمات المنزلية",
        body: [
          { text: "ننقل الشقق والفلل والمكاتب داخل دبي وبين الإمارات، ونبدأ دائماً بزيارة معاينة مجانية.", needs: "moving" },
          { text: "يتولى فنيونا السباكة والكهرباء وصيانة المكيفات والستائر والبرادي وتجميع الأثاث والإصلاحات الصغيرة.", needs: "technician" },
        ],
      },
      {
        heading: "من نخدم",
        body: [
          "كل من ينتقل إلى دبي أو داخلها أو يغادرها: القادمون الجدد الذين يؤثثون شقة غير مفروشة، والعائلات التي تنتقل بين المناطق، والمقيمون الذين يغادرون الإمارات مع نهاية عقودهم، والشركات التي تجهّز مكتباً جديداً أو تنقل مكتبها.",
        ],
      },
      {
        heading: "أين نعمل",
        body: [
          `مقرّنا في دبي ومستودعنا في القوز، ومعظم عملنا في جميع أنحاء المدينة، ومنها ${DUBAI_AREAS.map((a) => a.ar).join("، ")}. ونخدم أيضاً أبوظبي والشارقة وعجمان ورأس الخيمة والفجيرة وأم القيوين والعين.`,
        ],
      },
    ],
  },
};

const privacy: Record<Locale, Page> = {
  en: {
    title: "Privacy Policy",
    description:
      "How LoopHome collects, uses and protects your personal data when you buy, sell or list items or book a service in the UAE, and how to reach us about it.",
    intro:
      "This policy explains what personal data LoopHome collects, why, and how we protect it, in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data.",
    sections: [
      {
        heading: "Data we collect",
        body: [
          "When you order: your name, phone number, emirate or city, area, delivery address and any notes you add.",
          "When you sell to us: your name, phone number, city and area, photos and a description of the item, and your asking price.",
          "When you request a move or a technician visit: your name, phone number, addresses and floor, preferred dates, a description of the job and any photos you send.",
          "If you ask for a refund by bank transfer: the bank account details you give us for that refund.",
          "Technical data: your IP address and basic request logs, used to prevent spam and abuse.",
          "We do not ask you to create an account, and we do not collect payment card details. Payment is cash on delivery.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "To confirm and deliver your order, arrange installation or other services you requested, and contact you by phone or WhatsApp.",
          "To review items you offer us, make an offer, and arrange collection.",
          "To protect the service from fraud and spam.",
          "We do not sell your personal data or use it for third-party advertising.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Only with service providers who help us run LoopHome, such as hosting, image storage and email delivery, and only as needed. They must keep your data confidential.",
          "We talk to customers on WhatsApp, which is run by Meta. Messages you send there are also subject to WhatsApp's own terms and privacy policy.",
          "Some of these providers store data outside the UAE. We only use providers that protect personal data to a standard consistent with UAE law.",
          "We may disclose data where UAE law requires it.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Order and sell-request records are kept for as long as needed for the transaction, warranties and our legal and accounting obligations, then deleted or anonymised.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask to access, correct or delete your personal data, or object to how we use it. Contact us using the details on our Contact page and we will respond within 30 days.",
          "If you are not satisfied with our answer, you can complain to the UAE Data Office.",
        ],
      },
      {
        heading: "Security",
        body: ["We use encrypted connections (HTTPS), restrict staff access to what they need, and protect admin accounts with passwords."],
      },
      {
        heading: "Cookies",
        body: ["The website does not use advertising or analytics cookies. Your browser may store basic settings needed for the site to work."],
      },
      {
        heading: "Changes",
        body: ["We may update this policy. The date at the top shows when it last changed."],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    description: "كيف يجمع لوب هوم بياناتك الشخصية ويستخدمها ويحميها عند الشراء منّا أو البيع لنا في الإمارات، وحقوقك وفق قانون حماية البيانات الإماراتي.",
    intro:
      "توضح هذه السياسة البيانات الشخصية التي يجمعها لوب هوم، وسبب جمعها، وكيف نحميها، بما يتوافق مع المرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية في دولة الإمارات.",
    sections: [
      {
        heading: "البيانات التي نجمعها",
        body: [
          "عند الطلب: الاسم ورقم الهاتف والإمارة أو المدينة والمنطقة وعنوان التوصيل وأي ملاحظات تضيفها.",
          "عند البيع لنا: الاسم ورقم الهاتف والمدينة والمنطقة وصور القطعة ووصفها والسعر المطلوب.",
          "عند طلب النقل أو زيارة فني: الاسم ورقم الهاتف والعناوين والطابق والمواعيد المفضلة ووصف العمل وأي صور ترسلها.",
          "إذا طلبت استرداد المبلغ بتحويل بنكي: بيانات الحساب البنكي التي تعطينا إياها لهذا الغرض.",
          "بيانات تقنية: عنوان IP وسجلات الطلبات الأساسية، لمنع الرسائل المزعجة وإساءة الاستخدام.",
          "لا نطلب منك إنشاء حساب، ولا نجمع بيانات البطاقات البنكية. الدفع نقداً عند الاستلام.",
        ],
      },
      {
        heading: "كيف نستخدمها",
        body: [
          "لتأكيد طلبك وتوصيله، وترتيب التركيب أو الخدمات الأخرى التي طلبتها، والتواصل معك هاتفياً أو عبر واتساب.",
          "لمراجعة القطع التي تعرضها علينا، وتقديم عرض، وترتيب الاستلام.",
          "لحماية الخدمة من الاحتيال والرسائل المزعجة.",
          "لا نبيع بياناتك الشخصية ولا نستخدمها لإعلانات أطراف أخرى.",
        ],
      },
      {
        heading: "مع من نشاركها",
        body: [
          "فقط مع مزوّدي الخدمات الذين يساعدوننا في تشغيل لوب هوم، مثل الاستضافة وتخزين الصور وإرسال البريد، وبالقدر اللازم فقط، مع التزامهم بسرّيتها.",
          "نتواصل مع العملاء عبر واتساب الذي تديره شركة Meta، وتخضع الرسائل المرسلة عبره أيضاً لشروط واتساب وسياسة خصوصيته.",
          "يخزّن بعض هؤلاء المزوّدين البيانات خارج الإمارات، ولا نتعامل إلا مع مزوّدين يحمون البيانات الشخصية بمستوى يتوافق مع القانون الإماراتي.",
          "قد نفصح عن البيانات عندما يتطلب القانون الإماراتي ذلك.",
        ],
      },
      {
        heading: "مدة الاحتفاظ",
        body: [
          "نحتفظ بسجلات الطلبات وطلبات البيع طوال المدة اللازمة لإتمام المعاملة والضمان والتزاماتنا القانونية والمحاسبية، ثم نحذفها أو نجعلها مجهولة الهوية.",
        ],
      },
      {
        heading: "حقوقك",
        body: [
          "يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها أو الاعتراض على طريقة استخدامها. تواصل معنا عبر البيانات في صفحة تواصل معنا وسنرد خلال 30 يوماً.",
          "إذا لم تكن راضياً عن ردّنا، يمكنك تقديم شكوى إلى مكتب البيانات الإماراتي.",
        ],
      },
      {
        heading: "الأمان",
        body: ["نستخدم اتصالات مشفّرة (HTTPS)، ونقصر وصول الموظفين على ما يحتاجونه، ونحمي حسابات الإدارة بكلمات مرور."],
      },
      {
        heading: "ملفات تعريف الارتباط",
        body: ["لا يستخدم الموقع ملفات تعريف ارتباط إعلانية أو تحليلية، وقد يحفظ متصفحك إعدادات أساسية لازمة لعمل الموقع."],
      },
      {
        heading: "التعديلات",
        body: ["قد نحدّث هذه السياسة، ويوضح التاريخ في الأعلى آخر تعديل."],
      },
    ],
  },
};

const terms: Record<Locale, Page> = {
  en: {
    title: "Terms & Conditions",
    description: "The terms for buying from LoopHome, including owner listings, and for selling or listing your used items in the UAE: delivery, fees, warranty and returns.",
    intro:
      "These terms apply when you use the LoopHome website to order an item or to offer an item for us to buy. By placing an order or sending a request you agree to them.",
    sections: [
      {
        heading: "Who we are",
        body: ["LoopHome buys, refurbishes and resells used home items in the United Arab Emirates. LoopHome also sells items on behalf of their owners (owner listings); see \"Owner listings\" below."],
      },
      {
        heading: "Items and condition",
        body: [
          "Items are pre-owned unless marked New. For items we sell ourselves, we describe the condition honestly, with real photos and the repairs we made; minor signs of use may remain. Owner listings are described by their owners (see Owner listings).",
          "Each item is unique. Once it is reserved or sold it is no longer available.",
        ],
      },
      {
        heading: "Orders",
        body: [
          "Tapping Buy sends an order request, which reserves the item. The order is confirmed when our team contacts you by phone or WhatsApp.",
          "We may cancel an order, for example if we cannot reach you, we cannot deliver to the address, or the item is found to be faulty. In that case you pay nothing.",
        ],
      },
      {
        heading: "Prices, delivery and service fees",
        body: [
          "Prices are in UAE dirhams (AED). The delivery fee depends on the emirate, and delivery is free on some items and orders.",
          "Optional services such as installation, assembly or parts are charged at the price shown when you order, and some are free. The order total shown before you submit includes the item, delivery and any services.",
          "Payment is cash on delivery or on collection.",
        ],
      },
      {
        heading: "Negotiation",
        body: ["For items marked Negotiable you may discuss the price with us on WhatsApp. An agreed price applies only once we confirm it in writing."],
      },
      {
        heading: "Owner listings",
        id: "owner-listings",
        body: [
          "Items tagged \"Unchecked by our experts\" are listed by their owners. LoopHome sells them on the owner's behalf, handles your order and delivers them; you pay cash on delivery.",
          "LoopHome does not inspect these items and does not verify, endorse or guarantee their description, photos or condition, and is not responsible for any inaccuracies, errors or omissions in them. They carry no warranty.",
          "The owner's contact details are kept private and are not shown on the listing.",
          // TODO(user): confirm whether buyers can inspect/refuse owner listings at delivery and which returns rules apply; until then the returns section is unchanged.
        ],
      },
      {
        heading: "Warranty",
        id: "warranty",
        body: [
          "Where an item shows a warranty period, we will repair or replace it, or refund you, if it develops a fault covered by the warranty during that period. Damage from misuse, accidents or moving the item yourself is not covered.",
        ],
      },
      {
        heading: "Returns and refunds",
        id: "returns",
        body: [
          "Please inspect the item when it arrives. You may refuse it at the door if it is damaged or not as described, and you pay nothing.",
          `If an item does not match its description, tell us on WhatsApp within ${REPORT_WINDOW_HOURS} hours of delivery. We will collect it free of charge and refund the full amount you paid, including delivery and service fees.`,
          "Because every item is pre-owned and unique, we do not accept change-of-mind returns once an item has been accepted, except where the law requires it.",
          "Refunds are paid in cash when we collect the item, or by bank transfer within 7 working days if you prefer.",
          "Nothing in these terms limits your rights under UAE consumer protection law (Federal Law No. 15 of 2020).",
        ],
      },
      {
        heading: "Selling your items to us",
        body: [
          "Sending a sell request does not oblige either side. Any price is agreed with you on WhatsApp before collection.",
          "You confirm that you own the item and have the right to sell it. The item becomes LoopHome's property when we collect it and pay the agreed price.",
          "Listing your item instead: you set the price, and after our approval the item is shown for the listing period stated on the Sell form. When it sells, we collect it from you, deliver it to the buyer, and pay you the price minus the commission stated on the Sell form. Your contact details are never shown publicly.",
          "LoopHome does not accept donations.",
        ],
      },
      {
        heading: "Liability",
        body: ["To the extent UAE law allows, our liability for any order is limited to the amount you paid for it."],
      },
      {
        heading: "Governing law",
        body: ["These terms are governed by the laws of the United Arab Emirates, and the competent courts of Dubai have jurisdiction."],
      },
    ],
  },
  ar: {
    title: "الشروط والأحكام",
    description: "شروط الشراء من لوب هوم، بما فيها إعلانات المالكين، وبيع أغراضك المستعملة لنا أو عرضها لدينا في الإمارات: التوصيل والرسوم والضمان والإرجاع.",
    intro:
      "تنطبق هذه الشروط عند استخدامك موقع لوب هوم لطلب قطعة أو لعرض قطعة لنشتريها. بإرسال طلب شراء أو بيع فإنك توافق عليها.",
    sections: [
      {
        heading: "من نحن",
        body: ["يشتري لوب هوم الأغراض المنزلية المستعملة ويجدّدها ويعيد بيعها في دولة الإمارات العربية المتحدة، كما يبيع قطعاً نيابة عن أصحابها (إعلانات المالكين)، انظر قسم \"إعلانات المالكين\" أدناه."],
      },
      {
        heading: "القطع وحالتها",
        body: [
          "القطع مستعملة ما لم يُذكر أنها جديدة. نصف حالة القطع التي نبيعها بأنفسنا بصدق، مع صور حقيقية والإصلاحات التي أجريناها، وقد تبقى آثار استخدام بسيطة. أما إعلانات المالكين فيصفها أصحابها (انظر قسم إعلانات المالكين).",
          "كل قطعة فريدة، وبمجرد حجزها أو بيعها لا تعود متاحة.",
        ],
      },
      {
        heading: "الطلبات",
        body: [
          "الضغط على شراء يرسل طلباً ويحجز القطعة. يتم تأكيد الطلب عندما يتواصل معك فريقنا هاتفياً أو عبر واتساب.",
          "قد نلغي الطلب، مثلاً إذا تعذّر التواصل معك، أو تعذّر علينا التوصيل إلى العنوان، أو ظهر عيب في القطعة، ولن تدفع شيئاً في هذه الحالة.",
        ],
      },
      {
        heading: "الأسعار والتوصيل ورسوم الخدمات",
        body: [
          "الأسعار بالدرهم الإماراتي. تعتمد رسوم التوصيل على الإمارة، والتوصيل مجاني لبعض القطع والطلبات.",
          "تُحتسب الخدمات الاختيارية مثل التركيب أو التجميع أو قطع الغيار بالسعر المعروض عند الطلب، وبعضها مجاني. يشمل المجموع المعروض قبل الإرسال سعر القطعة والتوصيل والخدمات.",
          "الدفع نقداً عند التوصيل أو الاستلام.",
        ],
      },
      {
        heading: "التفاوض",
        body: ["للقطع القابلة للتفاوض يمكنك مناقشة السعر معنا عبر واتساب، ولا يُعتمد السعر المتفق عليه إلا بعد تأكيدنا له كتابياً."],
      },
      {
        heading: "إعلانات المالكين",
        id: "owner-listings",
        body: [
          "القطع التي تحمل وسم \"غير مفحوص من خبرائنا\" يعرضها أصحابها، ويبيعها لوب هوم نيابة عنهم ويتولى طلبك وتوصيلها، والدفع نقداً عند الاستلام.",
          "لا يفحص لوب هوم هذه القطع، ولا يتحقق من وصفها أو صورها أو حالتها ولا يؤيدها أو يضمنها، وليس مسؤولاً عن أي عدم دقة أو أخطاء أو إغفالات فيها، وليس عليها ضمان.",
          "تبقى بيانات تواصل المالك خاصة ولا تظهر في الإعلان.",
          // TODO(user): تأكيد إمكانية فحص/رفض إعلانات المالكين عند الاستلام وقواعد الإرجاع.
        ],
      },
      {
        heading: "الضمان",
        id: "warranty",
        body: [
          "إذا ظهرت مدة ضمان على القطعة، نصلحها أو نستبدلها أو نعيد المبلغ إذا ظهر عطل مشمول بالضمان خلال تلك المدة. لا يشمل الضمان الأضرار الناتجة عن سوء الاستخدام أو الحوادث أو نقل القطعة بنفسك.",
        ],
      },
      {
        heading: "الإرجاع واسترداد المبلغ",
        id: "returns",
        body: [
          "يرجى فحص القطعة عند وصولها. يمكنك رفض استلامها إذا كانت متضررة أو لا تطابق الوصف، ولن تدفع شيئاً.",
          `إذا لم تطابق القطعة وصفها، أخبرنا عبر واتساب خلال ${REPORT_WINDOW_HOURS} ساعة من التوصيل، وسنستلمها مجاناً ونعيد كامل المبلغ المدفوع بما فيه رسوم التوصيل والخدمات.`,
          "لأن كل قطعة مستعملة وفريدة، لا نقبل الإرجاع لتغيير الرأي بعد قبول القطعة، إلا فيما يفرضه القانون.",
          "نعيد المبلغ نقداً عند استلام القطعة، أو بتحويل بنكي خلال 7 أيام عمل إذا فضّلت ذلك.",
          "لا يحدّ أي بند في هذه الشروط من حقوقك وفق قانون حماية المستهلك الإماراتي (القانون الاتحادي رقم 15 لسنة 2020).",
        ],
      },
      {
        heading: "بيع أغراضك لنا",
        body: [
          "إرسال طلب بيع لا يُلزم أي طرف، ويتم الاتفاق على السعر معك عبر واتساب قبل الاستلام.",
          "تؤكد أنك مالك القطعة ولك الحق في بيعها. تصبح القطعة ملكاً لـ لوب هوم عند استلامها ودفع السعر المتفق عليه.",
          "أو اعرض قطعتك بنفسك: تحدد السعر، وبعد موافقتنا تُعرض القطعة طوال مدة العرض المذكورة في نموذج البيع. عند بيعها نستلمها منك ونوصلها للمشتري وندفع لك السعر ناقص العمولة المذكورة في نموذج البيع، ولا تظهر بيانات تواصلك للعامة.",
          "لا يقبل لوب هوم التبرعات.",
        ],
      },
      {
        heading: "المسؤولية",
        body: ["في الحدود التي يسمح بها القانون الإماراتي، تقتصر مسؤوليتنا عن أي طلب على المبلغ الذي دفعته مقابله."],
      },
      {
        heading: "القانون المطبّق",
        body: ["تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة، وتختص محاكم دبي بالنظر في أي نزاع."],
      },
    ],
  },
};

const conditionGrades: Record<Locale, Page> = {
  en: {
    title: "How we grade condition",
    description: "What New, Premium, Semi-new, Good condition and Fair mean at LoopHome, how we inspect the items we sell ourselves, and how warranty and returns work.",
    intro:
      "Every item in our store carries one of five condition grades. Here is exactly what each one means, so you know what to expect before you order. Owner listings are graded from their owner's description and photos; we haven't inspected them.",
    sections: [
      { heading: "New", id: "new", body: ["Unused, often still in its original packaging. No signs of use."] },
      {
        heading: "Premium",
        id: "premium",
        body: ["Looks and works like new. Any wear is barely visible, and worn parts such as fabric, foam or seals have usually been replaced. Some Premium items include a warranty."],
      },
      { heading: "Semi-new", id: "semi_new", body: ["Lightly used, in very good shape. Small marks may be visible up close; everything works perfectly."] },
      { heading: "Good condition", id: "good", body: ["Normal signs of use such as small scratches or faded spots, fully cleaned and in full working order."] },
      { heading: "Fair", id: "fair", body: ["Clear signs of use, priced accordingly. Fully working and cleaned; the photos show the marks honestly."] },
      {
        heading: "How we inspect",
        body: [
          "Furniture: we check frames and joints, tighten or re-glue loose parts, and deep-clean or replace upholstery where needed.",
          "Appliances and electronics: we power on and test every function, replace worn belts, seals or pumps, refill gas, and descale. Each item page lists what we fixed.",
        ],
      },
      {
        heading: "Verified listings and condition scores",
        id: "score",
        body: [
          "Items we bought and inspected ourselves carry a “Verified listing” badge: the photos show the exact item you'll receive. After inspecting an item, our team may also give it a condition score out of 10, shown as “Condition: 8/10”. 10 means it looks and works like new; the lower the score, the more signs of use. Owner listings don't carry this badge or a score, because we haven't inspected them.",
        ],
      },
      {
        heading: "Warranty and returns",
        body: [`When an item has a warranty, its length is shown on the item page. If an item doesn't match its description, tell us within ${REPORT_WINDOW_HOURS} hours of delivery and we'll collect it and refund you in full.`],
      },
    ],
  },
  ar: {
    title: "كيف نصنّف حالة القطع",
    description: "ماذا يعني جديد وممتاز وشبه جديد وحالة جيدة ومقبول في لوب هوم، وكيف نفحص القطع التي نبيعها بأنفسنا، وكيف يعمل الضمان والإرجاع.",
    intro: "تحمل كل قطعة في متجرنا واحدة من خمس درجات للحالة. إليك ما تعنيه كل درجة بالضبط، لتعرف ما تتوقعه قبل الطلب. أما إعلانات المالكين فتُصنَّف حسب وصف مالكها وصوره، ولم نفحصها.",
    sections: [
      { heading: "جديد", id: "new", body: ["غير مستعمل، وغالباً في تغليفه الأصلي، دون أي آثار استخدام."] },
      {
        heading: "ممتاز",
        id: "premium",
        body: ["يبدو ويعمل كالجديد، وآثار الاستخدام بالكاد تُرى، وغالباً استبدلنا الأجزاء المستهلكة مثل القماش أو الإسفنج أو المطاط. بعض القطع الممتازة عليها ضمان."],
      },
      { heading: "شبه جديد", id: "semi_new", body: ["استخدام خفيف وبحالة جيدة جداً، قد تظهر علامات صغيرة عن قرب، وكل شيء يعمل بشكل مثالي."] },
      { heading: "حالة جيدة", id: "good", body: ["آثار استخدام عادية مثل خدوش صغيرة أو بهتان بسيط، منظّفة بالكامل وتعمل بكفاءة تامة."] },
      { heading: "مقبول", id: "fair", body: ["آثار استخدام واضحة وسعر يناسبها، تعمل بالكامل ومنظّفة، والصور تُظهر العلامات بصدق."] },
      {
        heading: "كيف نفحص",
        body: [
          "الأثاث: نفحص الهياكل والمفاصل، ونشدّ أو نلصق الأجزاء المرتخية، وننظّف التنجيد تنظيفاً عميقاً أو نستبدله عند الحاجة.",
          "الأجهزة والإلكترونيات: نشغّل كل جهاز ونختبر جميع وظائفه، ونستبدل السيور أو المطاط أو المضخات المستهلكة، ونعبّئ الغاز ونزيل الترسبات. تذكر صفحة كل قطعة ما أصلحناه.",
        ],
      },
      {
        heading: "الإعلانات الموثّقة وتقييم الحالة",
        id: "score",
        body: [
          "تحمل القطع التي اشتريناها وفحصناها بأنفسنا شارة «إعلان موثّق»، وصورها للقطعة نفسها التي ستستلمها. وقد يمنحها فريقنا بعد الفحص تقييماً للحالة من 10، يظهر هكذا: «الحالة: 8/10». الرقم 10 يعني أنها تبدو وتعمل كالجديدة، وكلما قلّ الرقم زادت آثار الاستخدام. أما إعلانات المالكين فلا تحمل الشارة ولا التقييم لأننا لم نفحصها.",
        ],
      },
      {
        heading: "الضمان والإرجاع",
        body: [`إذا كان على القطعة ضمان تظهر مدته في صفحتها. وإذا لم تطابق القطعة وصفها، أخبرنا خلال ${REPORT_WINDOW_HOURS} ساعة من التوصيل وسنستلمها ونعيد لك المبلغ كاملاً.`],
      },
    ],
  },
};

const movingOut: Record<Locale, Page> = {
  en: {
    title: "Leaving Dubai or moving house? Sell all your furniture in one visit",
    crumb: "Sell everything when moving",
    description: "Leaving Dubai or the UAE, or moving house? LoopHome buys your furniture and appliances in one visit: one offer on WhatsApp, free pickup, cash on the day.",
    intro:
      "Leaving Dubai or the UAE at the end of your contract, moving to a smaller place, or clearing a home at short notice? Sell your furniture and appliances in one go: one offer, one pickup timed to your handover, paid in cash on the day. We collect from apartments, villas and offices all over Dubai and the rest of the UAE.",
    sections: [
      {
        heading: "How does a one-visit offer work?",
        body: [
          "Send photos of everything you want to sell, or one short video walking through your home, on WhatsApp, with your area and your move-out date. Prefer the form? Add up to 10 photos of the main pieces and list the rest in the description. We reply with one offer for all items, usually within 24 hours.",
        ],
      },
      {
        heading: "What we buy",
        body: [
          "Sofas, beds, wardrobes, dining sets, office furniture, fridges, washing machines, ovens, TVs and kids' furniture in working condition, from studios and apartments to villas and offices.",
        ],
      },
      {
        heading: "Timed around your handover",
        body: [
          "Tell us your move-out or handover date when you accept the offer and we'll schedule the pickup around it, including on handover day if you book it ahead, so the home is empty in time for the final inspection.",
          "Many Dubai towers ask for a move-out permit and a service-lift booking when large furniture leaves the building. Arrange them with your building management and tell us the times they allow.",
        ],
      },
      {
        heading: "Leaving at short notice?",
        body: ["Say so when you send your photos. We reply with an offer, usually within 24 hours, and tell you which pickup days we can offer before you accept."],
      },
      {
        heading: "How we price",
        body: ["Offers depend on brand, age, condition and demand. We make one fair cash offer, and you're free to accept part of it or none."],
      },
      {
        heading: "Paid in cash, collected for free",
        body: ["Our team collects everything from your home at no cost and pays you in cash at pickup, at the price we agreed."],
      },
      {
        heading: "Sell to us, or list with us if you have time",
        body: [
          "Selling to us is the quickest option: one price and one pickup. If you're not leaving for a few weeks and want to set your own price, you can list items on LoopHome instead: we show them for the listing period shown on the sell form, handle the buyer and delivery, and pay you your price minus our commission when an item sells.",
        ],
      },
      {
        heading: "What if you can't buy some items?",
        body: [
          "We tell you in the offer which items we can't buy, so you can plan for them before your move.",
          {
            text: "Taking some things to your next home in Dubai or another emirate? Our movers can take them after a free site visit. We move within the UAE only, so shipping abroad needs an international shipping company.",
            needs: "moving",
          },
        ],
      },
    ],
    faqs: [
      {
        q: "Can you collect everything on my handover day?",
        a: "Yes, if we book it in advance. Tell us your handover date when you accept the offer, and we plan the pickup around your building's allowed moving hours.",
      },
      {
        q: "Which areas of Dubai do you collect from?",
        a: "All of Dubai, including JVC, JLT, Dubai Marina, JBR, Business Bay, Downtown Dubai, Al Barsha and Al Furjan, and the rest of the UAE. Pickup is free.",
      },
      {
        q: "Do you move furniture abroad?",
        a: "No. LoopHome moves homes and offices within the UAE only. If you're leaving the UAE, we can buy the furniture and appliances you're not shipping, with one offer and a free pickup.",
        needs: "moving",
      },
      {
        q: "Can you also move the things I'm keeping?",
        a: "Yes, within Dubai and between emirates. Book our movers for the rest: every move starts with a free site visit, then a quote on WhatsApp.",
        needs: "moving",
      },
      {
        q: "What can I do with items you don't buy?",
        a: "We tell you in the offer which items we can't buy, so you have time to plan. You can give usable items to charity or list them for sale, and ask Dubai Municipality about bulky-waste collection for the rest.",
      },
    ],
  },
  ar: {
    title: "مسافر من دبي أو تنتقل من بيتك؟ نشتري أثاثك وأجهزتك كاملة",
    crumb: "بيع أثاث البيت كاملاً",
    description: "مغادر دبي أو الإمارات أو تنقل بيتك؟ لوب هوم يشتري أثاثك وأجهزتك المستعملة بزيارة واحدة: عرض واحد عبر واتساب، واستلام مجاني، ودفع نقدي عند الاستلام.",
    intro:
      "تغادر دبي أو الإمارات مع نهاية عقدك، أو تنتقل إلى بيت أصغر، أو تحتاج إلى إخلاء بيتك خلال وقت قصير؟ بِع أثاثك وأجهزتك دفعة واحدة: عرض واحد، واستلام واحد في موعد تسليم البيت، ودفع نقدي عند الاستلام. نستلم من الشقق والفلل والمكاتب في جميع أنحاء دبي وباقي الإمارات.",
    sections: [
      {
        heading: "كيف يعمل عرض الزيارة الواحدة؟",
        body: [
          "أرسل لنا عبر واتساب صور كل ما تريد بيعه، أو فيديو قصيراً تتجوّل فيه داخل بيتك، مع اسم منطقتك وموعد مغادرتك. تفضّل النموذج؟ أضف حتى 10 صور للقطع الرئيسية واذكر باقي القطع في الوصف. نرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
        ],
      },
      {
        heading: "ماذا نشتري",
        body: ["الكنب والأسرّة والدواليب وطاولات الطعام والأثاث المكتبي والثلاجات والغسالات والأفران والشاشات وأثاث الأطفال بحالة تعمل، من الاستوديو والشقة إلى الفيلا والمكتب."],
      },
      {
        heading: "حسب موعد تسليم البيت",
        body: [
          "أخبرنا بموعد مغادرتك أو تسليم البيت عند قبول العرض، ونحدد موعد الاستلام حوله، حتى في يوم التسليم إذا حجزته مسبقاً، ليكون البيت فارغاً قبل المعاينة النهائية.",
          "تطلب أبراج كثيرة في دبي تصريح خروج وحجز مصعد الخدمة عند إخراج أثاث كبير من المبنى، فرتّب ذلك مع إدارة المبنى وأخبرنا بالأوقات المسموح بها.",
        ],
      },
      { heading: "تغادر خلال وقت قصير؟", body: ["اذكر ذلك عند إرسال الصور. نرسل لك عرضاً عادةً خلال 24 ساعة، ونخبرك بأيام الاستلام المتاحة قبل أن تقبل."] },
      {
        heading: "كيف نحدد السعر",
        body: ["يعتمد العرض على الماركة والعمر والحالة والطلب. نقدّم عرضاً نقدياً عادلاً واحداً، ولك حرية قبوله كله أو جزء منه أو رفضه."],
      },
      { heading: "دفع نقدي واستلام مجاني", body: ["يستلم فريقنا كل القطع من منزلك دون أي تكلفة، ويدفع لك نقداً عند الاستلام بالسعر المتفق عليه."] },
      {
        heading: "بِعها لنا، أو اعرضها لدينا إن كان لديك وقت",
        body: [
          "البيع لنا هو الخيار الأسرع: سعر واحد واستلام واحد. وإذا كان سفرك بعد بضعة أسابيع وتريد أن تحدد سعرك بنفسك، يمكنك أن تعرض قطعك لدينا بدلاً من ذلك: نعرضها طوال مدة العرض المذكورة في نموذج البيع، ونتولى المشتري والتوصيل، وتحصل على سعرك بعد خصم عمولتنا عند بيع القطعة.",
        ],
      },
      {
        heading: "ماذا لو لم نشترِ بعض القطع؟",
        body: [
          "نخبرك في العرض بالقطع التي لا نستطيع شراءها لتخطط لها قبل انتقالك.",
          {
            text: "إذا كنت ستأخذ بعض أغراضك إلى بيتك الجديد في دبي أو في إمارة أخرى، يمكن لفريق النقل لدينا نقلها بعد زيارة معاينة مجانية. ننقل داخل الإمارات فقط، أما الشحن إلى الخارج فيحتاج إلى شركة شحن دولي.",
            needs: "moving",
          },
        ],
      },
    ],
    faqs: [
      { q: "هل يمكنكم استلام كل شيء في يوم تسليم البيت؟", a: "نعم إذا حجزنا الموعد مسبقاً. أخبرنا بموعد التسليم عند قبول العرض، ونخطط للاستلام حسب ساعات النقل المسموح بها في مبناك." },
      {
        q: "من أي مناطق دبي تستلمون؟",
        a: "من جميع مناطق دبي، ومنها قرية جميرا الدائرية (JVC) وأبراج بحيرات جميرا (JLT) ودبي مارينا ومساكن شاطئ جميرا (JBR) والخليج التجاري (بزنس باي) ووسط مدينة دبي (داون تاون) والبرشاء والفرجان، ومن باقي الإمارات. والاستلام مجاني.",
      },
      {
        q: "هل تنقلون الأثاث إلى خارج الإمارات؟",
        a: "لا، ننقل المنازل والمكاتب داخل الإمارات فقط. وإذا كنت مسافراً، يمكننا شراء الأثاث والأجهزة التي لن تشحنها، بعرض واحد واستلام مجاني.",
        needs: "moving",
      },
      {
        q: "هل يمكنكم نقل الأغراض التي سأحتفظ بها؟",
        a: "نعم، داخل دبي وبين الإمارات. احجز فريق النقل لدينا لباقي الأغراض: تبدأ كل عملية نقل بزيارة معاينة مجانية ثم عرض سعر عبر واتساب.",
        needs: "moving",
      },
      {
        q: "ماذا أفعل بالقطع التي لا تشترونها؟",
        a: "نخبرك في العرض بالقطع التي لا نستطيع شراءها ليكون لديك وقت للتخطيط. يمكنك التبرع بالقطع الصالحة للاستخدام أو عرضها للبيع، وسؤال بلدية دبي عن خدمة جمع النفايات الكبيرة لما تبقى.",
      },
    ],
  },
};

const sellAppliances: Record<Locale, Page> = {
  en: {
    title: "Sell your used oven, fridge or washing machine in Dubai",
    crumb: "Sell appliances",
    description: "We buy used ovens, fridges, washing machines and TVs in Dubai and across the UAE. Send photos, get a cash offer on WhatsApp, free pickup, paid on collection.",
    intro: "We buy working home appliances all over Dubai and the rest of the UAE and pay in cash when we collect them. Send a few photos and get an offer on WhatsApp.",
    sections: [
      {
        heading: "Appliances we buy",
        body: ["Ovens and cookers, fridges and freezers, washing machines and dryers, dishwashers, microwaves and TVs."],
      },
      {
        heading: "What affects the offer",
        body: ["Brand and model, age, capacity or size, and working condition. Photos of the model label help us make a faster, more accurate offer."],
      },
      {
        heading: "Built-in ovens",
        body: ["Tell us if your oven is built in. We'll confirm in the offer whether we can remove it and if there's any cost."],
      },
      { heading: "Pickup and payment", body: ["We collect from your home anywhere in Dubai or the rest of the UAE at no cost, and pay you in cash at pickup at the agreed price."] },
      {
        heading: "Do you buy appliances that don't work?",
        body: ["Sometimes, for repairable models. Tell us what's wrong in the description and we'll let you know."],
      },
    ],
  },
  ar: {
    title: "بِع فرنك أو ثلاجتك أو غسالتك المستعملة في دبي",
    crumb: "بيع الأجهزة",
    description: "نشتري الأفران والثلاجات والغسالات والشاشات المستعملة في دبي وجميع الإمارات. أرسل الصور واحصل على عرض نقدي عبر واتساب، والاستلام مجاني والدفع عند الاستلام.",
    intro: "نشتري الأجهزة المنزلية التي تعمل في جميع أنحاء دبي وباقي الإمارات وندفع نقداً عند استلامها. أرسل بعض الصور واحصل على عرض عبر واتساب.",
    sections: [
      {
        heading: "الأجهزة التي نشتريها",
        body: ["الأفران وأجهزة الطبخ، والثلاجات والفريزرات، والغسالات والمجففات، وغسالات الصحون، والمايكرويف، والشاشات."],
      },
      {
        heading: "ما الذي يحدد العرض",
        body: ["الماركة والموديل والعمر والسعة أو المقاس وحالة التشغيل. صورة ملصق الموديل تساعدنا على تقديم عرض أسرع وأدق."],
      },
      { heading: "الأفران المدمجة", body: ["أخبرنا إذا كان الفرن مدمجاً في المطبخ، وسنوضح في العرض إمكانية فكّه وأي تكلفة لذلك."] },
      { heading: "الاستلام والدفع", body: ["نستلم من منزلك في أي مكان في دبي أو باقي الإمارات دون أي تكلفة، وندفع لك نقداً عند الاستلام بالسعر المتفق عليه."] },
      {
        heading: "هل تشترون الأجهزة المعطّلة؟",
        body: ["أحياناً، للموديلات القابلة للإصلاح. اذكر العطل في الوصف وسنخبرك."],
      },
    ],
  },
};

export const PAGES = { about, privacy, terms, conditionGrades, movingOut, sellAppliances };

/** A page as visitors see it now: paragraphs, sections and FAQs about a switched-off service are left out. */
export function pageFor(key: keyof typeof PAGES, locale: Locale, on: ServicesOn) {
  const page = PAGES[key][locale];
  const shown = (needs?: Need) => !needs || on[needs];
  return {
    ...page,
    sections: page.sections
      .map((s) => ({ ...s, body: s.body.flatMap((p) => (typeof p === "string" ? [p] : shown(p.needs) ? [p.text] : [])) }))
      .filter((s) => s.body.length > 0),
    faqs: page.faqs?.filter((f) => shown(f.needs)).map(({ q, a }) => ({ q, a })),
  };
}
