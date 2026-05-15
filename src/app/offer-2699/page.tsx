import LandingPageContent from '../LandingPageContent';

export default function Offer2699Page() {
  return (
    <LandingPageContent
      headline={
        <>
          Discover Your <span className="text-luxury-green">Signature Style</span> in <span className="text-luxury-charcoal">24 hours</span>
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">16 personalized outfits</span>, your <span className="font-semibold text-luxury-green">color palette</span>, and a <span className="font-semibold text-luxury-accent">1-on-1 stylist call</span>
        </>
      }
      checkoutHref="/offer-2699/checkout"
      basePrice={2699}
    />
  );
}
