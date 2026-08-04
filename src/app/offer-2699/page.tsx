import LandingPageContent from '../LandingPageContent';

export default function Offer2699Page() {
  return (
    <LandingPageContent
      variant="offer2699"
      headline={
        <>
          Discover Your Signature Style
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">20 personalised outfits</span>, your ideal <span className="font-semibold text-luxury-green">colour palette</span>, and expert guidance designed around your body, lifestyle and preferences.
        </>
      }
      checkoutHref="/offer-2699/checkout"
      basePrice={2699}
    />
  );
}
