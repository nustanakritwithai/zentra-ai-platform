import type { StorefrontLayout } from "@shared/schema";

export const STOREFRONT_TEMPLATES: StorefrontLayout[] = [
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
        id: "hero-1",
        type: "hero",
        visible: true,
        props: {
          slides: [
            {
              title: "NEW ARRIVALS:",
              subtitle: "{storeName} Nova Tech Collection",
              imageUrl: "",
              ctaText: "Shop Now",
              ctaLink: "#products",
            },
            {
              title: "HOT DEALS",
              subtitle: "Up to 50% Off Selected Items",
              imageUrl: "",
              ctaText: "View Deals",
              ctaLink: "#products",
            },
            {
              title: "FREE SHIPPING",
              subtitle: "On Orders Over ฿1,000",
              imageUrl: "",
              ctaText: "Shop Now",
              ctaLink: "#products",
            },
          ],
          autoPlay: true,
          interval: 5000,
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
          title: "สินค้าแนะนำ",
          columns: 2,
          source: "all",
          maxItems: 8,
          showRating: true,
          showBadge: true,
        },
      },
      {
        id: "ai-rec-1",
        type: "aiRecommendation",
        visible: false,
        props: {
          title: "แนะนำสำหรับคุณ",
          source: "newest",
          maxItems: 6,
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
        id: "footer-1",
        type: "footer",
        visible: true,
        props: {
          showSocial: true,
          showLinks: true,
          links: [
            { label: "ติดต่อเรา", href: "#contact" },
            { label: "นโยบายความเป็นส่วนตัว", href: "#privacy" },
            { label: "นโยบายคาดเปลี่ยนสินค้า", href: "#returns" },
            { label: "FAQ", href: "#faq" },
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
