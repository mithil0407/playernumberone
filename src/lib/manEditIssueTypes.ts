// Shape of a monthly ICONIK Man Edit issue. Client-safe (no server imports) so
// the public Edit viewer and the admin review page can share it.
//
// The outfits themselves live in report_data.sections.s4_outfits in exactly the
// Blueprint's "OUTFIT N — CONTEXT" block format, so the Blueprint's image,
// shopping, regenerate and swap tooling all read an Edit unchanged. This
// object only carries what a Blueprint doesn't have.

export const MAN_EDIT_ISSUE_VERSION = 'man_edit_v1' as const;

export const MAN_EDIT_OUTFITS_PER_ISSUE = 6;

export interface ManEditIssueOutfitMeta {
  /** Matches the OUTFIT N header in s4_outfits. */
  number: number;
  /** The moment this outfit is for, in the client's words, e.g. "Diwali dinner at home". */
  occasion: string;
  /** Which Blueprint pieces this look re-wears, or '' when it's all new. */
  reuses: string;
}

export interface ManEditPieceOfTheMonth {
  name: string;
  why: string;
  /** Outfit numbers in this issue that use the piece. */
  outfitNumbers: number[];
}

export interface ManEditIssueContent {
  issueNumber: number;
  /** e.g. "October 2026" */
  periodLabel: string;
  /** ISO date in the month this issue dresses him for; climate rules are judged against it. */
  periodStart: string;
  /** '' when we don't know it — the intake never asks, and email handles are a poor guess. */
  clientFirstName: string;
  title: string;
  /** One line under the title. */
  dek: string;
  /** The stylist's letter for the month — 2 short paragraphs, separated by a blank line. */
  stylistNote: string;
  /** Short chips for what's happening this month, e.g. ["Navratri", "Post-monsoon heat"]. */
  monthMoments: string[];
  outfits: ManEditIssueOutfitMeta[];
  pieceOfTheMonth: ManEditPieceOfTheMonth;
  closingNote: string;
  /** Blueprint share token, for "back to your Blueprint" links. */
  blueprintShareToken: string | null;
  /** Shown once, on the first issue a client receives after a delay. */
  welcomeNote?: string;
  /** Iconik board looks (library ids) this issue was built from; later issues skip them. */
  boardSourceIds?: number[];
}
