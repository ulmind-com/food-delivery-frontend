interface DishMarqueeProps {
  /** Category names pulled from the menu — the strip mirrors what the kitchen actually serves. */
  items: string[];
}

const Sparkle = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden>
    <path
      fill="currentColor"
      d="M12 0l2.2 7.6L22 9.8l-7.8 2.2L12 20l-2.2-8L2 9.8l7.8-2.2L12 0z"
    />
  </svg>
);

/**
 * The maroon ticker between the hero and the story section.
 * The track renders the list twice and slides exactly half its width, so the
 * loop is seamless no matter how many categories the admin has created.
 */
const DishMarquee = ({ items }: DishMarqueeProps) => {
  if (items.length === 0) return null;

  // Keep the strip full even for a short menu
  const base = items.length < 5 ? [...items, ...items, ...items].slice(0, 8) : items;
  const track = [...base, ...base];

  return (
    <div className="relative overflow-hidden bg-band py-3.5">
      {/* Soft edges so words fade rather than clip */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-band to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-band to-transparent" />

      <div className="flex w-max animate-marquee items-center gap-8 motion-reduce:animate-none sm:gap-12">
        {track.map((label, i) => (
          <div key={`${label}-${i}`} className="flex flex-shrink-0 items-center gap-8 sm:gap-12">
            <span className="whitespace-nowrap font-serif text-[15px] font-medium italic tracking-wide text-band-foreground sm:text-[17px]">
              {label}
            </span>
            <Sparkle />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DishMarquee;
