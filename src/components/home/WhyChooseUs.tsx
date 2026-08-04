import { motion } from "framer-motion";
import { Soup, ChefHat, HandHeart, Armchair } from "lucide-react";
import { useRestaurantStore } from "@/store/useRestaurantStore";

const ITEMS = [
  { icon: Soup, title: "Authentic Taste", body: "Traditional recipes crafted to perfection" },
  { icon: ChefHat, title: "Experienced Chefs", body: "Passionate chefs with years of experience" },
  { icon: HandHeart, title: "Quality Service", body: "We serve with a smile and care" },
  { icon: Armchair, title: "Great Ambience", body: "Comfortable & cosy for all occasions" },
];

/** Four reasons, on cream, with outlined gold medallions. */
const WhyChooseUs = () => {
  const restaurant = useRestaurantStore((s) => s.restaurant);

  return (
    <section className="bg-surface-alt pb-20 pt-4 sm:pb-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex justify-center"
        >
          <span className="flex items-center gap-3 text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-primary">
            <span className="h-px w-8 bg-primary" />
            Why choose {restaurant?.name?.split(" ")[0] || "us"}?
            <span className="h-px w-8 bg-primary" />
          </span>
        </motion.div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="group flex flex-col items-center text-center"
            >
              <span className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full border border-primary/60 transition-all duration-300 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary/10">
                <item.icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
              </span>
              <h3 className="font-serif text-[20px] font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 max-w-[230px] font-body text-[14px] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
