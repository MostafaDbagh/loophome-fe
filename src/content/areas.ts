/**
 * What each Dubai focus community is like, condensed from its area guide (server blog content,
 * part3.ts), for llms.txt: homes, landmarks, who lives there. Facts about the area only; what
 * LoopHome offers there comes from the live settings, so no service promise is made here.
 */
import type { Locale } from "@/i18n/routing";
import type { DUBAI_AREAS } from "@/lib/seo/config";

type Guide = (typeof DUBAI_AREAS)[number]["guide"];

/** Keyed by guide slug: an area added to DUBAI_AREAS without its facts fails the type check. */
export const AREA_FACTS: Record<Guide, Record<Locale, string>> = {
  "jvc-dubai-guide": {
    en: "Nakheel community in numbered districts between Al Khail Road and Sheikh Mohammed bin Zayed Road, off Hessa Street, with Circle Mall inside. Mostly studio to three-bedroom apartments in low- and mid-rise buildings, plus townhouses and villas; popular with young professionals and families, with a busy rental market. Construction continues in parts, so a large van can't always stop outside.",
    ar: "مجتمع من تطوير نخيل مقسّم إلى مناطق مرقّمة بين شارع الخيل وشارع الشيخ محمد بن زايد قرب شارع حصة، وفيه سيركل مول. معظم مساكنه شقق من الاستوديو إلى ثلاث غرف في مبانٍ منخفضة ومتوسطة الارتفاع، مع منازل تاون هاوس وفلل، ويقبل عليه المهنيون الشباب والعائلات، وسوق الإيجار فيه نشط. ولا يزال البناء جارياً في أجزاء منه، فلا تستطيع الشاحنة الكبيرة دائماً التوقف أمام المبنى.",
  },
  "jvt-dubai-guide": {
    en: "Nakheel community next to JVC, known for villas and townhouses with private gardens, plus a growing number of apartment buildings; quieter and family-focused. Moves are bigger than in an apartment: more rooms, garden furniture, and staircases that large pieces must fit down.",
    ar: "مجتمع من تطوير نخيل بجوار قرية جميرا الدائرية، يشتهر بالفلل ومنازل التاون هاوس ذات الحدائق الخاصة، إلى جانب عدد متزايد من المباني السكنية، وطابعه هادئ يناسب العائلات. والانتقال فيه أكبر من انتقال الشقق: غرف أكثر وأثاث حدائق، ودرج يجب أن تمر منه القطع الكبيرة.",
  },
  "jlt-dubai-guide": {
    en: "High-rise towers in lettered clusters around man-made lakes, across Sheikh Zayed Road from Dubai Marina and on the Dubai Metro; developed and managed by DMCC. The towers mix homes and offices, so home and office moves happen all year, through service lifts booked with building management.",
    ar: "أبراج شاهقة في مجموعات مرمّزة بالأحرف حول بحيرات اصطناعية، مقابل دبي مارينا عبر شارع الشيخ زايد، ويخدمها مترو دبي، ويتولى تطويرها وإدارتها مركز دبي للسلع المتعددة (DMCC). تجمع أبراجها بين المساكن والمكاتب، فتشهد انتقالات منازل ومكاتب طوال العام عبر مصاعد الخدمة بحجز من إدارة المبنى.",
  },
  "jbr-dubai-guide": {
    en: "Beachfront residential towers along The Walk, next to Dubai Marina, in six clusters: Sadaf, Bahar, Rimal, Murjan, Shams and Amwaj. Apartments from studios to penthouses, let furnished or unfurnished, many with sea or marina views; movers need the cluster, building and loading point.",
    ar: "أبراج سكنية على الشاطئ على امتداد ممشى ذا ووك بجوار دبي مارينا، في ست مجموعات: صدف وبحر ورمال ومرجان وشمس وأمواج. شقق من الاستوديو إلى البنتهاوس، مفروشة أو غير مفروشة، وكثير منها يطل على البحر أو المارينا، ويحتاج فريق النقل إلى اسم المجموعة والمبنى ونقطة التحميل.",
  },
  "dubai-marina-guide": {
    en: "High-rise residential towers around a man-made canal with the Marina Walk, next to JBR and across Sheikh Zayed Road from JLT, on the Dubai Metro and Dubai Tram. Almost every home is a tower apartment and many residents rent, so people move often; service-lift slots and loading space are limited.",
    ar: "أبراج سكنية شاهقة حول قناة مائية اصطناعية يمتد عليها ممشى المارينا، بجوار JBR ومقابل JLT عبر شارع الشيخ زايد، ويخدمها مترو دبي وترام دبي. كل المساكن تقريباً شقق في أبراج، وكثير من السكان مستأجرون فتكثر الانتقالات، ومواعيد مصعد الخدمة وأماكن التحميل محدودة.",
  },
  "al-barsha-dubai-guide": {
    en: "Established residential district along Sheikh Zayed Road, home to Mall of the Emirates. Al Barsha 1 is mostly apartment buildings and hotels, Al Barsha 2 and 3 mainly villas, and Al Barsha South newer apartment buildings with some villas and townhouses; families and young professionals, many of them renting.",
    ar: "منطقة سكنية راسخة على امتداد شارع الشيخ زايد، وفيها مول الإمارات. البرشاء 1 أغلبها مبانٍ سكنية وفنادق، والبرشاء 2 و3 فلل في الغالب، والبرشاء جنوب مبانٍ أحدث مع بعض الفلل والتاون هاوس، وتسكنها العائلات والمهنيون الشباب، وكثير منهم مستأجرون.",
  },
  "jumeirah-dubai-guide": {
    en: "Coastal district along Jumeirah Beach Road, split into Jumeirah 1, 2 and 3, with La Mer in Jumeirah 1 and Kite Beach just past Jumeirah 3. Mostly villas, standalone or in compounds, with fewer apartments; popular with families who want space.",
    ar: "منطقة ساحلية على امتداد شارع جميرا، مقسّمة إلى جميرا 1 و2 و3، وفيها لا مير في جميرا 1 وشاطئ كايت بعد جميرا 3. أغلب مساكنها فلل مستقلة أو داخل مجمعات مع عدد أقل من الشقق، وتقصدها العائلات التي تبحث عن مساحة.",
  },
  "business-bay-dubai-guide": {
    en: "Business and residential district next to Downtown Dubai, along the Dubai Water Canal. Mostly towers, with residential buildings, offices and hotels side by side, so apartment moves and office moves are both common.",
    ar: "منطقة أعمال وسكن بجوار وسط مدينة دبي على امتداد قناة دبي المائية. معظمها أبراج سكنية ومكتبية وفندقية متجاورة، فيشيع فيها نقل الشقق ونقل المكاتب معاً.",
  },
  "downtown-dubai-guide": {
    en: "Emaar district around Burj Khalifa, The Dubai Mall and Dubai Opera, next to Business Bay and DIFC. Mostly apartments, from studios to penthouses, in high-rise towers and the low-rise Old Town buildings near the Boulevard, rented furnished or unfurnished; furniture goes up in the service lift.",
    ar: "حي من تطوير إعمار حول برج خليفة ودبي مول ودبي أوبرا، بجوار بزنس باي وDIFC. معظم مساكنه شقق من الاستوديو إلى البنتهاوس في أبراج شاهقة وفي مباني المدينة القديمة المنخفضة قرب البوليفارد، مفروشة أو غير مفروشة، ويصعد الأثاث عبر مصعد الخدمة.",
  },
  "difc-dubai-guide": {
    en: "Financial free zone beside Sheikh Zayed Road, next to Downtown Dubai, with its own common-law courts. Mostly office towers, plus a few residential and mixed-use towers, serviced apartments and Gate Village, so most moves here are office moves.",
    ar: "منطقة حرة مالية بمحاذاة شارع الشيخ زايد بجوار وسط مدينة دبي، ولها محاكمها الخاصة. معظم مبانيه أبراج مكتبية، مع عدد محدود من الأبراج السكنية والشقق الفندقية وغيت فيليج، فأغلب الانتقالات فيه انتقالات مكاتب.",
  },
  "dubai-internet-city-office-guide": {
    en: "Technology business park and free zone with the offices of many tech companies, next to Dubai Media City and Dubai Knowledge Park and close to Dubai Marina, JLT and Al Barsha. Offices rather than homes.",
    ar: "مجمع أعمال تقني ومنطقة حرة يضم مكاتب كثير من شركات التكنولوجيا، بجوار مدينة دبي للإعلام ومجمع دبي للمعرفة، وقريب من دبي مارينا وJLT والبرشاء. مكاتب في الغالب لا مساكن.",
  },
  "al-furjan-dubai-guide": {
    en: "Nakheel community of villas, townhouses and low- to mid-rise apartment buildings near Ibn Battuta Mall, with Al Furjan Metro Station (Red Line, Route 2020) on its boundary with Discovery Gardens. Family-oriented: expat families who relocated for work and couples renting a first apartment.",
    ar: "مجتمع من تطوير نخيل يضم فللاً ومنازل تاون هاوس ومباني شقق منخفضة ومتوسطة الارتفاع قرب ابن بطوطة مول، وتقع محطة مترو الفرجان (الخط الأحمر، مسار 2020) عند حدوده مع ديسكفري جاردنز. مجتمع عائلي تسكنه عائلات وافدة انتقلت للعمل وأزواج في أول شقة لهم.",
  },
  "dubai-investment-park-guide": {
    en: "Large mixed-use development in southern Dubai, next to Jebel Ali Industrial Area and Expo City Dubai, split into DIP 1 and DIP 2 with industrial, warehouse, commercial and residential zones. Homes include apartment buildings and, in DIP 1, the Green Community of villas, townhouses and low-rise apartments, served by Dubai Investment Park Metro Station.",
    ar: "مشروع كبير متعدد الاستخدامات في جنوب دبي بجوار منطقة جبل علي الصناعية ومدينة إكسبو دبي، مقسّم إلى مجمع دبي للاستثمار 1 و2، وفيه مناطق صناعية ومستودعات ومناطق تجارية وسكنية. مساكنه مبانٍ سكنية، وفي مجمع دبي للاستثمار 1 مجتمع جرين كوميونيتي بفلله ومنازل التاون هاوس وشققه المنخفضة، وتخدمه محطة مترو مجمع دبي للاستثمار.",
  },
  "arjan-dubai-guide": {
    en: "Residential community in Dubailand, home to Dubai Miracle Garden and Dubai Butterfly Garden, next to Al Barsha South and Motor City. Mostly studio to three-bedroom apartments in newer low- and mid-rise buildings, with many still being built; young professionals and families, many furnishing an empty apartment from scratch.",
    ar: "مجتمع سكني في دبي لاند، فيه حديقة دبي المعجزة وحديقة دبي للفراشات، بجوار البرشاء جنوب وموتور سيتي. معظم مساكنه شقق من الاستوديو إلى ثلاث غرف في مبانٍ حديثة منخفضة ومتوسطة الارتفاع، وكثير من المباني قيد الإنشاء، ويسكنه المهنيون الشباب والعائلات، وكثيرون منهم يؤثثون شقة فارغة من الصفر.",
  },
  "dubailand-guide": {
    en: "A large inland district of many communities, including Arjan, Majan, Liwan and Town Square, rather than one neighbourhood. Low- and mid-rise apartment buildings alongside villa and townhouse communities, with construction still going on in parts; popular with families looking for more space for their budget, and new apartments are often handed over bare.",
    ar: "منطقة داخلية واسعة تضم مجتمعات كثيرة منها أرجان ومجان وليوان وتاون سكوير، لا حياً واحداً. مبانٍ منخفضة ومتوسطة الارتفاع إلى جانب مجتمعات فلل وتاون هاوس، والبناء جارٍ في أجزاء منها، وتقصدها العائلات الباحثة عن مساحة أكبر بميزانية معقولة، والشقق الجديدة تُسلَّم غالباً فارغة.",
  },
  "dubai-sports-city-guide": {
    en: "Community built around sports venues, including the Dubai International Cricket Stadium. Mid-rise apartment buildings plus villa and townhouse communities such as Victory Heights; popular with families and young professionals looking for good value.",
    ar: "مجتمع بُني حول منشآت رياضية منها ملعب دبي الدولي للكريكيت. مبانٍ سكنية متوسطة الارتفاع ومجمعات فلل وتاون هاوس مثل فيكتوري هايتس، ويقصده العائلات والمهنيون الشباب الباحثون عن قيمة جيدة.",
  },
  "motor-city-dubai-guide": {
    en: "Family-friendly Union Properties community around the Dubai Autodrome, with parks between the homes. Uptown Motor City has apartment buildings; Green Community Motor City has villas, townhouses and low-rise apartments.",
    ar: "مجتمع عائلي من تطوير الاتحاد العقارية حول حلبة دبي أوتودروم، تتخلله حدائق ومساحات خضراء. في أب تاون موتور سيتي مبانٍ سكنية، وفي جرين كوميونيتي موتور سيتي فلل ومنازل تاون هاوس وشقق منخفضة الارتفاع.",
  },
  "dubai-production-city-guide": {
    en: "Formerly the International Media Production Zone (IMPZ): mainly mid-rise apartment buildings around a free zone for media, printing and publishing businesses. Many homes are studios and one- or two-bedroom apartments, so compact furniture matters; popular with people looking for good value.",
    ar: "كانت تُعرف سابقاً باسم IMPZ، وتغلب عليها المباني السكنية متوسطة الارتفاع حول منطقة حرة لشركات الإعلام والطباعة والنشر. كثير من مساكنها استوديوهات وشقق بغرفة أو غرفتين، فالأثاث المدمج مهم هنا، ويختارها الباحثون عن قيمة جيدة.",
  },
};

/** Area landing pages (/areas/[slug]), in the order the index lists them. */
export const AREA_SLUGS = [
  "jvc",
  "jlt",
  "dubai-marina",
  "al-barsha",
  "business-bay",
  "downtown-dubai",
  "jumeirah",
  "arabian-ranches",
  "dubai-hills",
  "al-quoz",
  "deira",
  "mirdif",
  "silicon-oasis",
  "motor-city",
  "sports-city",
] as const;
export type AreaSlug = (typeof AREA_SLUGS)[number];

export type Area = {
  name: Record<Locale, string>;
  /** What the area is like, so each page has its own text. Facts about the area only, no service promise. */
  local: Record<Locale, string>;
  /** 3–4 nearby area pages. */
  near: AreaSlug[];
  /** Its area guide on the blog, linked once that post is published. */
  guide?: Guide;
  /** 2–4 pickup notes for the area page (shown while LoopHome buys): only this area's own facts plus owner-confirmed claims. */
  tips: Record<Locale, string[]>;
};

/** An area with a guide reuses the guide's facts (the same text llms.txt gives). */
const fromGuide = (guide: Guide) => ({ guide, local: AREA_FACTS[guide] });

export const AREAS: Record<AreaSlug, Area> = {
  jvc: {
    name: { en: "JVC", ar: "قرية جميرا الدائرية" },
    near: ["al-barsha", "sports-city", "motor-city", "dubai-hills"],
    ...fromGuide("jvc-dubai-guide"),
    tips: {
      en: [
        "JVC is laid out in numbered districts, so send your district number and building name with your photos.",
        "Construction is still going on in parts of JVC and a large van can't always stop outside, so tell us where it can park near your building.",
        "JVC's rental market is busy. Moving out at the end of a lease? Tell us your move-out date. If you book ahead, we can collect on your handover day.",
      ],
      ar: [
        "تنقسم قرية جميرا الدائرية إلى مناطق مرقّمة، فأرسل مع الصور رقم المنطقة واسم المبنى.",
        "لا يزال البناء جارياً في أجزاء من المنطقة، ولا تستطيع الشاحنة الكبيرة دائماً التوقف أمام المبنى، فأخبرنا أين يمكنها الوقوف قرب مبناك.",
        "سوق الإيجار في المنطقة نشط. ستغادر مع انتهاء عقدك؟ أخبرنا بموعد مغادرتك، وإذا حجزت مسبقاً يمكننا الاستلام في يوم تسليم البيت.",
      ],
    },
  },
  jlt: {
    name: { en: "JLT", ar: "أبراج بحيرات جميرا" },
    near: ["dubai-marina", "al-barsha", "jvc"],
    ...fromGuide("jlt-dubai-guide"),
    tips: {
      en: [
        "JLT towers are grouped in lettered clusters, so tell us your cluster letter and tower name when you send photos.",
        "Furniture leaves JLT towers through a service lift booked with building management. Book a slot for the pickup and tell us the times they allow; we plan the pickup around them.",
        "The towers mix homes and offices, and we buy office chairs, desks and printers from homes and businesses.",
      ],
      ar: [
        "تتوزع أبراج بحيرات جميرا على مجموعات مرمّزة بالأحرف، فأخبرنا بحرف المجموعة واسم البرج عند إرسال الصور.",
        "يخرج الأثاث من الأبراج عبر مصعد الخدمة بحجز من إدارة المبنى. احجز موعداً للاستلام وأخبرنا بالأوقات المسموح بها، ونرتب الاستلام حسبها.",
        "تجمع الأبراج بين المساكن ومقارّ الشركات، ونشتري الكراسي والمكاتب والطابعات المكتبية من البيوت والشركات.",
      ],
    },
  },
  "dubai-marina": {
    name: { en: "Dubai Marina", ar: "دبي مارينا" },
    near: ["jlt", "al-barsha", "jvc"],
    ...fromGuide("dubai-marina-guide"),
    tips: {
      en: [
        "Service-lift slots are limited in Marina towers, so book the lift with your building management and tell us the times they allow; we plan the pickup around them.",
        "Loading space is limited too: tell us your tower name and its loading point when you send photos.",
        "Many Marina residents rent. Handing your apartment back? Tell us your move-out date. If you book ahead, we can collect on your handover day.",
      ],
      ar: [
        "مواعيد مصعد الخدمة محدودة في أبراج المارينا، فاحجز المصعد من إدارة المبنى وأخبرنا بالأوقات المسموح بها، ونرتب الاستلام حسبها.",
        "أماكن التحميل محدودة أيضاً، فأخبرنا باسم البرج ونقطة التحميل فيه عند إرسال الصور.",
        "كثير من سكان المارينا مستأجرون. ستعيد شقتك إلى المالك؟ أخبرنا بموعد مغادرتك، وإذا حجزت مسبقاً يمكننا الاستلام في يوم تسليم البيت.",
      ],
    },
  },
  "al-barsha": {
    name: { en: "Al Barsha", ar: "البرشاء" },
    near: ["al-quoz", "dubai-hills", "jlt", "jvc"],
    ...fromGuide("al-barsha-dubai-guide"),
    tips: {
      en: [
        "Tell us whether you're in Al Barsha 1, 2, 3 or Al Barsha South, and whether you're selling from an apartment, a villa or a townhouse.",
        "In the apartment buildings of Al Barsha 1 and Al Barsha South, check with your building management whether the pickup needs a service-lift booking, and tell us the times they allow.",
        "Selling a whole villa in Al Barsha 2 or 3? Send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
      ],
      ar: [
        "أخبرنا هل أنت في البرشاء 1 أو 2 أو 3 أو البرشاء جنوب، وهل تبيع من شقة أم فيلا أم تاون هاوس.",
        "إن كنت في أحد مباني البرشاء 1 أو البرشاء جنوب، فاسأل إدارة المبنى هل يحتاج الاستلام إلى حجز مصعد الخدمة، وأخبرنا بالأوقات المسموح بها.",
        "تبيع أثاث فيلا كاملة في البرشاء 2 أو 3؟ أرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
      ],
    },
  },
  "business-bay": {
    name: { en: "Business Bay", ar: "الخليج التجاري (بزنس باي)" },
    near: ["downtown-dubai", "al-quoz", "jumeirah", "deira"],
    ...fromGuide("business-bay-dubai-guide"),
    tips: {
      en: [
        "Business Bay is mostly towers, with homes, offices and hotels side by side, so tell us the tower name and whether you're selling from an apartment or an office.",
        "Many Dubai towers ask for a move-out permit or a service-lift booking when large furniture leaves. Check with your building management and tell us the times they allow; we plan the pickup around them.",
        "Selling from an office? We buy office chairs, desks and printers from homes and businesses; message us on WhatsApp if you have many pieces.",
      ],
      ar: [
        "معظم الخليج التجاري أبراج تتجاور فيها المساكن والمكاتب والفنادق، فأخبرنا باسم البرج وهل تبيع من شقة أم من مكتب.",
        "تطلب أبراج كثيرة في دبي تصريح خروج أو حجز مصعد الخدمة عند إخراج أثاث كبير. تأكد من إدارة المبنى وأخبرنا بالأوقات المسموح بها، ونرتب الاستلام حسبها.",
        "تبيع من مكتب؟ نشتري الكراسي والمكاتب والطابعات المكتبية من البيوت والشركات، وراسلنا على واتساب إذا كانت لديك قطع كثيرة.",
      ],
    },
  },
  "downtown-dubai": {
    name: { en: "Downtown Dubai", ar: "وسط مدينة دبي (داون تاون)" },
    near: ["business-bay", "jumeirah", "al-quoz"],
    ...fromGuide("downtown-dubai-guide"),
    tips: {
      en: [
        "Tell us your tower or building name when you send photos, whether you're in a high-rise or in the Old Town buildings near the Boulevard.",
        "Furniture moves through the service lift here: book it with your building management for the pickup and tell us the times they allow; we plan the pickup around them.",
        "Rented your apartment furnished? Send photos only of the pieces that are yours to sell.",
      ],
      ar: [
        "أخبرنا باسم البرج أو المبنى عند إرسال الصور، سواء كنت في برج شاهق أو في مباني المدينة القديمة قرب البوليفارد.",
        "يمر الأثاث هنا عبر مصعد الخدمة، فاحجزه من إدارة المبنى لموعد الاستلام وأخبرنا بالأوقات المسموح بها، ونرتب الاستلام حسبها.",
        "استأجرت شقتك مفروشة؟ أرسل صور القطع التي تملكها فقط.",
      ],
    },
  },
  jumeirah: {
    name: { en: "Jumeirah", ar: "جميرا" },
    near: ["al-quoz", "downtown-dubai", "business-bay", "al-barsha"],
    ...fromGuide("jumeirah-dubai-guide"),
    tips: {
      en: [
        "Tell us whether you're in Jumeirah 1, 2 or 3, your street or compound name, your villa number and a nearby landmark, such as La Mer in Jumeirah 1.",
        "Most homes here are villas, popular with families who want space. Selling a whole villa? Send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
      ],
      ar: [
        "أخبرنا هل أنت في جميرا 1 أو 2 أو 3، وباسم الشارع أو المجمع ورقم الفيلا، وبمعلم قريب مثل لا مير في جميرا 1.",
        "أغلب المساكن هنا فلل تقصدها العائلات التي تبحث عن مساحة. تبيع أثاث فيلا كاملة؟ أرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
      ],
    },
  },
  // TODO(owner): the next six have no area guide, so their text was written for these pages. Please check it.
  "arabian-ranches": {
    name: { en: "Arabian Ranches", ar: "المرابع العربية" },
    near: ["motor-city", "sports-city", "dubai-hills"],
    local: {
      en: "Emaar villa community off Al Qudra Road, next to Motor City, built around the Arabian Ranches Golf Club, with Arabian Ranches 2 and 3 added later. Almost every home is a villa or townhouse with a garden, and most residents are families.",
      ar: "مجتمع فلل من تطوير إعمار على شارع القدرة بجوار موتور سيتي، بُني حول نادي المرابع العربية للغولف، ثم أُضيف إليه المرابع العربية 2 و3. كل المساكن تقريباً فلل ومنازل تاون هاوس بحدائق، وأغلب سكانه عائلات.",
    },
    tips: {
      en: [
        "Tell us whether you're in Arabian Ranches, Arabian Ranches 2 or Arabian Ranches 3, with your villa number, and send your location on WhatsApp with your photos.",
        "Selling everything in a family villa? Send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
        "Leaving your villa or townhouse? Tell us your move-out date. If you book ahead, we can collect on your handover day.",
      ],
      ar: [
        "أخبرنا هل أنت في المرابع العربية أو المرابع العربية 2 أو 3، مع رقم الفيلا، وأرسل موقعك عبر واتساب مع الصور.",
        "تبيع أثاث فيلتك كاملاً؟ أرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
        "ستغادر الفيلا أو التاون هاوس؟ أخبرنا بموعد مغادرتك، وإذا حجزت مسبقاً يمكننا الاستلام في يوم تسليم البيت.",
      ],
    },
  },
  "dubai-hills": {
    name: { en: "Dubai Hills", ar: "دبي هيلز" },
    near: ["al-barsha", "al-quoz", "arabian-ranches", "jvc"],
    local: {
      en: "Dubai Hills Estate, by Emaar and Meraas, in Mohammed Bin Rashid City between Al Khail Road and Umm Suqeim Street. Built around a golf course and Dubai Hills Park, with Dubai Hills Mall on its edge; villas and townhouses sit alongside a growing number of apartment buildings.",
      ar: "دبي هيلز استيت، من تطوير إعمار ومراس، في مدينة محمد بن راشد بين شارع الخيل وشارع أم سقيم. بُني حول ملعب غولف وحديقة دبي هيلز، وعلى طرفه دبي هيلز مول، وفيه فلل ومنازل تاون هاوس إلى جانب عدد متزايد من المباني السكنية.",
    },
    tips: {
      en: [
        "Tell us whether you're selling from a villa, a townhouse or an apartment in Dubai Hills Estate, with the building name or villa number.",
        "In the apartment buildings, check with your building management whether the pickup needs a service-lift booking, and tell us the times they allow.",
        "From a villa or townhouse, send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
      ],
      ar: [
        "أخبرنا هل تبيع من فيلا أو تاون هاوس أو شقة في دبي هيلز استيت، مع اسم المبنى أو رقم الفيلا.",
        "إن كنت في أحد المباني السكنية، فاسأل إدارة المبنى هل يحتاج الاستلام إلى حجز مصعد الخدمة، وأخبرنا بالأوقات المسموح بها.",
        "إن كنت تبيع من فيلا أو تاون هاوس، فأرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
      ],
    },
  },
  "al-quoz": {
    name: { en: "Al Quoz", ar: "القوز" },
    near: ["al-barsha", "jumeirah", "business-bay", "dubai-hills"],
    local: {
      en: "Largely industrial area between Sheikh Zayed Road and Al Khail Road, with warehouses, workshops and showrooms in Al Quoz Industrial and the Alserkal Avenue art district. Al Quoz 1 to 4 have quieter residential streets, mostly villas. LoopHome's warehouse is in Al Quoz.",
      ar: "منطقة أغلبها صناعية بين شارع الشيخ زايد وشارع الخيل، فيها مستودعات وورش وصالات عرض في القوز الصناعية، وحي السركال أفنيو للفنون. أما القوز من 1 إلى 4 ففيها شوارع سكنية أهدأ أغلبها فلل. ومستودع لوب هوم في القوز.",
    },
    tips: {
      en: [
        "In Al Quoz 1 to 4, tell us your street and villa number when you send photos.",
        "Selling a whole villa? Send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
        "Selling from a business in Al Quoz Industrial? Tell us its name and opening hours so we can plan the pickup. We buy office chairs, desks and printers from homes and businesses.",
      ],
      ar: [
        "إن كنت في القوز من 1 إلى 4، فأخبرنا باسم الشارع ورقم الفيلا عند إرسال الصور.",
        "تبيع أثاث فيلا كاملة؟ أرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
        "تبيع من شركة في القوز الصناعية؟ أخبرنا باسمها وساعات عملها لنرتب الاستلام. نشتري الكراسي والمكاتب والطابعات المكتبية من البيوت والشركات.",
      ],
    },
  },
  deira: {
    name: { en: "Deira", ar: "ديرة" },
    near: ["mirdif", "business-bay", "downtown-dubai"],
    local: {
      en: "Dubai's old trading district on the north side of Dubai Creek, home to the Gold Souk, the Spice Souk and Deira City Centre, close to Dubai International Airport and on both Dubai Metro lines. Mostly older mid-rise apartment buildings, many above shops, in neighbourhoods such as Al Rigga and Port Saeed.",
      ar: "منطقة دبي التجارية القديمة على الضفة الشمالية لخور دبي، وفيها سوق الذهب وسوق التوابل وسيتي سنتر ديرة، قرب مطار دبي الدولي، ويمر بها خطا مترو دبي. أغلب مساكنها شقق في مبانٍ قديمة متوسطة الارتفاع، كثير منها فوق المحلات، في أحياء مثل الرقة وبورسعيد.",
    },
    tips: {
      en: [
        "Many of Deira's older buildings sit above shops, so tell us your neighbourhood, such as Al Rigga or Port Saeed, the building name, the floor and whether there's a lift.",
        "Tell us where a van can stop on your street. A nearby landmark, such as Deira City Centre, helps us find you.",
        "Leaving your apartment? Tell us your move-out date. If you book ahead, we can collect on your handover day.",
      ],
      ar: [
        "كثير من مباني ديرة القديمة فوق المحلات، فأخبرنا باسم الحي، مثل الرقة أو بورسعيد، واسم المبنى والطابق، وهل في المبنى مصعد.",
        "أخبرنا أين يمكن للشاحنة أن تتوقف في شارعك، ويساعدنا ذكر معلم قريب مثل سيتي سنتر ديرة على الوصول إليك.",
        "ستغادر شقتك؟ أخبرنا بموعد مغادرتك، وإذا حجزت مسبقاً يمكننا الاستلام في يوم تسليم البيت.",
      ],
    },
  },
  mirdif: {
    name: { en: "Mirdif", ar: "مردف" },
    near: ["deira", "silicon-oasis", "business-bay"],
    local: {
      en: "Residential suburb east of Dubai International Airport, next to Mushrif Park, with City Centre Mirdif and Uptown Mirdif. Mostly villas and townhouses, many in small compounds, plus some apartment buildings; popular with families.",
      ar: "ضاحية سكنية شرق مطار دبي الدولي بجوار حديقة مشرف، وفيها سيتي سنتر مردف وأب تاون مردف. أغلب مساكنها فلل ومنازل تاون هاوس، كثير منها في مجمعات صغيرة، مع بعض المباني السكنية، وتقبل عليها العائلات.",
    },
    tips: {
      en: [
        "In one of Mirdif's small compounds? Tell us the compound name and your villa number, or your building name and flat number if you're in an apartment building.",
        "A nearby landmark, such as City Centre Mirdif, Uptown Mirdif or Mushrif Park, helps us find your street.",
        "Selling a family home's furniture before you move? Tell us your move-out date. If you book ahead, we can collect on your handover day.",
      ],
      ar: [
        "إن كنت في أحد مجمعات مردف الصغيرة، فأخبرنا باسم المجمع ورقم الفيلا، أو باسم المبنى ورقم الشقة إن كنت في مبنى سكني.",
        "يساعدنا ذكر معلم قريب منك، مثل سيتي سنتر مردف أو أب تاون مردف أو حديقة مشرف، على الوصول إلى شارعك بسهولة.",
        "تبيع أثاث بيت عائلي قبل الانتقال؟ أخبرنا بموعد مغادرتك، وإذا حجزت مسبقاً يمكننا الاستلام في يوم تسليم البيت.",
      ],
    },
  },
  "silicon-oasis": {
    name: { en: "Dubai Silicon Oasis", ar: "واحة دبي للسيليكون" },
    near: ["mirdif", "deira", "business-bay"],
    local: {
      en: "Free zone and residential community on the Dubai–Al Ain Road, next to Dubai Academic City, where technology companies' offices sit beside homes. Mostly apartment buildings, plus villas and townhouses, with Silicon Central mall inside.",
      ar: "منطقة حرة ومجتمع سكني على شارع دبي العين بجوار مدينة دبي الأكاديمية، تجاور فيه مكاتب شركات التقنية المساكن. أغلبها مبانٍ سكنية، مع فلل ومنازل تاون هاوس، وفيها مول سيليكون سنترال.",
    },
    tips: {
      en: [
        "Tell us your building or villa name in Dubai Silicon Oasis when you send photos.",
        "In an apartment building, check with your building management whether the pickup needs a service-lift booking, and tell us the times they allow.",
        "From a villa or townhouse, send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
        "Technology companies sit beside the homes here, and we buy office chairs, desks and printers from homes and businesses.",
      ],
      ar: [
        "أخبرنا باسم المبنى أو الفيلا في واحة دبي للسيليكون عند إرسال الصور.",
        "إن كنت في مبنى سكني، فاسأل إدارة المبنى هل يحتاج الاستلام إلى حجز مصعد الخدمة، وأخبرنا بالأوقات المسموح بها.",
        "إن كنت تبيع من فيلا أو تاون هاوس، فأرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
        "تجاور شركات التقنية المساكن هنا، ونشتري الكراسي والمكاتب والطابعات المكتبية من البيوت والشركات.",
      ],
    },
  },
  "motor-city": {
    name: { en: "Motor City", ar: "موتور سيتي" },
    near: ["sports-city", "arabian-ranches", "jvc", "dubai-hills"],
    ...fromGuide("motor-city-dubai-guide"),
    tips: {
      en: [
        "Tell us whether you're in Uptown Motor City or Green Community Motor City, with your building name or villa number.",
        "In Uptown Motor City's apartment buildings, check with your building management whether the pickup needs a service-lift booking, and tell us the times they allow.",
        "Leaving a family home in Green Community Motor City? Tell us your move-out date. If you book ahead, we can collect on your handover day.",
      ],
      ar: [
        "أخبرنا هل أنت في أب تاون موتور سيتي أو جرين كوميونيتي موتور سيتي، مع اسم المبنى أو رقم الفيلا.",
        "إن كنت في أحد مباني أب تاون موتور سيتي، فاسأل إدارة المبنى هل يحتاج الاستلام إلى حجز مصعد الخدمة، وأخبرنا بالأوقات المسموح بها.",
        "تغادر بيتاً عائلياً في جرين كوميونيتي موتور سيتي؟ أخبرنا بموعد مغادرتك، وإذا حجزت مسبقاً يمكننا الاستلام في يوم تسليم البيت.",
      ],
    },
  },
  "sports-city": {
    name: { en: "Dubai Sports City", ar: "مدينة دبي الرياضية" },
    near: ["motor-city", "jvc", "arabian-ranches"],
    ...fromGuide("dubai-sports-city-guide"),
    tips: {
      en: [
        "Tell us your building name or, in a villa community such as Victory Heights, the community name and your villa number.",
        "In the mid-rise apartment buildings, check with your building management whether the pickup needs a service-lift booking, and tell us the times they allow.",
        "Selling a whole villa in Victory Heights? Send one short video walking through your home on WhatsApp, and we reply with one offer for all items, usually within 24 hours.",
      ],
      ar: [
        "أخبرنا باسم المبنى، أو باسم المجمع ورقم الفيلا إن كنت في مجمع فلل مثل فيكتوري هايتس.",
        "إن كنت في أحد المباني السكنية متوسطة الارتفاع، فاسأل إدارة المبنى هل يحتاج الاستلام إلى حجز مصعد الخدمة، وأخبرنا بالأوقات المسموح بها.",
        "تبيع أثاث فيلا كاملة في فيكتوري هايتس؟ أرسل عبر واتساب فيديو قصيراً تتجوّل فيه داخل بيتك، ونرسل لك عرضاً واحداً لكل القطع، عادةً خلال 24 ساعة.",
      ],
    },
  },
};

export const isAreaSlug = (slug: string): slug is AreaSlug => (AREA_SLUGS as readonly string[]).includes(slug);

/** "Dubai Marina" stays as is; "JVC" becomes "JVC, Dubai". */
const inDubai = (area: string, suffix: string) => (/dubai|دبي/i.test(area) ? area : `${area}${suffix}`);

/** Wording around each area's facts. */
export const AREA_COPY = {
  en: {
    title: (area: string) => `Sell Used Furniture in ${inDubai(area, ", Dubai")}`,
    description: (area: string) =>
      `LoopHome buys used furniture and appliances in ${area} for cash, with free pickup. Send photos on WhatsApp to get an offer.`,
    h1: (area: string) => `Sell your used furniture in ${area}`,
    intro: (area: string) =>
      `LoopHome buys used furniture and appliances from homes in ${area} for cash, with free pickup. Send photos on WhatsApp to get an offer.`,
    about: (area: string) => `About ${area}`,
    guide: (area: string) => `Read our ${area} area guide`,
    near: "Nearby areas",
    whatsapp: (area: string) => `Hi LoopHome, I want to sell my furniture in ${area}`,
    tipsTitle: (area: string) => `Arranging a pickup in ${area}`,
    howTitle: "How selling works",
    how: [
      "Send photos and a short description on WhatsApp or through our sell form.",
      "We reply on WhatsApp with an offer, usually within 24 hours.",
      "If you accept, we collect the items from your home for free.",
    ],
    whatTitle: "What we buy",
    index: {
      title: "Areas We Serve in Dubai",
      description:
        "LoopHome buys used furniture and appliances all over Dubai, with free pickup. Find your area: JVC, JLT, Dubai Marina, Business Bay, Al Barsha and more.",
      h1: "Areas we serve",
      intro: "We collect for free from homes all over Dubai. Each page below covers one community: what it's like and what to tell us when you arrange a pickup there.",
      all: "All areas we serve",
    },
  },
  ar: {
    title: (area: string) => `بيع الأثاث المستعمل في ${inDubai(area, "، دبي")}`,
    description: (area: string) =>
      `لوب هوم تشتري الأثاث والأجهزة المستعملة في ${area} نقداً، مع استلام مجاني. أرسل الصور عبر واتساب واحصل على عرض.`,
    h1: (area: string) => `بِع أثاثك المستعمل في ${area}`,
    intro: (area: string) =>
      `لوب هوم تشتري الأثاث والأجهزة المستعملة من المنازل في ${area} نقداً، مع استلام مجاني. أرسل الصور عبر واتساب واحصل على عرض.`,
    about: (area: string) => `عن ${area}`,
    guide: (area: string) => `اقرأ دليلنا عن ${area}`,
    near: "مناطق قريبة",
    whatsapp: (area: string) => `مرحباً لوب هوم، أريد بيع أثاثي في ${area}`,
    tipsTitle: (area: string) => `ترتيب الاستلام في ${area}`,
    howTitle: "كيف يتم البيع",
    how: [
      "أرسل الصور ووصفاً قصيراً عبر واتساب أو عبر نموذج البيع.",
      "نرسل لك عرضاً عبر واتساب، عادةً خلال 24 ساعة.",
      "إذا قبلت العرض نستلم القطع من منزلك مجاناً.",
    ],
    whatTitle: "ماذا نشتري",
    index: {
      title: "المناطق التي نخدمها في دبي",
      description:
        "لوب هوم تشتري الأثاث والأجهزة المستعملة في جميع أنحاء دبي مع استلام مجاني. اختر منطقتك: قرية جميرا الدائرية، دبي مارينا، بزنس باي، البرشاء وغيرها.",
      h1: "المناطق التي نخدمها",
      intro: "نستلم مجاناً من المنازل في جميع أنحاء دبي. تتناول كل صفحة أدناه منطقة واحدة: طبيعتها وما تخبرنا به عند ترتيب الاستلام فيها.",
      all: "كل المناطق التي نخدمها",
    },
  },
} satisfies Record<Locale, unknown>;
