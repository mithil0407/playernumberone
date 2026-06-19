import { hasPlaceholderOutfitValue, isPlaceholderOutfitValue } from './manOutfitPlaceholders';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runManOutfitPlaceholderAssertions() {
  invariant(isPlaceholderOutfitValue('Not specified by stylist'), 'detects stylist placeholder');
  invariant(isPlaceholderOutfitValue('Not specified by admin.'), 'detects admin placeholder');
  invariant(isPlaceholderOutfitValue('Not visible in reference'), 'detects reference placeholder');
  invariant(hasPlaceholderOutfitValue('Not specified by the stylist.'), 'detects placeholder sentence');
  invariant(!hasPlaceholderOutfitValue('Wear this to a client dinner - it signals polish without stiffness.'), 'keeps real rationale');
  invariant(!isPlaceholderOutfitValue('No layer'), 'does not treat valid no-layer garment field as placeholder');
}
