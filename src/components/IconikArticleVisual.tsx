import Image from "next/image";

type CalloutPosition = "top" | "middle" | "bottom";

type VisualCallout = {
  label: string;
  imageSrc: string;
  imageAlt: string;
  objectPosition: string;
  position: CalloutPosition;
};

type IconikArticleVisualProps = {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  beforeCallouts: VisualCallout[];
  afterCallouts: VisualCallout[];
  title?: string;
  disclosure?: string;
};

const DEFAULT_DISCLOSURE =
  "AI-generated styling reconstruction informed by anonymized patterns observed across Iconik consultations. No real client or celebrity is depicted.";

const positionClass: Record<CalloutPosition, string> = {
  top: "top-[31%]",
  middle: "top-[53%]",
  bottom: "top-[73%]",
};

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

export default function IconikArticleVisual({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  beforeLabel,
  afterLabel,
  beforeCallouts,
  afterCallouts,
  title = "Fashion Intelligence",
  disclosure = DEFAULT_DISCLOSURE,
}: IconikArticleVisualProps) {
  return (
    <figure className="my-12">
      <div className="relative isolate mx-auto aspect-[4/5] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_42%,#aebdc3_0%,#8fa2aa_48%,#748891_100%)] shadow-[0_28px_80px_rgba(38,52,58,0.24)]">
        <div className="absolute inset-x-0 top-[5%] z-20 text-center text-white">
          <p className="font-serif text-4xl tracking-[0.28em] md:text-6xl">ICONIK</p>
          <p className="mt-3 text-[0.58rem] font-medium uppercase tracking-[0.42em] text-white/75 md:text-[0.7rem]">{title}</p>
        </div>

        <div className="absolute left-[22%] top-[17%] z-20 -translate-x-1/2 text-[0.62rem] font-medium uppercase tracking-[0.3em] text-white/80 md:text-xs">
          {beforeLabel}
        </div>
        <div className="absolute right-[22%] top-[17%] z-20 translate-x-1/2 text-[0.62rem] font-medium uppercase tracking-[0.3em] text-white/80 md:text-xs">
          {afterLabel}
        </div>

        <div className="absolute bottom-[8%] left-[18%] h-[66%] w-[31%]">
          <Image src={beforeSrc} alt={beforeAlt} fill sizes="(max-width: 768px) 43vw, 330px" className="object-contain object-bottom" />
        </div>
        <div className="absolute bottom-[8%] right-[18%] h-[66%] w-[31%]">
          <Image src={afterSrc} alt={afterAlt} fill sizes="(max-width: 768px) 43vw, 330px" className="object-contain object-bottom" />
        </div>

        {beforeCallouts.map((callout) => (
          <Callout key={`before-${callout.label}`} callout={callout} side="left" />
        ))}
        {afterCallouts.map((callout) => (
          <Callout key={`after-${callout.label}`} callout={callout} side="right" />
        ))}

        <div className="absolute inset-x-[5%] bottom-[2.5%] grid grid-cols-2 gap-3 md:hidden">
          {[...beforeCallouts, ...afterCallouts].slice(0, 4).map((callout) => (
            <div key={`mobile-${callout.label}`} className="rounded-xl border border-white/45 bg-white/12 px-3 py-2 text-center text-[0.55rem] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-xl">
              {callout.label}
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mx-auto mt-3 max-w-5xl px-2 text-xs leading-relaxed text-gray-500">{disclosure}</figcaption>
    </figure>
  );
}
