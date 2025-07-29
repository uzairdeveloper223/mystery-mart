import { Suspense } from "react"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedBoxes } from "@/components/home/featured-boxes"
import { CategoriesSection } from "@/components/home/categories-section"
import { StatsSection } from "@/components/home/stats-section"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <Suspense fallback={<LoadingSpinner />}>
          <FeaturedBoxes />
        </Suspense>
        <CategoriesSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}
