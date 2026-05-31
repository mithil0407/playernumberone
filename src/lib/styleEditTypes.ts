export type StyleEditIssueStatus =
  | 'pending_profile'
  | 'topic_ready'
  | 'generating'
  | 'draft_ready'
  | 'in_review'
  | 'approved'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'error'
  | 'skipped';

export interface StyleEditTopicPlan {
  title: string;
  theme: string;
  rationale: string;
  focusAreas: string[];
  avoidRepeats: string[];
}

export interface StyleEditOutfitFormula {
  title: string;
  occasion: string;
  formula: string;
  colourLogic: string;
  stylingNotes: string;
}

export interface StyleEditPageData {
  issueTitle: string;
  subtitle: string;
  weekLabel: string;
  clientName: string;
  theme: string;
  diagnosis: string;
  outfits: StyleEditOutfitFormula[];
  paletteNotes: string[];
  shoppingRules: string[];
  avoidThisWeek: string[];
  replyPrompt: string;
  generatedAt: string;
}

export interface StyleEditImagePaths {
  heroCard?: string | null;
  outfitCards?: (string | null)[];
  paletteCard?: string | null;
}

export type ResolvedStyleEditImageUrls = StyleEditImagePaths;

export interface StyleEditPersonalizationProfile {
  client: {
    name: string;
    email: string;
    phone?: string | null;
    country?: string | null;
  };
  styleProfile: {
    archetype?: string;
    moodboard?: string;
    signatureCodes: string[];
    antiCodes: string[];
    shoppingFilters: string[];
  };
  body: {
    geometry?: string;
    focusAreas: string[];
    silhouetteRules: string[];
    coverageRules: string[];
  };
  colour: {
    paletteName?: string;
    palette: Array<{ name: string; hex: string; usage?: string }>;
    avoidColours: string[];
  };
  lifestyle: Record<string, unknown>;
  photos: Record<string, unknown>;
  intakeSummary?: string;
  recentIssueTopics: string[];
}
