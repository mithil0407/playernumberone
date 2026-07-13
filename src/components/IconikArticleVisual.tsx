import Image from "next/image";

type CalloutPosition = "top" | "middle" | "bottom";

export type VisualCallout = {
  label: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition: string;
  position: CalloutPosition;
};

export type PaletteSwatch = {
  name: string;
  value: string;
  note?: string;
};

type SharedVisualProps = {
  title?: string;
  subtitle?: string;
  disclosure?: string;
  priority?: boolean;
};

type ComparisonVisualProps = SharedVisualProps & {
  variant?: "comparison";
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  beforeCallouts?: VisualCallout[];
  afterCallouts?: VisualCallout[];
};

type PaletteVisualProps = SharedVisualProps & {
  variant: "palette";
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  paletteLabel: string;
  swatches: PaletteSwatch[];
};

type EditorialVisualProps = SharedVisualProps & {
  variant: "editorial";
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  labels?: string[];
};

export type IconikArticleVisualProps =
  | ComparisonVisualProps
  | PaletteVisualProps
  | EditorialVisualProps;

const DEFAULT_DISCLOSURE =
  "AI-generated editorial visual informed by Iconik's styling methodology. No real client or celebrity is depicted.";

const positionClass: Record<CalloutPosition, string> = {
  top: "top-[31%]",
  middle: "top-[53%]",
  bottom: "top-[73%]",
};

function VisualHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="absolute inset-x-0 top-[4.5%] z-20 text-center text-white">
      <p className="font-serif text-3xl tracking-[0.28em] md:text-6xl">ICONIK</p>
      <p className="mt-2 text-[0.52rem] font-medium uppercase tracking-[0.38em] text-white/72 md:mt-3 md:text-[0.68rem]">
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-[75%] text-[0.55rem] uppercase tracking-[0.2em] text-white/48 md:text-[0.65rem]">
        {subtitle}
      </p>
    </div>
  );
}

function Callout({ callout, side }: { callout: VisualCallout; side: "left" | "right" }) {
  return (
    <div
      className={`absolute ${positionClass[callout.position]} hidden w-[17%] -translate-y-1/2 md:block ${
        side === "left" ? "left-[2.5%]" : "right-[2.5%]"
      }`}
    >
      <div className="relative aspect-square overflow-hidden rounded-[1.15rem] border border-white/75 bg-white/12 shadow-[0_16px_45px_rgba(38,52,58,0.18)] backdrop-blur-xl">
        <Image
          src={callout.imageSrc}
          alt={callout.imageAlt}
          fill
          sizes="180px"
          className="scale-[2.15] object-cover"
          style={{ objectPosition: callout.objectPosition }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-[1.15rem] ring-1 ring-inset ring-white/35" />
      </div>
      <p className="mt-2 text-center text-[0.58rem] font-medium uppercase tracking-[0.2em] text-white/85 lg:text-[0.68rem]">
        {callout.label}
      </p>
      <span
        aria-hidden="true"
        className={`absolute top-1/2 h-px w-[52%] bg-white/70 ${side === "left" ? "left-full" : "right-full"}`}
      />
      <span
        aria-hidden="true"
        className={`absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-white bg-[#8fa2aa] ${
          side === "left" ? "left-[148%]" : "right-[148%]"
        }`}
      />
    </div>
  );
}

function ComparisonVisual(props: ComparisonVisualProps) {
  const beforeCallouts = props.beforeCallouts ?? [];
  const afterCallouts = props.afterCallouts ?? [];
  return (
    <div className="relative isolate mx-auto aspect-[4/5] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_42%,#aebdc3_0%,#8fa2aa_48%,#748891_100%)] shadow-[0_28px_80px_rgba(38,52,58,0.24)]">
      <VisualHeader title={props.title ?? "Fashion Intelligence"} subtitle={props.subtitle ?? "Visual diagnosis"} />

      <div className="absolute left-[22%] top-[17%] z-20 -translate-x-1/2 text-[0.62rem] font-medium uppercase tracking-[0.3em] text-white/80 md:text-xs">
        {props.beforeLabel}
      </div>
      <div className="absolute right-[22%] top-[17%] z-20 translate-x-1/2 text-[0.62rem] font-medium uppercase tracking-[0.3em] text-white/80 md:text-xs">
        {props.afterLabel}
      </div>

      <div className="absolute bottom-[8%] left-[18%] h-[66%] w-[31%]">
        <Image src={props.beforeSrc} alt={props.beforeAlt} fill sizes="(max-width: 768px) 43vw, 330px" className="object-contain object-bottom" priority={props.priority} />
      </div>
      <div className="absolute bottom-[8%] right-[18%] h-[66%] w-[31%]">
        <Image src={props.afterSrc} alt={props.afterAlt} fill sizes="(max-width: 768px) 43vw, 330px" className="object-contain object-bottom" priority={props.priority} />
      </div>

      {beforeCallouts.map((callout) => <Callout key={`before-${callout.label}`} callout={callout} side="left" />)}
      {afterCallouts.map((callout) => <Callout key={`after-${callout.label}`} callout={callout} side="right" />)}

      <div className="absolute inset-x-[5%] bottom-[2.5%] grid grid-cols-2 gap-3 md:hidden">
        {[...beforeCallouts, ...afterCallouts].slice(0, 4).map((callout) => (
          <div key={`mobile-${callout.label}`} className="rounded-xl border border-white/45 bg-white/12 px-3 py-2 text-center text-[0.55rem] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-xl">
            {callout.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaletteVisual(props: PaletteVisualProps) {
  return (
    <div className="relative isolate mx-auto aspect-[4/5] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_35%_35%,#aebdc3_0%,#8fa2aa_50%,#748891_100%)] shadow-[0_28px_80px_rgba(38,52,58,0.24)]">
      <VisualHeader title={props.title ?? "Chromatic Intelligence"} subtitle={props.subtitle ?? props.paletteLabel} />
      <div className="absolute bottom-0 left-0 h-[78%] w-[62%]">
        <Image src={props.imageSrc} alt={props.imageAlt} fill sizes="(max-width: 768px) 70vw, 620px" className="object-cover object-bottom" style={{ objectPosition: props.imagePosition ?? "50% 50%" }} priority={props.priority} />
      </div>
      <div className="absolute bottom-[7%] right-[5%] top-[24%] flex w-[36%] flex-col justify-center rounded-[1.5rem] border border-white/30 bg-white/10 p-[4%] text-white backdrop-blur-xl">
        <p className="text-[0.55rem] font-medium uppercase tracking-[0.26em] text-white/65 md:text-[0.7rem]">{props.paletteLabel}</p>
        <div className="mt-[8%] space-y-[5%]">
          {props.swatches.slice(0, 6).map((swatch) => (
            <div key={`${swatch.name}-${swatch.value}`} className="grid grid-cols-[22%_1fr] items-center gap-[7%]">
              <span className="aspect-square rounded-full border border-white/45 shadow-sm" style={{ backgroundColor: swatch.value }} />
              <span>
                <span className="block text-[0.58rem] font-medium uppercase tracking-[0.16em] md:text-[0.72rem]">{swatch.name}</span>
                {swatch.note && <span className="mt-1 hidden text-[0.58rem] leading-relaxed text-white/55 md:block">{swatch.note}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditorialVisual(props: EditorialVisualProps) {
  return (
    <div className="relative isolate mx-auto aspect-[4/5] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[#8fa2aa] shadow-[0_28px_80px_rgba(38,52,58,0.24)]">
      <Image src={props.imageSrc} alt={props.imageAlt} fill sizes="(max-width: 768px) 100vw, 1024px" className="object-cover" style={{ objectPosition: props.imagePosition ?? "50% 50%" }} priority={props.priority} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2c2622]/45 via-transparent to-[#2c2622]/55" />
      <VisualHeader title={props.title ?? "Style Intelligence"} subtitle={props.subtitle ?? "Iconik editorial"} />
      {props.labels && props.labels.length > 0 && (
        <div className="absolute inset-x-[5%] bottom-[4%] flex flex-wrap justify-center gap-2">
          {props.labels.map((label) => (
            <span key={label} className="rounded-full border border-white/35 bg-white/12 px-3 py-2 text-[0.55rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-xl md:px-5 md:text-[0.68rem]">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IconikArticleVisual(props: IconikArticleVisualProps) {
  const disclosure = props.disclosure ?? DEFAULT_DISCLOSURE;
  return (
    <figure className="my-12 md:my-16">
      {props.variant === "palette" ? (
        <PaletteVisual {...props} />
      ) : props.variant === "editorial" ? (
        <EditorialVisual {...props} />
      ) : (
        <ComparisonVisual {...props} />
      )}
      <figcaption className="mx-auto mt-3 max-w-5xl px-2 text-xs leading-relaxed text-[#2C2622]/50">
        {disclosure}
      </figcaption>
    </figure>
  );
}
