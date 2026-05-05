import { ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trustLine?: ReactNode;
};

// Dark-navy hero block matching /destinations and /methodology. Use the
// `accent` helper for italic violet-300 emphasis inside title.
export default function BrandHero({ eyebrow, title, subtitle, trustLine }: Props) {
  return (
    <section className="relative bg-[#0E1119] text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-28 sm:pt-36 pb-16 sm:pb-20">
        <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/85 mb-8 font-semibold">{eyebrow}</p>
        <h1 className="font-display font-bold text-[2.25rem] leading-[1.08] sm:text-5xl md:text-[3.75rem] tracking-tight max-w-3xl mb-7">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl text-white/65 leading-relaxed max-w-2xl">{subtitle}</p>
        )}
        {trustLine && (
          <div className="border-t border-white/8 mt-12 pt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-white/55">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              <span>{trustLine}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export const accent = (text: string) => (
  <span className="italic font-medium text-violet-300">{text}</span>
);
