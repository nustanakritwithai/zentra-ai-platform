import type { StorefrontLayout } from "@shared/schema";
import {
  HeroBlock,
  CategoryStripBlock,
  ProductGridBlock,
  BenefitBarBlock,
  FooterBlock,
  AiRecommendationBlock,
} from "./storefront-blocks";

const BLOCK_MAP: Record<string, React.ComponentType<any>> = {
  hero: HeroBlock,
  categories: CategoryStripBlock,
  productGrid: ProductGridBlock,
  benefitBar: BenefitBarBlock,
  footer: FooterBlock,
  aiRecommendation: AiRecommendationBlock,
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
