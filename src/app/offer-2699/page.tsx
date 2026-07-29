import LandingPageContent from '../LandingPageContent';

export default function Offer2699Page() {
  return (
    <LandingPageContent
      variant="offer2699"
      headline={
        <>
          Stop Guessing What to Wear.
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">20 personalised outfits</span>, your <span className="font-semibold text-luxury-green">colour palette</span> and a <span className="font-semibold text-luxury-accent">30-minute video consultation</span>.
        </>
      }
      checkoutHref="/offer-2699/checkout"
      basePrice={2699}
    />
  );
}
