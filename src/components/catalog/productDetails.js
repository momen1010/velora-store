// src/components/catalog/productDetails.js
// بيانات إضافية لصفحة المنتج (وصف / مكونات / طريقة الاستخدام / تقييمات).
// ⚠️ بيانات تجريبية: استبدلها ببيانات منتجاتك الحقيقية (خصوصاً المكونات) أو بالـ API.
// المفتاح = product.id

const DETAILS = {
  1: { description: "أحمر شفاه كريمي بتشطيب مخملي مطفي يدوم لساعات دون جفاف. تركيبة خفيفة تمنح لوناً غنياً بتمريرة واحدة.", ingredients: "Dimethicone, Isododecane, Silica, Jojoba Seed Oil, Tocopheryl Acetate, Mica, CI 77891, CI 15850", howToUse: "ضعي اللون من منتصف الشفة نحو الأطراف ثم وزّعيه بالفرشاة للحصول على حواف دقيقة." },
  2: { description: "مرطب جل مائي ينعش البشرة ويمنحها ترطيباً يدوم طوال اليوم من دون ملمس دهني.", ingredients: "Aqua, Glycerin, Sodium Hyaluronate, Panthenol, Allantoin, Niacinamide, Aloe Barbadensis Leaf Juice", howToUse: "ضعي كمية بحجم حبة البازلاء على الوجه والرقبة صباحاً ومساءً بعد التنظيف والسيروم." },
  3: { description: "كريم أساس كوشن بتغطية متوسطة قابلة للبناء ولمسة نهائية ناعمة تجعل البشرة تبدو متجانسة وطبيعية.", ingredients: "Aqua, Cyclopentasiloxane, Titanium Dioxide, Glycerin, Niacinamide, Sodium Hyaluronate, Iron Oxides", howToUse: "اضغطي الإسفنجة على الكوشن ثم ربّتي على الوجه من المنتصف إلى الخارج. أعيدي الطبقة عند الحاجة." },
  4: { description: "سيروم بفيتامين سي لإشراقة واضحة وتقليل مظهر البقع الداكنة مع الاستخدام المنتظم.", ingredients: "Aqua, Ascorbyl Glucoside, Glycerin, Ferulic Acid, Tocopherol, Sodium Hyaluronate, Panthenol", howToUse: "ضعي 3 إلى 4 قطرات صباحاً على بشرة نظيفة، وتبعيه بالمرطب وواقي الشمس." },
  5: { description: "باليت أحمر خدود مزدوج بدرجات ناعمة تذوب على البشرة وتعطي نضارة طبيعية.", ingredients: "Talc, Mica, Magnesium Stearate, Caprylic/Capric Triglyceride, Silica, Iron Oxides", howToUse: "اخلطي الدرجتين بالفرشاة وضعيهما على أعلى الوجنتين بحركات دائرية خفيفة." },
  6: { description: "غسول رغوي لطيف ينظف البشرة من الشوائب والمكياج دون أن يسحب ترطيبها، مناسب للبشرة الحساسة.", ingredients: "Aqua, Coco-Glucoside, Glycerin, Panthenol, Allantoin, Chamomilla Recutita Flower Extract", howToUse: "دلّكي كمية صغيرة على وجه مبلل لمدة 30 ثانية ثم اشطفي بالماء الفاتر." },
  7: { description: "ماسكارا مقاومة للماء ترفع الرموش وتمنحها كثافة وطولاً دون تكتل.", ingredients: "Aqua, Cera Alba, Acrylates Copolymer, Carnauba Wax, Panthenol, Iron Oxides", howToUse: "ابدئي من جذور الرموش وحرّكي الفرشاة للأعلى بتعرّج خفيف. أضيفي طبقة ثانية للحصول على كثافة أكبر." },
  8: { description: "كريم غني بالسيراميد يدعم حاجز البشرة ويخفف الجفاف والاحمرار بتركيبة خالية من العطور.", ingredients: "Aqua, Ceramide NP, Ceramide AP, Cholesterol, Squalane, Glycerin, Shea Butter, Panthenol", howToUse: "ضعيه ليلاً على بشرة نظيفة أو في الصباح عند الحاجة، ويمكن استخدامه على مناطق الجفاف." },
  9: { description: "زيت شفاه لامع بملمس ناعم غير لاصق يرطب الشفاه ويمنحها لمعة زجاجية بلمسة لون خفيفة.", ingredients: "Hydrogenated Polyisobutene, Ricinus Communis Seed Oil, Squalane, Vitamin E, Mica", howToUse: "ضعيه وحده أو فوق أحمر الشفاه للمعان إضافي، وأعيدي التطبيق خلال اليوم." },
  10: { description: "ماسكا طين يمتص الزيوت الزائدة وينقّي المسام ويترك البشرة مرتاحة ومتوازنة.", ingredients: "Aqua, Kaolin, Bentonite, Glycerin, Zinc PCA, Salicylic Acid, Allantoin", howToUse: "ضعي طبقة رقيقة على الوجه وتجنبي محيط العينين، اتركيها 10 دقائق ثم اشطفيها. مرة إلى مرتين أسبوعياً." },
  11: { description: "باليت ظلال بتشطيب ساتان ناعم وبدرجات دافئة قابلة للمزج تناسب الإطلالة اليومية والمسائية.", ingredients: "Talc, Mica, Dimethicone, Magnesium Stearate, Caprylyl Glycol, Iron Oxides, CI 77891", howToUse: "ابدئي بدرجة أساسية على الجفن كله، ثم أضيفي الدرجة الداكنة عند الطية وامزجيها بفرشاة ناعمة." },
  12: { description: "واقي شمس خفيف SPF 50 بملمس مائي شفاف لا يترك أثراً أبيض ويناسب الاستخدام اليومي تحت المكياج.", ingredients: "Aqua, Homosalate, Butyl Methoxydibenzoylmethane, Octocrylene, Glycerin, Niacinamide, Tocopherol", howToUse: "ضعي كمية كافية على الوجه والرقبة قبل الخروج بـ 15 دقيقة، وأعيدي التطبيق كل ساعتين عند التعرض للشمس." },
};

const FALLBACK = {
  skincare: { description: "منتج عناية بالبشرة بتركيبة لطيفة تناسب الاستخدام اليومي.", ingredients: "سيتم إضافة قائمة المكونات قريباً.", howToUse: "ضعي كمية مناسبة على بشرة نظيفة ودلّكي بلطف حتى الامتصاص." },
  makeup: { description: "منتج مكياج بتركيبة مريحة ولون متجانس يدوم طويلاً.", ingredients: "سيتم إضافة قائمة المكونات قريباً.", howToUse: "طبّقي المنتج بالكمية المطلوبة ووزّعيه جيداً للحصول على النتيجة المطلوبة." },
};

// تقييمات تجريبية موحّدة (تُستبدل بتقييمات حقيقية من الـ API)
export const SAMPLE_REVIEWS = [
  { id: "r1", author: "نورهان م.", rating: 5, date: "منذ أسبوعين", text: "المنتج فاق توقعاتي، الجودة ممتازة والتوصيل كان سريعاً. سأشتريه مرة أخرى." },
  { id: "r2", author: "سارة أ.", rating: 4, date: "منذ شهر", text: "نتيجة جميلة وسعر مناسب. أتمنى لو كان هناك حجم أكبر." },
  { id: "r3", author: "هبة ع.", rating: 5, date: "منذ شهرين", text: "من أفضل ما جربت، خفيف ومريح على البشرة وأنصح به." },
];

export function getProductDetails(product) {
  return DETAILS[product.id] ?? FALLBACK[product.category] ?? FALLBACK.skincare;
}