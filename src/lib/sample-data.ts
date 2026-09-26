/**
 * Development-only sample catalogue, used when the API is unreachable so the UI
 * can be built and reviewed. Never used in production (see USE_SAMPLES in api.ts).
 */
import type { Locale } from "@/i18n/routing";
import type { Category, Feed, Product, ProductDetail, ProductPage, SearchParams } from "./api";

type Localized = { en: string; ar: string };

const CATS: (Omit<Category, "name"> & { name: Localized })[] = [
  { id: "c1", slug: "furniture-home", name: { en: "Furniture & Home", ar: "الأثاث والمنزل" }, icon: "sofa", color: "amber" },
  { id: "c2", slug: "appliances-electronics", name: { en: "Appliances & Electronics", ar: "الأجهزة والإلكترونيات" }, icon: "tv", color: "sky" },
  { id: "c3", slug: "fashion-accessories", name: { en: "Fashion & Accessories", ar: "الأزياء والإكسسوارات" }, icon: "shirt", color: "pink" },
  { id: "c4", slug: "kids-baby", name: { en: "Kids & Baby", ar: "الأطفال والرضّع" }, icon: "baby", color: "emerald" },
  { id: "c6", slug: "office-equipment", name: { en: "Office Equipment", ar: "المعدات المكتبية" }, icon: "printer", color: "teal" },
  { id: "c5", slug: "other", name: { en: "Other", ar: "أخرى" }, icon: "package", color: "violet" },
];

const img = (id: string) => ({
  url: `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`,
  thumbUrl: `https://images.unsplash.com/${id}?w=500&q=70&auto=format&fit=crop`,
});

type Raw = {
  slug: string;
  cat: number;
  title: Localized;
  description: Localized;
  photos: string[];
  condition: Product["condition"];
  price: number;
  originalPrice?: number;
  negotiable?: boolean;
  warrantyDays?: number;
  highlights?: Localized[];
  status?: Product["status"];
};

const RAW: Raw[] = [
  {
    slug: "grey-3-seater-sofa",
    cat: 0,
    title: { en: "Grey 3-seater fabric sofa", ar: "كنبة قماش رمادية 3 مقاعد" },
    description: {
      en: "Comfortable three-seater sofa with new cushion foam and a deep clean. Solid wooden frame, no wobble. 210 × 90 cm.",
      ar: "كنبة مريحة بثلاثة مقاعد مع إسفنج جديد للوسائد وتنظيف عميق. هيكل خشبي متين. 210 × 90 سم.",
    },
    photos: ["photo-1555041469-a586c61ea9bc", "photo-1493663284031-b7e3aefcae8e"],
    condition: "premium",
    price: 1150,
    originalPrice: 2400,
    negotiable: true,
    warrantyDays: 30,
    highlights: [
      { en: "New cushion foam", ar: "إسفنج وسائد جديد" },
      { en: "Professional deep clean", ar: "تنظيف عميق احترافي" },
    ],
  },
  {
    slug: "oak-dining-table-6",
    cat: 0,
    title: { en: "Oak dining table for 6", ar: "طاولة طعام من خشب البلوط لـ 6 أشخاص" },
    description: {
      en: "Solid oak table, sanded and re-varnished. Seats six comfortably. Chairs not included.",
      ar: "طاولة من خشب البلوط الصلب، تم صنفرتها وإعادة طلائها. تتسع لستة أشخاص. الكراسي غير مشمولة.",
    },
    photos: ["photo-1617806118233-18e1de247200"],
    condition: "semi_new",
    price: 890,
    originalPrice: 1600,
    warrantyDays: 14,
    highlights: [{ en: "Re-varnished top", ar: "إعادة طلاء السطح" }],
  },
  {
    slug: "samsung-fridge-400l",
    cat: 1,
    title: { en: "Samsung fridge 400L", ar: "ثلاجة سامسونج 400 لتر" },
    description: {
      en: "Double-door fridge, fully tested and gas refilled. Quiet, cools fast. Small scratch on the side.",
      ar: "ثلاجة بابين، تم فحصها بالكامل وتعبئة الغاز. هادئة وتبرّد بسرعة. خدش صغير على الجانب.",
    },
    photos: ["photo-1571175443880-49e1d25b2bc5"],
    condition: "good",
    price: 950,
    originalPrice: 2100,
    negotiable: true,
    warrantyDays: 60,
    highlights: [
      { en: "Gas refilled", ar: "تعبئة الغاز" },
      { en: "New door seals", ar: "مطاط أبواب جديد" },
    ],
  },
  {
    slug: "lg-washing-machine-8kg",
    cat: 1,
    title: { en: "LG front-load washer 8 kg", ar: "غسالة إل جي أمامية 8 كغ" },
    description: {
      en: "Front-loading washing machine with a new drain pump. All programs tested.",
      ar: "غسالة بتحميل أمامي مع مضخة تصريف جديدة. تم اختبار جميع البرامج.",
    },
    photos: ["photo-1626806787461-102c1bfaaea1"],
    condition: "premium",
    price: 780,
    originalPrice: 1500,
    warrantyDays: 60,
    highlights: [{ en: "New drain pump", ar: "مضخة تصريف جديدة" }],
  },
  {
    slug: "smart-tv-55",
    cat: 1,
    title: { en: '55" 4K smart TV', ar: "تلفاز ذكي 55 بوصة 4K" },
    description: { en: "4K smart TV with remote and wall mount. Panel is perfect.", ar: "تلفاز ذكي 4K مع ريموت وحامل جداري. الشاشة ممتازة." },
    photos: ["photo-1593359677879-a4bb92f829d1"],
    condition: "new",
    price: 1300,
    originalPrice: 1900,
    warrantyDays: 90,
    status: "reserved",
  },
  {
    slug: "leather-handbag-tan",
    cat: 2,
    title: { en: "Tan leather handbag", ar: "حقيبة يد جلدية بنية" },
    description: { en: "Genuine leather handbag, cleaned and conditioned. Barely used.", ar: "حقيبة جلد طبيعي، منظّفة ومعالجة. استخدام خفيف جداً." },
    photos: ["photo-1548036328-c9fa89d128fa"],
    condition: "semi_new",
    price: 220,
    negotiable: true,
  },
  {
    slug: "baby-stroller-foldable",
    cat: 3,
    title: { en: "Foldable baby stroller", ar: "عربة أطفال قابلة للطي" },
    description: {
      en: "Lightweight stroller with a new canopy fabric. Folds with one hand. Brakes checked.",
      ar: "عربة خفيفة مع قماش مظلة جديد. تُطوى بيد واحدة. تم فحص الفرامل.",
    },
    photos: ["photo-1586048876543-d6a0e1b1e4b1"],
    condition: "good",
    price: 260,
    originalPrice: 700,
    warrantyDays: 14,
    highlights: [{ en: "New canopy fabric", ar: "قماش مظلة جديد" }],
  },
  {
    slug: "wooden-kids-bed",
    cat: 3,
    title: { en: "Wooden kids bed with drawer", ar: "سرير أطفال خشبي مع درج" },
    description: { en: "Single kids bed with storage drawer. Repainted in white.", ar: "سرير أطفال مفرد مع درج تخزين. أعيد طلاؤه باللون الأبيض." },
    photos: ["photo-1566665797739-1674de7a421a"],
    condition: "fair",
    price: 340,
  },
  {
    slug: "laser-printer",
    cat: 4,
    title: { en: "HP laser printer", ar: "طابعة ليزر HP" },
    description: { en: "Mono laser printer with new toner. Wi-Fi and USB.", ar: "طابعة ليزر أبيض وأسود مع حبر جديد. واي فاي و USB." },
    photos: ["photo-1612815154858-60aa4c59eaa6"],
    condition: "good",
    price: 420,
    originalPrice: 950,
    warrantyDays: 30,
  },
  {
    slug: "mountain-bike-27",
    cat: 5,
    title: { en: 'Mountain bike 27.5"', ar: "دراجة جبلية 27.5 بوصة" },
    description: { en: "Serviced bike with new brake pads and chain.", ar: "دراجة تمت صيانتها مع فحمات فرامل وسلسلة جديدة." },
    photos: ["photo-1485965120184-e220f721d03e"],
    condition: "good",
    price: 480,
    originalPrice: 1100,
    negotiable: true,
    highlights: [{ en: "New chain and brake pads", ar: "سلسلة وفحمات فرامل جديدة" }],
  },
  {
    slug: "office-chair-ergonomic",
    cat: 4,
    title: { en: "Ergonomic office chair", ar: "كرسي مكتب مريح" },
    description: { en: "Mesh-back office chair with adjustable arms. New gas lift.", ar: "كرسي مكتب بظهر شبكي وذراعين قابلين للتعديل. مكبس غاز جديد." },
    photos: ["photo-1580480055273-228ff5388ef8"],
    condition: "premium",
    price: 390,
    originalPrice: 950,
    warrantyDays: 30,
  },
];

function toProduct(r: Raw, i: number, locale: Locale): Product {
  const c = CATS[r.cat];
  return {
    id: `sample-${i}`,
    ref: `HL-${String(i + 1).padStart(6, "0")}`,
    views: 12 + i * 7,
    slug: r.slug,
    title: r.title[locale],
    description: r.description[locale],
    photos: r.photos.map(img),
    condition: r.condition,
    price: r.price,
    ...(r.originalPrice ? { originalPrice: r.originalPrice, savingPercent: Math.round((1 - r.price / r.originalPrice) * 100) } : {}),
    currency: "AED",
    negotiable: !!r.negotiable,
    warrantyDays: r.warrantyDays ?? 0,
    highlights: (r.highlights ?? []).map((h) => h[locale]),
    freeDelivery: false,
    freeServices: [],
    inspected: true,
    status: r.status ?? "active",
    category: { id: c.id, slug: c.slug, name: c.name[locale], color: c.color },
    publishedAt: new Date(Date.UTC(2026, 8, 20 - i)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 8, 20 - i)).toISOString(),
  };
}

const all = (locale: Locale) => RAW.map((r, i) => toProduct(r, i, locale));

export const SAMPLE_CATEGORIES = (locale: Locale): Category[] => CATS.map((c) => ({ ...c, name: c.name[locale] }));

export function sampleFeed(locale: Locale): Feed {
  const products = all(locale).filter((p) => p.status === "active");
  return {
    newArrivals: products.slice(0, 8),
    byCategory: SAMPLE_CATEGORIES(locale)
      .map((category) => ({ category, items: products.filter((p) => p.category?.slug === category.slug) }))
      .filter((g) => g.items.length),
    bestDeals: [...products]
      .filter((p) => p.savingPercent)
      .sort((a, b) => (b.savingPercent ?? 0) - (a.savingPercent ?? 0))
      .slice(0, 8),
  };
}

export function sampleSearch(locale: Locale, params: SearchParams): ProductPage {
  let items = all(locale).filter((p) => p.status === "active");
  if (params.category) items = items.filter((p) => p.category?.slug === params.category);
  if (params.condition) {
    const wanted = params.condition.split(",");
    items = items.filter((p) => wanted.includes(p.condition));
  }
  if (params.negotiable === "true") items = items.filter((p) => p.negotiable);
  if (params.q) {
    const q = params.q.toLowerCase();
    items = items.filter((p) => `${p.title} ${p.description}`.toLowerCase().includes(q));
  }
  if (params.sort === "price_asc") items.sort((a, b) => a.price - b.price);
  if (params.sort === "price_desc") items.sort((a, b) => b.price - a.price);
  return { items, nextCursor: null };
}

export function sampleProduct(locale: Locale, slug: string): ProductDetail | null {
  const products = all(locale);
  const product = products.find((p) => p.slug === slug);
  if (!product) return null;
  const similar = products.filter(
    (p) => p.slug !== slug && p.status === "active" && p.category?.slug === product.category?.slug,
  );
  return { ...product, similar };
}
