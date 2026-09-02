export const BRAND_NAME = "ICONIK";
export const LEGAL_ENTITY_NAME = "ICONIK LLP";
export const SITE_URL = "https://www.iconik.pro";

export const SUPPORT_EMAIL = "help.iconikfashion@gmail.com";
export const SUPPORT_WHATSAPP_E164 = "+919130048899";
export const SUPPORT_WHATSAPP_DISPLAY = "+91 91300 48899";
export const SUPPORT_WHATSAPP_URL = "https://wa.me/919130048899";

export const GOOGLE_BUSINESS_PROFILE_URL =
  "https://share.google/qUzuAdIMLWZ3hVaCa";
export const INSTAGRAM_URL = "https://www.instagram.com/iconik.style/";

export const FOUNDERS = [
  {
    name: "Jasmine Rana",
    title: "Co-Founder and Head Stylist",
    linkedIn: "https://www.linkedin.com/in/jasmine-rana-b7b435239/",
  },
] as const;

export const BLUEPRINT_OFFER = {
  name: "ICONIK Blueprint",
  currentPriceInr: 2699,
  referencePriceInr: 5999,
  outfitFormulas: 20,
  consultationMinutes: 30,
  deliveryWorkingDays: 5,
  weeklyClientCapacity: 15,
  checkoutPath: "/offer-2699/checkout",
  offerPath: "/offer-2699",
  revisionPromise:
    "Revisions are included until the Blueprint reflects the needs, goals, and preferences in the original consultation scope.",
  refundSummary:
    "Refunds are considered only in the specific cancellation cases described in the Refund & Cancellation Policy.",
} as const;

export const CLIENT_PROOF = {
  womenStyled: 4000,
  menStyled: 1000,
  totalClients: 5000,
  countriesServed: 10,
} as const;

export const BUSINESS_HOURS = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  opens: "11:00",
  closes: "17:00",
  timeZone: "Asia/Kolkata",
  display: "Monday to Friday, 11:00 AM–5:00 PM IST",
} as const;

export const ACTIVE_PUBLIC_MARKETS = ["IN", "Worldwide"] as const;
