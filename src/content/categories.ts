/**
 * SEO copy per category (UAE search intent, both languages). Categories the admin adds
 * later fall back to the generic `meta.category` messages.
 */
import type { Locale } from "@/i18n/routing";
import { REPORT_WINDOW_HOURS } from "@/lib/policy";

export type CategoryCopy = {
  /** <title> without the brand suffix (≤ ~55 chars). */
  title: string;
  /** Arabic "used X" for product titles when the item name is in Latin script, e.g. "أثاث مستعمل". */
  usedNoun?: string;
  description: string;
  h1: string;
  intro: string;
  body: string[];
  faqs: { q: string; a: string }[];
};

const COPY: Record<string, Record<Locale, CategoryCopy>> = {
  "furniture-home": {
    en: {
      title: "Used Furniture for Sale in Dubai & the UAE",
      description:
        "Refurbished sofas, beds, wardrobes and dining sets in Dubai, Abu Dhabi and across the UAE. Most cleaned, repaired and checked by our team. Cash on delivery.",
      h1: "Used furniture in Dubai and the UAE",
      intro: "Sofas, beds, wardrobes and dining sets bought from UAE homes, most of them cleaned, repaired and checked by our team before sale.",
      body: [
        "Items we sell ourselves are inspected by our team in Dubai: we tighten frames, replace worn fabric or foam where needed, and deep-clean upholstery, so you get furniture that is ready to use the day it arrives.",
        "Delivery is available to every emirate, and you can add assembly when you order. Pay in cash when it arrives.",
      ],
      faqs: [
        { q: "Is the furniture cleaned?", a: "Items we sell ourselves are deep-cleaned and checked before listing. Owner listings are tagged \"Unchecked by our experts\"." },
        { q: "Do you deliver outside Dubai?", a: "Yes, to all emirates, including Abu Dhabi and Sharjah. The fee is shown before you order." },
        { q: "Can you assemble it?", a: "Yes. Add assembly in the order form; the price is shown before you confirm." },
      ],
    },
    ar: {
      usedNoun: "أثاث مستعمل",
      title: "أثاث مستعمل للبيع في دبي والإمارات",
      description:
        "كنبات وأسرّة وخزائن وطاولات طعام مستعملة ومجدّدة في دبي وأبوظبي وجميع الإمارات. معظمها منظّف ومفحوص، والدفع عند الاستلام.",
      h1: "أثاث مستعمل في دبي والإمارات",
      intro: "كنبات وأسرّة وخزائن وطاولات طعام نشتريها من البيوت في الإمارات، وننظّف معظمها ونصلحه ونفحصه قبل البيع.",
      body: [
        "يفحص فريقنا في دبي القطع التي نبيعها بأنفسنا، فنشدّ الهياكل ونستبدل القماش أو الإسفنج عند الحاجة وننظّف التنجيد تنظيفاً عميقاً، لتصلك قطعة جاهزة للاستخدام من أول يوم.",
        "نوصل إلى جميع الإمارات، ويمكنك إضافة خدمة التجميع عند الطلب. ادفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "هل الأثاث منظّف؟", a: "القطع التي نبيعها بأنفسنا ننظّفها ونفحصها قبل عرضها، أما إعلانات المالكين فتحمل وسم \"غير مفحوص من خبرائنا\"." },
        { q: "هل توصلون خارج دبي؟", a: "نعم، إلى جميع الإمارات ومنها أبوظبي والشارقة، وتظهر الرسوم قبل الطلب." },
        { q: "هل تقومون بالتجميع؟", a: "نعم، أضف خدمة التجميع في نموذج الطلب ويظهر السعر قبل التأكيد." },
      ],
    },
  },
  "appliances-electronics": {
    en: {
      title: "Used Fridges, Washing Machines & ACs in Dubai",
      description:
        "Refurbished fridges, washing machines, ACs and TVs, most tested by our team, some with warranty. Delivery and installation across Dubai and the UAE.",
      h1: "Used and refurbished appliances in the UAE",
      intro: "Fridges, washing machines, air conditioners and TVs, most tested by our technicians, some with a warranty.",
      body: [
        "Appliances we sell ourselves are powered on and tested before listing. Where needed we replace belts, seals or pumps, refill gas and descale, and the item page shows exactly what we fixed.",
        "Add installation when you order, and we deliver to every emirate. Pay in cash on delivery.",
      ],
      faqs: [
        { q: "Are the appliances tested?", a: "Every appliance we sell ourselves is tested, and repairs are listed on the item page. Owner listings are tagged \"Unchecked by our experts\"." },
        { q: "Do they come with a warranty?", a: "Some do. The warranty period is shown on each item page." },
        { q: "Can you install it?", a: "Yes. Add installation in the order form; the price is shown before you confirm." },
      ],
    },
    ar: {
      usedNoun: "أجهزة مستعملة",
      title: "ثلاجات وغسالات ومكيفات مستعملة في دبي والإمارات",
      description:
        "ثلاجات وغسالات ومكيفات وشاشات مستعملة ومجدّدة، معظمها مفحوص من فنيينا وبعضها بضمان. توصيل وتركيب في دبي وجميع الإمارات والدفع عند الاستلام.",
      h1: "أجهزة منزلية وإلكترونيات مستعملة ومجدّدة في الإمارات",
      intro: "ثلاجات وغسالات ومكيفات وشاشات يفحص فنيونا معظمها، وبعضها بضمان.",
      body: [
        "نشغّل كل جهاز نبيعه بأنفسنا ونختبره قبل عرضه، ونستبدل السيور أو المطاط أو المضخات ونعبّئ الغاز عند الحاجة، وتعرض صفحة المنتج ما قمنا بإصلاحه بالضبط.",
        "أضف خدمة التركيب عند الطلب، ونوصل إلى جميع الإمارات، والدفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "هل الأجهزة مفحوصة؟", a: "نختبر كل جهاز نبيعه بأنفسنا ونذكر الإصلاحات في صفحة المنتج، أما إعلانات المالكين فتحمل وسم \"غير مفحوص من خبرائنا\"." },
        { q: "هل عليها ضمان؟", a: "بعضها بضمان، وتظهر مدته في صفحة كل منتج." },
        { q: "هل تقومون بالتركيب؟", a: "نعم، أضف خدمة التركيب في نموذج الطلب ويظهر السعر قبل التأكيد." },
      ],
    },
  },
  "fashion-accessories": {
    en: {
      title: "Pre-Owned Bags, Watches & Fashion in the UAE",
      description:
        "Pre-owned handbags, watches and accessories, most cleaned and checked by our team, at fair prices. Cash on delivery across Dubai and the UAE.",
      h1: "Pre-owned fashion and accessories in the UAE",
      intro: "Handbags, watches and accessories in good condition, most cleaned and checked by our team.",
      body: [
        "Leather is cleaned and conditioned, watches get new batteries or straps where needed, and every item is photographed as it is.",
        "Each listing shows the condition grade and real photos, including any marks or wear, so you know what you're getting before you order. Owner listings are tagged, because our team hasn't checked them.",
        "We deliver across the UAE and you pay in cash when it arrives.",
      ],
      faqs: [
        { q: "How do I know the real condition?", a: "Every listing has real photos of the item and a condition grade. If something isn't as described, tell us after delivery." },
        { q: "What if an item isn't as described?", a: `Tell us within ${REPORT_WINDOW_HOURS} hours of delivery and we'll collect it and refund you in full.` },
        { q: "How do I pay?", a: "Cash on delivery or on collection." },
      ],
    },
    ar: {
      usedNoun: "إكسسوارات مستعملة",
      title: "شنط وساعات وإكسسوارات مستعملة في الإمارات",
      description: "حقائب يد وساعات وإكسسوارات مستعملة بحالة جيدة، معظمها منظّف ومفحوص من فريقنا وبأسعار عادلة. توصيل إلى دبي وجميع الإمارات والدفع عند الاستلام.",
      h1: "أزياء وإكسسوارات مستعملة في الإمارات",
      intro: "حقائب يد وساعات وإكسسوارات بحالة جيدة، نظّف فريقنا معظمها وفحصه.",
      body: [
        "ننظّف الجلود ونعالجها، ونغيّر بطاريات الساعات أو أحزمتها عند الحاجة، ونصوّر كل قطعة كما هي.",
        "تعرض كل صفحة درجة الحالة وصوراً حقيقية تُظهر أي آثار استخدام، لتعرف ما ستشتريه قبل الطلب. وتحمل إعلانات المالكين وسماً خاصاً لأن فريقنا لم يفحصها.",
        "نوصل إلى جميع الإمارات، والدفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "كيف أعرف الحالة الحقيقية للقطعة؟", a: "لكل إعلان صور حقيقية للقطعة ودرجة حالة واضحة. وإذا لم تطابق القطعة الوصف فأخبرنا بعد التوصيل." },
        { q: "ماذا لو لم تطابق القطعة الوصف؟", a: `أخبرنا خلال ${REPORT_WINDOW_HOURS} ساعة من التوصيل وسنستلمها ونعيد لك المبلغ كاملاً.` },
        { q: "كيف أدفع؟", a: "نقداً عند التوصيل أو الاستلام." },
      ],
    },
  },
  "kids-baby": {
    en: {
      title: "Used Baby Strollers, Cribs & Kids Items in UAE",
      description:
        "Pre-loved strollers, cribs and kids' furniture, most washed and checked by our team. Cash on delivery across Dubai and the UAE.",
      h1: "Second-hand baby and kids items in the UAE",
      intro: "Strollers, cribs and kids' furniture, most washed and checked by our team, ready for the next family.",
      body: [
        "Children grow fast, and good baby gear rarely wears out. We wash fabrics, check brakes, straps and joints, and replace worn parts such as wheels or mattresses.",
        "Buying second-hand is a practical way to furnish a nursery in Dubai or Abu Dhabi without paying full price for things your child will outgrow in a year or two. Each listing shows its condition grade and real photos.",
        "Delivery is available in every emirate, with payment in cash on arrival.",
      ],
      faqs: [
        { q: "Are baby items cleaned?", a: "Items we sell ourselves are washed and checked before listing." },
        { q: "Do you replace mattresses?", a: "Where needed, yes. The item page lists what we replaced." },
        { q: "Can I sell my baby items to you?", a: "Yes. Send photos through the sell form and we'll reply with an offer on WhatsApp." },
      ],
    },
    ar: {
      usedNoun: "مستلزمات أطفال مستعملة",
      title: "مستلزمات أطفال مستعملة في الإمارات",
      description: "عربات وأسرّة وأثاث أطفال مستعمل بحالة جيدة، معظمه مغسول ومفحوص من فريقنا. توصيل إلى دبي وجميع الإمارات والدفع عند الاستلام.",
      h1: "مستلزمات أطفال ورضّع مستعملة في الإمارات",
      intro: "عربات وأسرّة وأثاث أطفال، معظمها مغسول ومفحوص وجاهز لعائلة جديدة.",
      body: [
        "يكبر الأطفال بسرعة ونادراً ما تتلف مستلزماتهم الجيدة. نغسل الأقمشة، ونفحص الفرامل والأحزمة والمفاصل، ونستبدل القطع المستهلكة مثل العجلات أو المراتب.",
        "شراء المستلزمات المستعملة طريقة عملية لتجهيز غرفة طفلك في دبي أو أبوظبي دون دفع السعر الكامل لأغراض سيكبر عليها خلال عام أو عامين. وتعرض كل صفحة درجة الحالة وصوراً حقيقية.",
        "نوصل إلى جميع الإمارات، والدفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "هل مستلزمات الأطفال منظّفة؟", a: "القطع التي نبيعها بأنفسنا نغسلها ونفحصها قبل عرضها." },
        { q: "هل تستبدلون المراتب؟", a: "نعم عند الحاجة، وتذكر صفحة المنتج ما استبدلناه." },
        { q: "هل يمكنني بيع مستلزمات طفلي لكم؟", a: "نعم، أرسل الصور عبر نموذج البيع وسنرد عليك بعرض عبر واتساب." },
      ],
    },
  },
  "office-equipment": {
    en: {
      title: "Used Office Furniture in Dubai: Chairs & Desks",
      description:
        "Refurbished office chairs, desks and printers for home offices and businesses in Dubai and the UAE. Most tested by our team, fairly priced, cash on delivery.",
      h1: "Used office furniture and equipment in the UAE",
      intro: "Ergonomic chairs, desks and printers for home offices and small businesses, most checked by our team and ready to work.",
      body: [
        "Chairs get new gas lifts or arm pads where needed, desks are tightened and cleaned, and printers are tested with fresh toner.",
        "Good office furniture is built to last, which makes used chairs and desks one of the easiest ways to set up a home office or a new team in Dubai for less. Each listing shows its condition grade and real photos.",
        "We deliver across the UAE, and assembly can be added when you order.",
      ],
      faqs: [
        { q: "Do you sell to businesses?", a: "Yes. Order item by item, or message us on WhatsApp for several pieces." },
        { q: "Can you assemble desks?", a: "Yes. Add assembly in the order form; the price is shown before you confirm." },
      ],
    },
    ar: {
      usedNoun: "معدات مكتبية مستعملة",
      title: "أثاث مكتبي مستعمل في دبي والإمارات",
      description: "كراسي ومكاتب وطابعات مستعملة ومجدّدة للمكاتب المنزلية والشركات في دبي والإمارات. معظمها مفحوص وبأسعار عادلة والدفع عند الاستلام.",
      h1: "أثاث ومعدات مكتبية مستعملة في الإمارات",
      intro: "كراسٍ مريحة ومكاتب وطابعات للمكاتب المنزلية والشركات الصغيرة، معظمها مفحوص وجاهز للعمل.",
      body: [
        "نستبدل مكابس الغاز أو مساند الذراعين في الكراسي عند الحاجة، ونشدّ المكاتب وننظّفها، ونختبر الطابعات بحبر جديد.",
        "الأثاث المكتبي الجيد مصمَّم ليدوم طويلاً، لذلك تُعد الكراسي والمكاتب المستعملة من أسهل الطرق لتجهيز مكتب منزلي أو فريق جديد في دبي بتكلفة أقل. وتعرض كل صفحة درجة الحالة وصوراً حقيقية.",
        "نوصل إلى جميع الإمارات، ويمكنك إضافة خدمة التجميع عند الطلب.",
      ],
      faqs: [
        { q: "هل تبيعون للشركات؟", a: "نعم، اطلب قطعة قطعة أو راسلنا على واتساب لعدة قطع." },
        { q: "هل تجمّعون المكاتب؟", a: "نعم، أضف خدمة التجميع في نموذج الطلب ويظهر السعر قبل التأكيد." },
      ],
    },
  },
  other: {
    en: {
      title: "Used Home Décor & Household Items in the UAE",
      description:
        "Used lamps, décor, bikes and other household items at fair prices, most cleaned and checked by our team. Delivery across Dubai and the UAE, cash on delivery.",
      h1: "Home décor and household items",
      intro: "Lamps, bikes, décor and other useful things that don't fit a single category.",
      body: [
        "Floor lamps, mirrors, rugs, bikes and the small things that make a home work: we buy them from UAE households along with their furniture, and give them a second life.",
        "Items we sell ourselves are cleaned and checked before listing, and each page shows the condition grade and real photos. We deliver across the UAE with cash on delivery.",
      ],
      faqs: [
        { q: "Do you check lamps and electrical items?", a: "Yes. Electrical items we sell ourselves are tested before listing." },
        { q: "Can I buy several small items together?", a: "Yes. Order them separately or message us on WhatsApp and we'll deliver them together where we can." },
      ],
    },
    ar: {
      usedNoun: "أغراض مستعملة",
      title: "ديكور وأغراض منزلية مستعملة في الإمارات",
      description: "إضاءة وديكور ودراجات وأغراض منزلية مستعملة بأسعار عادلة، معظمها منظّف ومفحوص من فريقنا. توصيل إلى دبي وجميع الإمارات والدفع عند الاستلام.",
      h1: "ديكور وأغراض منزلية مستعملة",
      intro: "إضاءة ودراجات وديكور وأغراض مفيدة أخرى لا تندرج تحت فئة واحدة.",
      body: [
        "أباجورات ومرايا وسجاد ودراجات وأغراض صغيرة تكمّل البيت: نشتريها من البيوت في الإمارات مع أثاثها ونمنحها حياة ثانية.",
        "ننظّف القطع التي نبيعها بأنفسنا ونفحصها قبل عرضها، وتعرض كل صفحة درجة الحالة وصوراً حقيقية. نوصل إلى جميع الإمارات والدفع عند الاستلام.",
      ],
      faqs: [
        { q: "هل تفحصون الإضاءة والأجهزة الكهربائية؟", a: "نعم، نختبر الأغراض الكهربائية التي نبيعها بأنفسنا قبل عرضها." },
        { q: "هل يمكنني شراء عدة قطع صغيرة معاً؟", a: "نعم، اطلبها كلاً على حدة أو راسلنا على واتساب وسنوصلها معاً قدر الإمكان." },
      ],
    },
  },
};

export const categoryCopy = (slug: string, locale: Locale): CategoryCopy | undefined => COPY[slug]?.[locale];
