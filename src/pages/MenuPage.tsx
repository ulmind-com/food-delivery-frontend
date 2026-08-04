import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, LayoutGrid, Flame } from "lucide-react";
import { menuApi } from "@/api/axios";
import ProductCard from "@/components/ProductCard";
import PageHero from "@/components/PageHero";
import { SkeletonCard } from "@/components/Skeletons";
import { useRestaurantStore } from "@/store/useRestaurantStore";
import { resolveImageURL } from "@/lib/image-utils";

type SortKey = "recommended" | "price-asc" | "price-desc" | "discount" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "discount", label: "Biggest discount" },
  { key: "name", label: "A – Z" },
];

const priceOf = (p: any) => Number(p.price || p.variants?.[0]?.price || 0);

const MenuPage = () => {
  const [params, setParams] = useSearchParams();
  const restaurant = useRestaurantStore((s) => s.restaurant);

  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [dietFilter, setDietFilter] = useState<"all" | "Veg" | "Non-Veg">("all");
  const [sort, setSort] = useState<SortKey>("recommended");
  const [dealsOnly, setDealsOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Keep the URL in step with the search box so the page is shareable
  useEffect(() => {
    const next = new URLSearchParams(params);
    search ? next.set("q", search) : next.delete("q");
    category ? next.set("category", category) : next.delete("category");
    setParams(next, { replace: true });
  }, [search, category]);

  // React to nav-bar searches that change the query string underneath us
  useEffect(() => {
    const q = params.get("q") || "";
    setSearch((cur) => (cur === q ? cur : q));
  }, [params.get("q")]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => menuApi.getCategories().then((r) => r.data),
  });

  const { data: allItems, isLoading } = useQuery({
    queryKey: ["menu", "all"],
    queryFn: () => menuApi.getMenu().then((r) => r.data),
  });

  const items = useMemo(() => {
    let list: any[] = [...(allItems || [])];

    if (category) {
      list = list.filter((p) => {
        const id = typeof p.category === "object" ? p.category?._id : p.category;
        return id === category;
      });
    }
    if (dietFilter !== "all") list = list.filter((p) => p.type === dietFilter);
    if (dealsOnly) list = list.filter((p) => p.hasDiscount);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (typeof p.category === "object" ? p.category?.name : "")
            ?.toLowerCase()
            .includes(q)
      );
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case "price-desc":
        list.sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case "discount":
        list.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
        break;
      case "name":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    return list;
  }, [allItems, category, dietFilter, dealsOnly, search, sort]);

  const withCategory = (item: any) => {
    if (typeof item.category === "string" && categories) {
      const found = categories.find((c: any) => c._id === item.category);
      if (found) return { ...item, category: found };
    }
    return item;
  };

  const activeFilters =
    (category ? 1 : 0) + (dietFilter !== "all" ? 1 : 0) + (dealsOnly ? 1 : 0);

  const clearAll = () => {
    setCategory("");
    setDietFilter("all");
    setDealsOnly(false);
    setSearch("");
  };

  const heroImage = allItems?.[0]
    ? resolveImageURL(allItems[0].imageURL || allItems[0].image)
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        eyebrow="Menu"
        image={heroImage}
        title={
          <>
            The full menu at{" "}
            <span className="text-gradient-primary">
              {restaurant?.name || "our kitchen"}
            </span>
          </>
        }
        subtitle={`${allItems?.length || 0} dishes, every one of them added and priced from the kitchen dashboard. Filter, sort and order in a couple of taps.`}
      >
        <div className="liquid-glass-dark flex max-w-xl items-center gap-3 rounded-2xl px-4 py-3">
          <Search className="h-[18px] w-[18px] flex-shrink-0 text-white/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes, categories, ingredients…"
            className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-white/45"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              <X className="h-4 w-4 text-white/60 transition-colors hover:text-white" />
            </button>
          )}
        </div>
      </PageHero>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="sticky top-[68px] z-30 border-b border-border/60 bg-background/85 backdrop-blur-2xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 py-3">
            {/* Category pills */}
            <div className="-mx-1 flex flex-1 gap-2 overflow-x-auto px-1 no-scrollbar">
              <FilterPill active={!category} onClick={() => setCategory("")}>
                <LayoutGrid className="h-3.5 w-3.5" /> All
              </FilterPill>
              {(categories || []).map((c: any) => (
                <FilterPill
                  key={c._id}
                  active={category === c._id}
                  onClick={() => setCategory(category === c._id ? "" : c._id)}
                >
                  {c.imageURL && (
                    <img
                      src={resolveImageURL(c.imageURL)}
                      alt=""
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  {c.name}
                </FilterPill>
              ))}
            </div>

            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="relative flex flex-shrink-0 items-center gap-1.5 rounded-full border border-border/70 px-3.5 py-2 text-[13px] font-bold transition-colors hover:bg-accent"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/60 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      Diet
                    </span>
                    {(["all", "Veg", "Non-Veg"] as const).map((d) => (
                      <FilterPill
                        key={d}
                        active={dietFilter === d}
                        onClick={() => setDietFilter(d)}
                      >
                        {d === "all" ? "Everything" : d}
                      </FilterPill>
                    ))}
                  </div>

                  <FilterPill active={dealsOnly} onClick={() => setDealsOnly((v) => !v)}>
                    <Flame className="h-3.5 w-3.5" /> On offer
                  </FilterPill>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                      Sort
                    </span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-[13px] font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeFilters > 0 && (
                    <button
                      onClick={clearAll}
                      className="ml-auto flex items-center gap-1 text-[13px] font-bold text-primary hover:underline"
                    >
                      <X className="h-3.5 w-3.5" /> Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">
            {isLoading
              ? "Loading the menu…"
              : `${items.length} ${items.length === 1 ? "dish" : "dishes"}`}
            {category && categories && (
              <>
                {" "}
                in{" "}
                <span className="text-foreground">
                  {categories.find((c: any) => c._id === category)?.name}
                </span>
              </>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl">🍽️</p>
            <h3 className="font-display mt-4 text-xl font-extrabold text-foreground">
              Nothing matches that
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different category or clear the filters.
            </p>
            <button
              onClick={clearAll}
              className="mt-5 rounded-full bg-gradient-to-b from-primary to-orange-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-glow-primary transition-transform hover:scale-105"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ProductCard key={item._id} item={withCategory(item)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

function FilterPill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-bold transition-all ${
        active
          ? "border-transparent bg-gradient-to-b from-primary to-orange-600 text-white shadow-glow-primary"
          : "border-border/70 bg-card text-foreground hover:border-primary/40 hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

export default MenuPage;
