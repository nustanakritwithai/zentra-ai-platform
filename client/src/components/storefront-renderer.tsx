import type { StorefrontLayout } from "@shared/schema";
import {
  NavBlock,
  HeroBlock,
  AiStatusBlock,
  CategoryStripBlock,
  ProductGridBlock,
  PromoBannerBlock,
  BenefitBarBlock,
  TrustReviewsBlock,
  FeaturedCollectionBlock,
  FooterBlock,
} from "./storefront-blocks";

const BLOCK_MAP: Record<string, React.ComponentType<any>> = {
  navbar: NavBlock,
  storeName: NavBlock,
  hero: HeroBlock,
  aiStatus: AiStatusBlock,
  categories: CategoryStripBlock,
  productGrid: ProductGridBlock,
  promoBanner: PromoBannerBlock,
  benefitBar: BenefitBarBlock,
  trustReviews: TrustReviewsBlock,
  featuredCollection: FeaturedCollectionBlock,
  aiRecommendation: FeaturedCollectionBlock,
  footer: FooterBlock,
};

interface StorefrontRendererProps {
  layout: StorefrontLayout;
  store: any;
  products: any[];
  categories: any[];
  currency: string;
  addToCart: (product: any) => void;
}

export function StorefrontRenderer({
  layout,
  store,
  products,
  categories,
  currency,
  addToCart,
}: StorefrontRendererProps) {
  return (
    <>
      {layout.sections
        .filter((section) => section.visible)
        .map((section) => {
          const Block = BLOCK_MAP[section.type];
          if (!Block) return null;
          return (
            <Block
              key={section.id}
              store={store}
              currency={currency}
              products={products}
              categories={categories}
              addToCart={addToCart}
              sectionProps={section.props}
            />
          );
        })}
    </>
  );
}
