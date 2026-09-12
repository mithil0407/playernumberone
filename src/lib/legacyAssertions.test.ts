import test from 'node:test';
import { runStylistManualNotesParserAssertions } from './stylistManualNotesParser.test.ts';
import { runManOutfitSectionAssertions } from './manOutfitSection.test.ts';
import { runManOutfitLibraryAssertions } from './manOutfitLibrary.test.ts';
import { runManReportQaAssertions } from './manReportQa.test.ts';
import { runManOutfitPlaceholderAssertions } from './manOutfitPlaceholders.test.ts';
import { runManOutfitEditAssertions } from './manOutfitEdit.test.ts';
import { runManReportV2Assertions } from '../components/ManReportV2.test.ts';

// These legacy files exported assertion functions without ever running them.
for (const assertions of [runStylistManualNotesParserAssertions, runManOutfitSectionAssertions,
  runManOutfitLibraryAssertions, runManReportQaAssertions, runManOutfitPlaceholderAssertions,
  runManOutfitEditAssertions, runManReportV2Assertions]) {
  test(assertions.name, assertions);
}
