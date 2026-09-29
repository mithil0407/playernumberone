'use client';

// Visual proof blocks for the ₹2,699 offer pages, modelled on the way product
// pages show the thing being bought: a swipeable gallery of real deliverable
// pages, a price box that pictures the free guides, and client messages that
// can actually be read.
//
// The Blueprint slides are rendered mock-ups of sample report pages, laid out
// like the real women's Blueprint. The photos inside them are one illustrative
// model (not a client), made with the same prompts the report uses for its
// guide pages. Keep the "sample" note: these are not client results.

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { BLUEPRINT_OFFER, CLIENT_PROOF } from '@/lib/siteFacts';

const SAMPLE = '/offer-2699/sample';
const PROOF = '/offer-2699/proof';

export const FREE_CHANGES_PROMISE =
  'If your Blueprint does not match what you told your stylist, we change it for free.';

export const OFFER_GUIDE_IMAGES = [
  { title: 'Hairstyle guide', desc: '4 haircuts and styles for your face shape.', src: `${SAMPLE}/booklet-hairstyles.webp` },
  { title: 'Makeup guide', desc: 'Everyday makeup shades for your skin.', src: `${SAMPLE}/booklet-makeup.webp` },
  { title: 'Hair colour guide', desc: '4 hair colour ideas for your skin.', src: `${SAMPLE}/booklet-hair-colour.webp` },
  { title: 'Glasses guide', desc: 'Glasses and sunglasses for your face.', src: `${SAMPLE}/booklet-glasses.webp` },
] as const;

interface GallerySlide {
  src: string;
  alt: string;
  /** Short label for the thumbnail button; slides with their own headline skip the overlay. */
  label: string;
  tag?: string;
  fit?: 'cover' | 'contain';
  background?: string;
}

// Product slides first, the way a shop shows the box before the reviews; then
// the real before/after and a client message.
const GALLERY_SLIDES: GallerySlide[] = [
  { src: `${SAMPLE}/blueprint-hero.webp`, alt: 'Sample Personal Style Blueprint on a tablet and phone: 30-minute stylist call, 20 outfits, 4 free guides', label: 'Your Blueprint' },
  { src: `${SAMPLE}/blueprint-outfits.webp`, alt: 'Sample outfit pages: complete looks with clothes, shoes, bag, jewellery and why each suits you', label: 'Your 20 outfits' },
  { src: `${SAMPLE}/blueprint-colours.webp`, alt: 'Sample colour page: a colour to skip beside a colour that suits her, 10 colours to wear and 4 to skip', label: 'Your colours' },
  { src: `${SAMPLE}/blueprint-guides.webp`, alt: 'Four free guides: hairstyle, hair colour, glasses and everyday makeup', label: 'Free guides' },
  { src: '/transformation-1.webp', alt: 'Before and after styling', label: 'Before & after', tag: 'Before & after' },
  { src: `${PROOF}/photo-conference.webp`, alt: 'A client in her ICONIK outfit before a work conference, face hidden', label: 'Client photo', tag: 'Client photo · face hidden' },
  { src: '/transformation-2.webp', alt: 'Before and after styling', label: 'Before & after', tag: 'Before & after' },
];

export function BlueprintGallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + GALLERY_SLIDES.length) % GALLERY_SLIDES.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    setActive(next);
  };

  return (
    <div className="offer-gallery mx-auto w-full max-w-[420px]">
      <div className="relative">
        <div
          ref={trackRef}
          className="offer-gallery-track flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(event) => {
            const track = event.currentTarget;
            setActive(Math.round(track.scrollLeft / track.clientWidth));
          }}
          aria-roledescription="carousel"
          aria-label="What your Blueprint looks like"
        >
          {GALLERY_SLIDES.map((slide, index) => (
            <figure
              key={`${slide.src}-${index}`}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden"
              style={{ background: slide.background ?? '#EDE5D2' }}
              aria-label={`${index + 1} of ${GALLERY_SLIDES.length}: ${slide.label}`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 480px) 92vw, 420px"
                className={slide.fit === 'contain' ? 'object-contain' : 'object-cover'}
                priority={index === 0}
              />
              {slide.tag && <span className="offer-gallery-tag absolute left-3 top-3 z-10 rounded-full px-3 py-1.5">{slide.tag}</span>}
            </figure>
          ))}
        </div>
      </div>

      <div className="offer-gallery-thumbs mt-3 flex gap-2 overflow-x-auto pb-1">
        {GALLERY_SLIDES.map((slide, index) => (
          <button
            key={`thumb-${slide.src}-${index}`}
            type="button"
            onClick={() => goTo(index)}
            className={`relative h-14 w-14 shrink-0 overflow-hidden ${index === active ? 'is-active' : ''}`}
            style={{ background: slide.background ?? '#EDE5D2' }}
            aria-label={`Show ${slide.label}`}
            aria-current={index === active}
          >
            <Image src={slide.src} alt="" fill sizes="56px" className={slide.fit === 'contain' ? 'object-contain' : 'object-cover'} />
          </button>
        ))}
      </div>
      <p className="offer-gallery-fine mt-2">Sample Blueprint pages, shown on an illustrative model.</p>
    </div>
  );
}

interface OfferSummaryBoxProps {
  formattedBasePrice: string;
  checkoutHref: string;
  topicNote?: string;
  onCtaClick: () => void;
}

export function OfferSummaryBox({ formattedBasePrice, checkoutHref, topicNote, onCtaClick }: OfferSummaryBoxProps) {
  const includes = [
    `${BLUEPRINT_OFFER.consultationMinutes}-minute video call with your stylist`,
    `${BLUEPRINT_OFFER.outfitFormulas} complete outfits made for your body`,
    'Your colours: 10 to wear and 4 to skip',
    'Body shape and face guides',
    ...(topicNote ? [topicNote] : []),
  ];

  return (
    <div className="offer-box mx-auto max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="iconik-micro offer-box-eyebrow">What you get</div>
          <h2 className="iconik-display offer-box-title">ICONIK Personal Style Blueprint</h2>
        </div>
        <div className="shrink-0 text-right">
          <div className="iconik-display offer-box-price">{formattedBasePrice}</div>
          <div className="offer-box-per">One-time payment</div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {includes.map((item) => (
          <li key={item} className="offer-box-item flex items-start gap-2.5">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="offer-box-free mt-6">
        <div className="offer-box-free-head flex items-center justify-between">
          <span className="iconik-micro">Free with your Blueprint</span>
          <span className="offer-box-free-count">4 guides</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OFFER_GUIDE_IMAGES.map((guide) => (
            <div key={guide.title} className="offer-box-thumb relative aspect-square overflow-hidden">
              <Image src={guide.src} alt={`Free ${guide.title.toLowerCase()} booklet`} fill sizes="(max-width: 640px) 45vw, 120px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="offer-promise mt-5 flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p><strong>Free-changes promise.</strong> {FREE_CHANGES_PROMISE}</p>
      </div>

      <Link href={checkoutHref} onClick={onCtaClick} className="root-primary-action mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4">
        <span className="iconik-display">Get My Style Blueprint — {formattedBasePrice}</span>
        <ArrowRight className="h-4 w-4 opacity-70" />
      </Link>
      <p className="offer-box-fine mt-3 text-center">
        Pay by UPI or card · Ready {BLUEPRINT_OFFER.deliveryWorkingDays} working days after your call
      </p>
    </div>
  );
}

// Client WhatsApp messages, word for word from the screenshots in /public
// (text1–text4.webp). Photos are the clients' own, faces already blurred.
// `sleeveless` photos are hidden on the sleeves and modest pages, whose promise
// is that nobody is pushed into sleeveless.
interface ClientMessage {
  id: string;
  context: string;
  text: string;
  time: string;
  photo?: { src: string; width: number; height: number; sleeveless?: boolean };
}

const CLIENT_MESSAGES: ClientMessage[] = [
  {
    id: 'conference',
    context: 'After a work conference',
    text: 'I wanted to send a quick note to say a huge thank you!! 😁 I just got back from my conference and for the first time in a long time I felt completely confident and at ease in what I was wearing. The outfit and colour palette you chose was a huge success haha. I received several lovely compliments which was a wonderful boost. Thank you again for your incredible work.',
    time: '4:22 PM',
    photo: { src: `${PROOF}/photo-conference.webp`, width: 600, height: 708 },
  },
  {
    id: 'perfect',
    context: 'On receiving her Blueprint',
    text: 'Thank you so much! This is perfect! Really appreciate all the hard work you put in. Excited about refining my look 😃 So grateful for the timely advice. Wishing you and your team all the very best! Take care!',
    time: '6:42 AM',
  },
  {
    id: 'brunch',
    context: 'After a brunch date',
    text: 'Thank you so much for styling me the brunch date went so well and I honestly felt amazing… like legit the outfit was perfect I didn\'t feel overdressed or too casual and it made everything so much more relaxed and enjoyable 🙈',
    time: '4:16 PM',
    photo: { src: `${PROOF}/photo-brunch.webp`, width: 600, height: 807, sleeveless: true },
  },
  {
    id: 'effort',
    context: 'First look at her Blueprint',
    text: 'That\'s a lot of effort!! Going through it in detail… thanks a lot… at first glance it looks amazing 👌👌 will share more after I have gone through it in detail!! Awesome 🙌 thanks a lot',
    time: '10:19 PM',
  },
];

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
    </svg>
  );
}

function ClientMessageCard({ message, showPhoto }: { message: ClientMessage; showPhoto: boolean }) {
  return (
    <figure className="client-card shrink-0 snap-start">
      <figcaption className="client-card-head">
        <span className="client-card-source"><WhatsAppGlyph /> WhatsApp</span>
        <span className="client-card-context">{message.context}</span>
      </figcaption>
      <div className="client-card-chat">
        {showPhoto && message.photo && (
          <div className="client-card-photo">
            <Image src={message.photo.src} alt="Client's own photo in her outfit, face hidden" width={message.photo.width} height={message.photo.height} sizes="280px" className="block h-auto w-full" />
          </div>
        )}
        <blockquote className="client-card-bubble">
          <p>{message.text}</p>
          <span className="client-card-time">{message.time}</span>
        </blockquote>
      </div>
      <div className="client-card-foot">
        <span>ICONIK client · name hidden</span>
      </div>
    </figure>
  );
}

export function ClientMessagesStrip({ compact = false, hideSleevelessPhotos = false }: { compact?: boolean; hideSleevelessPhotos?: boolean }) {
  // Checkout keeps to words only so the Pay button stays close.
  const messages = compact ? CLIENT_MESSAGES.filter((message) => message.id !== 'brunch') : CLIENT_MESSAGES;
  return (
    <div className={compact ? 'client-messages client-messages--compact' : 'client-messages'}>
      <div className={compact ? 'mb-4' : 'mx-auto mb-8 max-w-2xl text-center'}>
        <div className="iconik-micro client-messages-eyebrow">{CLIENT_PROOF.womenStyled.toLocaleString('en-IN')}+ women styled</div>
        <h2 className="iconik-display client-messages-title">{compact ? 'What clients told us' : 'Messages from clients'}</h2>
        {!compact && <p className="client-messages-sub">Real WhatsApp messages, word for word. Names and faces hidden.</p>}
      </div>
      <div className="client-messages-track flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-2">
        {messages.map((message) => (
          <ClientMessageCard
            key={message.id}
            message={message}
            showPhoto={!compact && !(hideSleevelessPhotos && message.photo?.sleeveless)}
          />
        ))}
      </div>
    </div>
  );
}

/** One short quote for the desktop checkout's sticky package column. */
export function FeaturedClientMessage() {
  return <ClientMessageCard message={CLIENT_MESSAGES[1]} showPhoto={false} />;
}
