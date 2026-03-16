import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  type?: "website" | "product" | "article" | "store";
  image?: string;
  url?: string;
  price?: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock";
  brand?: string;
  category?: string;
  sku?: string;
  storeName?: string;
  storeSlug?: string;
  products?: Array<{
    name: string;
    price: number;
    image?: string;
    description?: string;
    sku?: string;
    category?: string;
    availability?: string;
  }>;
}

export function SEOHead({
  title = "Agentra — Commerce Operating System for Modern Merchants",
  description = "Agentra คือระบบปฏิบัติการสำหรับการขายออนไลน์ ที่รวม storefront, dashboard, AI automation และ payment infrastructure ไว้ในแพลตฟอร์มเดียว",
  type = "website",
  image,
  url,
  price,
  currency = "THB",
  availability = "InStock",
  brand,
  category,
  sku,
  storeName,
  storeSlug,
  products,
}: SEOProps) {
  useEffect(() => {
    // Update page title
    document.title = title;

    // Update meta tags
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", type === "product" ? "product" : "website", true);
    if (image) setMeta("og:image", image, true);
    if (url) setMeta("og:url", url, true);
    setMeta("og:site_name", "Agentra", true);
    setMeta("og:locale", "th_TH", true);

    // Twitter Card
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (image) setMeta("twitter:image", image);

    // Product-specific meta
    if (type === "product" && price) {
      setMeta("product:price:amount", price.toString(), true);
      setMeta("product:price:currency", currency, true);
      setMeta("product:availability", availability, true);
      if (brand) setMeta("product:brand", brand, true);
      if (category) setMeta("product:category", category, true);
    }

    // Remove old JSON-LD
    document.querySelectorAll('script[data-seo="agentra"]').forEach((el) => el.remove());

    // Build JSON-LD structured data
    const jsonLd: any[] = [];

    if (type === "website") {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Agentra",
        url: window.location.origin,
        description,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/#/mall?search={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        creator: {
          "@type": "SoftwareApplication",
          name: "Perplexity Computer",
          url: "https://www.perplexity.ai/computer",
        },
      });

      // Organization schema
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Agentra",
        url: window.location.origin,
        logo: `${window.location.origin}/icon-192.png`,
        description: "Commerce Operating System สำหรับเจ้าของร้านยุคใหม่ ที่รวม storefront, dashboard, AI agents และระบบรับเงินไว้ในแพลตฟอร์มเดียว",
        sameAs: [],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          availableLanguage: ["Thai", "English"],
        },
      });
    }

    if (type === "store" && storeName) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "Store",
        name: storeName,
        url: `${window.location.origin}/#/store/${storeSlug}`,
        description,
        currenciesAccepted: currency,
        paymentAccepted: "PromptPay, Credit Card, Bank Transfer",
        priceRange: "฿",
        brand: {
          "@type": "Brand",
          name: storeName,
        },
      });
    }

    if (type === "product" && price) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        description,
        ...(image && { image }),
        ...(sku && { sku }),
        ...(brand && {
          brand: { "@type": "Brand", name: brand },
        }),
        ...(category && { category }),
        offers: {
          "@type": "Offer",
          price,
          priceCurrency: currency,
          availability: `https://schema.org/${availability}`,
          seller: storeName
            ? { "@type": "Organization", name: storeName }
            : undefined,
        },
      });
    }

    // Product list schema for mall/storefront
    if (products && products.length > 0) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: storeName ? `สินค้าจาก ${storeName}` : "สินค้าทั้งหมดใน Agentra Mall",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 20).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: p.name,
            description: p.description || "",
            ...(p.image && { image: p.image }),
            ...(p.sku && { sku: p.sku }),
            ...(p.category && { category: p.category }),
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: currency,
              availability: `https://schema.org/${p.availability || "InStock"}`,
            },
          },
        })),
      });

      // CollectionPage for shopping search engines
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: storeName
          ? `${storeName} — ร้านค้าออนไลน์`
          : "Agentra Mall — ช้อปปิ้งออนไลน์",
        description,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
        },
      });
    }

    // BreadcrumbList
    if (storeSlug) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Agentra Mall", item: `${window.location.origin}/#/mall` },
          { "@type": "ListItem", position: 2, name: storeName || storeSlug, item: `${window.location.origin}/#/store/${storeSlug}` },
        ],
      });
    }

    // Inject JSON-LD
    for (const ld of jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo", "agentra");
      script.textContent = JSON.stringify(ld);
      document.head.appendChild(script);
    }

    return () => {
      document.querySelectorAll('script[data-seo="agentra"]').forEach((el) => el.remove());
    };
  }, [title, description, type, image, url, price, currency, availability, brand, category, sku, storeName, storeSlug, products]);

  return null;
}
