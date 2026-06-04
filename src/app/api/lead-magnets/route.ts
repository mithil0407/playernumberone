import { NextRequest, NextResponse } from "next/server";
import { attributionToColumns } from "@/lib/attribution";
import { computeLeadMagnetResult, getLeadMagnetById, LeadMagnetId } from "@/lib/leadMagnets";
import { saveStyleScanLead } from "@/lib/supabaseStyleScan";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tool = getLeadMagnetById(String(body.toolId || ""));

    if (!tool) {
      return NextResponse.json({ success: false, error: "Unknown toolId" }, { status: 400 });
    }

    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    const firstName = String(body.firstName || "").trim();
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const computed = computeLeadMagnetResult(tool.id as LeadMagnetId, answers);
    const suppliedResult = body.result && typeof body.result === "object" ? body.result : {};
    const result = {
      ...computed,
      ...suppliedResult,
      payload: {
        ...computed.payload,
        ...(typeof suppliedResult.payload === "object" && suppliedResult.payload ? suppliedResult.payload : {}),
      },
    };

    const attribution = attributionToColumns(body.attribution);
    const lead = await saveStyleScanLead({
      email,
      first_name: firstName,
      style_struggle: result.gap,
      colour_direction: tool.pillar.includes("Chromatic") ? result.label : undefined,
      silhouette_direction: tool.pillar.includes("Geometric") ? result.label : undefined,
      whats_missing: result.gap,
      source: body.source || "lead_magnet",
      tool_id: tool.id,
      tool_version: body.toolVersion || tool.version,
      result_key: result.key,
      result_label: result.label,
      result_summary: result.summary,
      result_payload: {
        toolTitle: tool.title,
        answers,
        result,
      },
      share_payload: {
        title: result.shareTitle,
        subtitle: result.shareSubtitle,
        slug: tool.slug,
      },
      diagnosis_answers: answers,
      ...attribution,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Lead magnet API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
