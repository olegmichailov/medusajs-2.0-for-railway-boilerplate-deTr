"use client"

import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"

// Новый ленивый импорт (если нужно добавить ещё компонентов позже)
const LazyProductInfo = ({ product }: { product: HttpTypes.StoreProduct }) => (
  <Suspense fallback={<div className="h-10">Loading product info...</div>}>
    <ProductInfo product={product} />
  </Suspense>
)

const LazyProductTabs = ({ product }: { product: HttpTypes.StoreProduct }) => (
  <Suspense fallback={<div className="h-10">Loading tabs...</div>}>
    <ProductTabs product={product} />
  </Suspense>
)

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container flex flex-col small:flex-row small:items-start py-6 relative"
        data-testid="product-container"
      >
        {/* Левая колонка — инфо */}
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-6">
          <LazyProductInfo product={product} />
          <LazyProductTabs product={product} />
        </div>

        {/* Галерея изображений с приоритетом на первые 2 изображения */}
        <div className="block w-full relative">
          <ImageGallery
            images={product?.images || []}
            preloadFirst
            preloadCount={2} // <= это важное изменение
          />
        </div>

        {/* Правая колонка — CTA и Add to Cart */}
        <div className="flex flex-col small:sticky small:top-48 small:py-0 small:max-w-[300px] w-full py-8 gap-y-12">
          <ProductOnboardingCta />
          <Suspense
            fallback={
              <ProductActions disabled={true} product={product} region={region} />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
        </div>
      </div>

      {/* Похожие товары */}
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
