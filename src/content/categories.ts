/**
 * SEO copy per category (UAE search intent, both languages). Categories the admin adds
 * later fall back to the generic `meta.category` messages.
 */
import type { Locale } from "@/i18n/routing";

export type CategoryCopy = {
  /** <title> without the brand suffix (≤ ~55 chars). */
  title: string;
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
        "Refurbished sofas, beds, wardrobes and dining sets in Dubai, Abu Dhabi and across the UAE. Cleaned, repaired and checked. Cash on delivery.",
      h1: "Used furniture in Dubai and the UAE",
      intro: "Sofas, beds, wardrobes and dining sets bought from UAE homes, then cleaned, repaired and checked before sale.",
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
      title: "أثاث مستعمل للبيع في دبي والإمارات",
      description:
        "كنبات وأسرّة وخزائن وطاولات طعام مستعملة ومجدّدة في دبي وأبوظبي وجميع الإمارات. منظّفة ومفحوصة، والدفع عند الاستلام.",
      h1: "أثاث مستعمل في دبي والإمارات",
      intro: "كنبات وأسرّة وخزائن وطاولات طعام نشتريها من البيوت في الإمارات، ثم ننظّفها ونصلحها ونفحصها قبل البيع.",
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
        "Refurbished fridges, washing machines, ACs and TVs, tested and many with warranty. Delivery and installation across Dubai and the UAE.",
      h1: "Used and refurbished appliances in the UAE",
      intro: "Fridges, washing machines, air conditioners and TVs, tested by our technicians and many with a warranty.",
      body: [
        "Appliances we sell ourselves are powered on and tested before listing. Where needed we replace belts, seals or pumps, refill gas and descale, and the item page shows exactly what we fixed.",
        "Add installation when you order, and we deliver to every emirate. Pay in cash on delivery.",
      ],
      faqs: [
        { q: "Are the appliances tested?", a: "Every appliance we sell ourselves is tested, and repairs are listed on the item page. Owner listings are tagged \"Unchecked by our experts\"." },
        { q: "Do they come with a warranty?", a: "Many do. The warranty period is shown on each item page." },
        { q: "Can you install it?", a: "Yes. Add installation in the order form; the price is shown before you confirm." },
      ],
    },
    ar: {
      title: "ثلاجات وغسالات ومكيفات مستعملة في دبي والإمارات",
      description:
        "ثلاجات وغسالات ومكيفات وشاشات مستعملة ومجدّدة، مفحوصة وبعضها بضمان. توصيل وتركيب في دبي وجميع الإمارات.",
      h1: "أجهزة منزلية وإلكترونيات مستعملة ومجدّدة في الإمارات",
      intro: "ثلاجات وغسالات ومكيفات وشاشات يفحصها فنيونا، وكثير منها بضمان.",
      body: [
        "نشغّل كل جهاز نبيعه بأنفسنا ونختبره قبل عرضه، ونستبدل السيور أو المطاط أو المضخات ونعبّئ الغاز عند الحاجة، وتعرض صفحة المنتج ما قمنا بإصلاحه بالضبط.",
        "أضف خدمة التركيب عند الطلب، ونوصل إلى جميع الإمارات، والدفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "هل الأجهزة مفحوصة؟", a: "نختبر كل جهاز نبيعه بأنفسنا ونذكر الإصلاحات في صفحة المنتج، أما إعلانات المالكين فتحمل وسم \"غير مفحوص من خبرائنا\"." },
        { q: "هل عليها ضمان؟", a: "كثير منها بضمان، وتظهر مدته في صفحة كل منتج." },
        { q: "هل تقومون بالتركيب؟", a: "نعم، أضف خدمة التركيب في نموذج الطلب ويظهر السعر قبل التأكيد." },
      ],
    },
  },
  "fashion-accessories": {
    en: {
      title: "Pre-Owned Bags, Watches & Fashion in the UAE",
      description:
        "Pre-owned handbags, watches and accessories, cleaned and checked, at fair prices. Cash on delivery across Dubai and the UAE.",
      h1: "Pre-owned fashion and accessories in the UAE",
      intro: "Handbags, watches and accessories in good condition, cleaned and checked by our team.",
      body: [
        "Leather is cleaned and conditioned, watches get new batteries or straps where needed, and every item is photographed as it is.",
        "We deliver across the UAE and you pay in cash when it arrives.",
      ],
      faqs: [
        { q: "What if an item isn't as described?", a: "Tell us within 48 hours of delivery and we'll collect it and refund you in full." },
        { q: "How do I pay?", a: "Cash on delivery or on collection." },
      ],
    },
    ar: {
      title: "شنط وساعات وإكسسوارات مستعملة في الإمارات",
      description: "حقائب يد وساعات وإكسسوارات مستعملة، منظّفة ومفحوصة وبأسعار عادلة. الدفع عند الاستلام في دبي وجميع الإمارات.",
      h1: "أزياء وإكسسوارات مستعملة في الإمارات",
      intro: "حقائب يد وساعات وإكسسوارات بحالة جيدة، نظّفها فريقنا وفحصها.",
      body: [
        "ننظّف الجلود ونعالجها، ونغيّر بطاريات الساعات أو أحزمتها عند الحاجة، ونصوّر كل قطعة كما هي.",
        "نوصل إلى جميع الإمارات، والدفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "ماذا لو لم تطابق القطعة الوصف؟", a: "أخبرنا خلال 48 ساعة من التوصيل وسنستلمها ونعيد لك المبلغ كاملاً." },
        { q: "كيف أدفع؟", a: "نقداً عند التوصيل أو الاستلام." },
      ],
    },
  },
  "kids-baby": {
    en: {
      title: "Used Baby Strollers, Cribs & Kids Items in UAE",
      description:
        "Pre-loved strollers, cribs and kids' furniture, washed and checked. Cash on delivery across Dubai and the UAE.",
      h1: "Second-hand baby and kids items in the UAE",
      intro: "Strollers, cribs and kids' furniture, washed, checked and ready for the next family.",
      body: [
        "Children grow fast, and good baby gear rarely wears out. We wash fabrics, check brakes, straps and joints, and replace worn parts such as wheels or mattresses.",
        "Delivery is available in every emirate, with payment in cash on arrival.",
      ],
      faqs: [
        { q: "Are baby items cleaned?", a: "Items we sell ourselves are washed and checked before listing." },
        { q: "Do you replace mattresses?", a: "Where needed, yes. The item page lists what we replaced." },
      ],
    },
    ar: {
      title: "مستلزمات أطفال مستعملة في الإمارات",
      description: "عربات وأسرّة وأثاث أطفال مستعمل، مغسول ومفحوص. الدفع عند الاستلام في دبي وجميع الإمارات.",
      h1: "مستلزمات أطفال ورضّع مستعملة في الإمارات",
      intro: "عربات وأسرّة وأثاث أطفال، مغسولة ومفحوصة وجاهزة لعائلة جديدة.",
      body: [
        "يكبر الأطفال بسرعة ونادراً ما تتلف مستلزماتهم الجيدة. نغسل الأقمشة، ونفحص الفرامل والأحزمة والمفاصل، ونستبدل القطع المستهلكة مثل العجلات أو المراتب.",
        "نوصل إلى جميع الإمارات، والدفع نقداً عند الاستلام.",
      ],
      faqs: [
        { q: "هل مستلزمات الأطفال منظّفة؟", a: "القطع التي نبيعها بأنفسنا نغسلها ونفحصها قبل عرضها." },
        { q: "هل تستبدلون المراتب؟", a: "نعم عند الحاجة، وتذكر صفحة المنتج ما استبدلناه." },
      ],
    },
  },
  "office-equipment": {
    en: {
      title: "Used Office Furniture in Dubai: Chairs & Desks",
      description:
        "Refurbished office chairs, desks and printers for home offices and businesses in Dubai and the UAE. Tested, fairly priced, cash on delivery.",
      h1: "Used office furniture and equipment in the UAE",
      intro: "Ergonomic chairs, desks and printers for home offices and small businesses, checked and ready to work.",
      body: [
        "Chairs get new gas lifts or arm pads where needed, desks are tightened and cleaned, and printers are tested with fresh toner.",
        "We deliver across the UAE, and assembly can be added when you order.",
      ],
      faqs: [
        { q: "Do you sell to businesses?", a: "Yes. Order item by item, or message us on WhatsApp for several pieces." },
        { q: "Can you assemble desks?", a: "Yes. Add assembly in the order form; the price is shown before you confirm." },
      ],
    },
    ar: {
      title: "أثاث مكتبي مستعمل في دبي والإمارات",
      description: "كراسي ومكاتب وطابعات مستعملة ومجدّدة للمكاتب المنزلية والشركات في دبي والإمارات. مفحوصة وبأسعار عادلة والدفع عند الاستلام.",
      h1: "أثاث ومعدات مكتبية مستعملة في الإمارات",
      intro: "كراسٍ مريحة ومكاتب وطابعات للمكاتب المنزلية والشركات الصغيرة، مفحوصة وجاهزة للعمل.",
      body: [
        "نستبدل مكابس الغاز أو مساند الذراعين في الكراسي عند الحاجة، ونشدّ المكاتب وننظّفها، ونختبر الطابعات بحبر جديد.",
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
      description: "Lamps, bikes, décor and other household items, checked and fairly priced. Cash on delivery across Dubai and the UAE.",
      h1: "Home décor and household items",
      intro: "Lamps, bikes, décor and other useful things that don't fit a single category.",
      body: ["Items we sell ourselves are cleaned and checked before listing, and we deliver across the UAE with cash on delivery."],
      faqs: [],
    },
    ar: {
      title: "ديكور وأغراض منزلية مستعملة في الإمارات",
      description: "إضاءة ودراجات وديكور وأغراض منزلية أخرى، مفحوصة وبأسعار عادلة. الدفع عند الاستلام في دبي وجميع الإمارات.",
      h1: "ديكور وأغراض منزلية مستعملة",
      intro: "إضاءة ودراجات وديكور وأغراض مفيدة أخرى لا تندرج تحت فئة واحدة.",
      body: ["ننظّف القطع التي نبيعها بأنفسنا ونفحصها قبل عرضها، ونوصل إلى جميع الإمارات والدفع عند الاستلام."],
      faqs: [],
    },
  },
};

export const categoryCopy = (slug: string, locale: Locale): CategoryCopy | undefined => COPY[slug]?.[locale];
