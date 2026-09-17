import StylistBlueprintCoverLoader from '@/components/StylistBlueprintCoverLoader';

/**
 * Shown while the report loads, drawn as the report's own cover so the real
 * cover replaces it in place.
 */
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Opening your Blueprint">
      <StylistBlueprintCoverLoader />
    </main>
  );
}
