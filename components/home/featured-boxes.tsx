"use client"

import { motion } from "framer-motion"
import { useMysteryBoxes } from "@/hooks/use-mystery-boxes"
import { MysteryBoxCard } from "@/components/boxes/mystery-box-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function FeaturedBoxes() {
  const { boxes, loading, error } = useMysteryBoxes({
    status: "active",
    featured: true,
    limit: 6,
  })

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 gradient-text">Featured Mystery Boxes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our handpicked selection of the most exciting mystery boxes from verified sellers
            </p>
          </motion.div>
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4 gradient-text">Featured Mystery Boxes</h2>
            <p className="text-red-500">Error loading boxes: {error}</p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 gradient-text">Featured Mystery Boxes</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover our handpicked selection of the most exciting mystery boxes from verified sellers
          </p>
        </motion.div>

        {boxes.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {boxes.slice(0, 6).map((box, index) => (
              <motion.div
                key={box.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  ease: "easeOut",
                }}
                whileHover={{ y: -5 }}
                className="hover-lift"
              >
                <MysteryBoxCard box={box} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No featured boxes available at the moment.</p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
