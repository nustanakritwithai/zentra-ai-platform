import type { StorefrontLayout } from "@shared/schema";

export const STOREFRONT_TEMPLATES: StorefrontLayout[] = [
  // ============= Template 1: Modern Tech Dark =============
  {
    templateId: "modern-tech-dark",
    theme: {
      primaryColor: "#14B8A6",
      accentColor: "#06B6D4",
      fontFamily: "Inter",
      borderRadius: "lg",
    },
    sections: [
      {
        id: "nav-1",
        type: "navbar",
        visible: true,
        props: { showAiBadge: true },
      },
      {
        id: "hero-1",
        type: "hero",
        visible: true,
        props: {
          slides: [
            {
              title: "สินค้าแนะนำสัปดาห์นี้:",
              subtitle: "{storeName} Nova Tech Collection | ช้อปเลย",
              imageUrl: "",
              ctaText: "Shop Now",
              ctaLink: "#products",
            },
            {
              title: "ดีลสุดคุ้ม",
              subtitle: "ลดสูงสุด 50% สินค้าคัดสรร",
              imageUrl: "",
              ctaText: "ดูสินค้าลดราคา",
              ctaLink: "#products",
            },
            {
              title: "ส่งฟรีทั่วไทย",
              subtitle: "สั่งซื้อขั้นต่ำ ฿1,000 ส่งฟรีทันที",
              imageUrl: "",
              ctaText: "ช้อปเลย",
              ctaLink: "#products",
            },
          ],
          autoPlay: true,
          interval: 5000,
        },
      },
      {
        id: "ai-status-1",
        type: "aiStatus",
        visible: true,
        props: { title: "Multi-Agent AI Status" },
      },
      {
        id: "cat-1",
        type: "categories",
        visible: true,
        props: { displayMode: "pills" },
      },
      {
        id: "prod-1",
        type: "productGrid",
        visible: true,
        props: {
          title: "สินค้าแนะนำ",
          columns: 2,
          source: "all",
          maxItems: 8,
          showRating: true,
          showBadge: true,
        },
      },
      {
        id: "featured-1",
        type: "featuredCollection",
        visible: true,
        props: {
          title: "คอลเลกชั่นแนะนำ",
          source: "newest",
          maxItems: 6,
        },
      },
      {
        id: "promo-1",
        type: "promoBanner",
        visible: true,
        props: {
          title: "โปรโมชั่นพิเศษ",
          subtitle: "รับส่วนลดสูงสุด 40% สำหรับสมาชิกใหม่",
          ctaText: "รับสิทธิ์เลย",
          gradient: "from-teal-600 via-cyan-600 to-blue-600",
        },
      },
      {
        id: "benefit-1",
        type: "benefitBar",
        visible: true,
        props: {
          items: [
            { icon: "truck", title: "จัดส่งฟรี", description: "สั่งขั้นต่ำ ฿1,000" },
            { icon: "shield", title: "รับประกัน 1 ปี", description: "คืนสินค้าได้ 30 วัน" },
            { icon: "headphones", title: "ซัพพอร์ต AI 24/7", description: "ช่วยเหลือตลอดเวลา" },
          ],
        },
      },
      {
        id: "reviews-1",
        type: "trustReviews",
        visible: true,
        props: {
          title: "รีวิวจากลูกค้า",
          reviews: [
            { name: "คุณสมชาย", rating: 5, text: "สินค้าดีมาก จัดส่งเร็ว ประทับใจมากครับ!", avatar: "ส" },
            { name: "คุณวิภา", rating: 5, text: "AI แนะนำสินค้าตรงใจมาก ชอบมากค่ะ", avatar: "ว" },
            { name: "คุณธนา", rating: 4, text: "ระบบใช้งานง่าย สะดวกมาก แนะนำเลย", avatar: "ธ" },
          ],
        },
      },
      {
        id: "footer-1",
        type: "footer",
        visible: true,
        props: {
          showSocial: true,
          showLinks: true,
          links: [
            { label: "ติดต่อเรา", href: "#contact" },
            { label: "นโยบายความเป็นส่วนตัว", href: "#privacy" },
            { label: "นโยบายคืนสินค้า", href: "#returns" },
            { label: "FAQ", href: "#faq" },
          ],
          socialLinks: { facebook: "#", instagram: "#", youtube: "#", line: "#" },
        },
      },
    ],
  },

  // ============= Template 2: Clean Light =============
  {
    templateId: "clean-light",
    theme: {
      primaryColor: "#0D9488",
      accentColor: "#14B8A6",
      fontFamily: "Inter",
      borderRadius: "lg",
    },
    sections: [
      {
        id: "nav-1",
        type: "navbar",
        visible: true,
        props: { showAiBadge: false },
      },
      {
        id: "hero-1",
        type: "hero",
        visible: true,
        props: {
          slides: [
            {
              title: "WELCOME TO",
              subtitle: "{storeName}",
              imageUrl: "",
              ctaText: "ช้อปเลย",
              ctaLink: "#products",
            },
          ],
          autoPlay: false,
          interval: 5000,
        },
      },
      {
        id: "ai-status-1",
        type: "aiStatus",
        visible: false,
        props: { title: "Multi-Agent AI Status" },
      },
      {
        id: "cat-1",
        type: "categories",
        visible: true,
        props: { displayMode: "pills" },
      },
      {
        id: "prod-1",
        type: "productGrid",
        visible: true,
        props: {
          title: "สินค้าทั้งหมด",
          columns: 2,
          source: "all",
          maxItems: 12,
          showRating: false,
          showBadge: false,
        },
      },
      {
        id: "benefit-1",
        type: "benefitBar",
        visible: true,
        props: {
          items: [
            { icon: "truck", title: "จัดส่งฟรี", description: "ทุกออเดอร์" },
            { icon: "shield", title: "ปลอดภัย", description: "ชำระเงินมั่นใจ" },
            { icon: "clock", title: "ส่งเร็ว", description: "ภายใน 1-3 วัน" },
          ],
        },
      },
      {
        id: "footer-1",
        type: "footer",
        visible: true,
        props: {
          showSocial: true,
          showLinks: true,
          links: [
            { label: "ติดต่อเรา", href: "#contact" },
            { label: "นโยบายความเป็นส่วนตัว", href: "#privacy" },
          ],
          socialLinks: { facebook: "#", instagram: "#" },
        },
      },
    ],
  },

  // ============= Template 3: Elegant Commerce =============
  {
    templateId: "elegant-commerce",
    theme: {
      primaryColor: "#D4A574",
      accentColor: "#C084FC",
      fontFamily: "Inter",
      borderRadius: "xl",
    },
    sections: [
      {
        id: "nav-1",
        type: "navbar",
        visible: true,
        props: { showAiBadge: true },
      },
      {
        id: "hero-1",
        type: "hero",
        visible: true,
        props: {
          slides: [
            {
              title: "LUXURY COLLECTION",
              subtitle: "Discover {storeName} Exclusive Items",
              imageUrl: "",
              ctaText: "Explore",
              ctaLink: "#products",
            },
            {
              title: "NEW SEASON",
              subtitle: "Premium Selection Curated for You",
              imageUrl: "",
              ctaText: "Shop Now",
              ctaLink: "#products",
            },
          ],
          autoPlay: true,
          interval: 6000,
        },
      },
      {
        id: "ai-status-1",
        type: "aiStatus",
        visible: true,
        props: { title: "AI Concierge Status" },
      },
      {
        id: "featured-1",
        type: "featuredCollection",
        visible: true,
        props: {
          title: "Curated by AI",
          source: "newest",
          maxItems: 6,
        },
      },
      {
        id: "cat-1",
        type: "categories",
        visible: true,
        props: { displayMode: "pills" },
      },
      {
        id: "prod-1",
        type: "productGrid",
        visible: true,
        props: {
          title: "All Products",
          columns: 2,
          source: "all",
          maxItems: 8,
          showRating: true,
          showBadge: true,
        },
      },
      {
        id: "promo-1",
        type: "promoBanner",
        visible: true,
        props: {
          title: "Exclusive Member Benefits",
          subtitle: "Join now for early access and special pricing",
          ctaText: "Join Now",
          gradient: "from-amber-700 via-yellow-600 to-amber-700",
        },
      },
      {
        id: "benefit-1",
        type: "benefitBar",
        visible: true,
        props: {
          items: [
            { icon: "award", title: "Premium Quality", description: "Handpicked items" },
            { icon: "truck", title: "Express Delivery", description: "Next-day available" },
            { icon: "heart", title: "VIP Service", description: "Personal stylist AI" },
          ],
        },
      },
      {
        id: "reviews-1",
        type: "trustReviews",
        visible: true,
        props: {
          title: "What Our Clients Say",
          reviews: [
            { name: "Alexandra K.", rating: 5, text: "Exceptional quality and the AI recommendations are spot-on!", avatar: "A" },
            { name: "Michael R.", rating: 5, text: "The shopping experience is truly premium. Love the AI concierge.", avatar: "M" },
            { name: "Sarah L.", rating: 5, text: "Beautiful products, fast shipping, and amazing customer service.", avatar: "S" },
          ],
        },
      },
      {
        id: "footer-1",
        type: "footer",
        visible: true,
        props: {
          showSocial: true,
          showLinks: true,
          links: [
            { label: "About Us", href: "#about" },
            { label: "Contact", href: "#contact" },
            { label: "Privacy Policy", href: "#privacy" },
            { label: "Returns", href: "#returns" },
          ],
          socialLinks: { facebook: "#", instagram: "#", youtube: "#" },
        },
      },
    ],
  },
];

export function getDefaultTemplate(): StorefrontLayout {
  return JSON.parse(JSON.stringify(STOREFRONT_TEMPLATES[0]));
}
