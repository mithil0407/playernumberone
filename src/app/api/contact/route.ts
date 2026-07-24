import { NextRequest, NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

const ALLOWED_SUBJECTS = new Set([
  "general",
  "payment",
  "refund",
  "scheduling",
  "program",
  "technical",
]);

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    if (cleanString(payload.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const name = cleanString(payload.name, 120);
    const email = cleanString(payload.email, 254).toLowerCase();
    const subject = cleanString(payload.subject, 40);
    const message = cleanString(payload.message, 5000);
    const orderNumber = cleanString(payload.orderNumber, 120);

    if (
      name.length < 2 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !ALLOWED_SUBJECTS.has(subject) ||
      message.length < 10
    ) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 },
      );
    }

    const result = await sendContactMessage({
      name,
      email,
      subject,
      message,
      orderNumber,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Message delivery failed." },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid contact request." },
      { status: 400 },
    );
  }
}
