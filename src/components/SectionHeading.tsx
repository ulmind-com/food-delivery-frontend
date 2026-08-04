import { motion } from "framer-motion";

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "center" | "left";
  action?: React.ReactNode;
}

/**
 * The one heading treatment used by every section on the site so the
 * rhythm stays identical from Home through Contact.
 */
const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action,
}: SectionHeadingProps) => {
  const centered = align === "center";

  return (
    <div
      className={`mb-8 flex gap-4 ${
        centered
          ? "flex-col items-center text-center"
          : "flex-col items-start sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={centered ? "flex flex-col items-center" : "min-w-0"}
      >
        {eyebrow && (
          <span className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-glow-pulse" />
            {eyebrow}
          </span>
        )}

        <h2 className="font-display text-[26px] font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-[34px]">
          {title}
        </h2>

        {centered && (
          <span className="mt-3 h-[3px] w-16 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
        )}

        {subtitle && (
          <p
            className={`mt-3 text-sm leading-relaxed text-muted-foreground ${
              centered ? "max-w-xl" : "max-w-2xl"
            }`}
          >
            {subtitle}
          </p>
        )}
      </motion.div>

      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeading;
