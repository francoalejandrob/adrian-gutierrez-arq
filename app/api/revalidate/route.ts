import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { websiteContentTag } from "@/lib/website-content";

export async function POST(request: NextRequest) {
  const secret = process.env.WEBSITE_REVALIDATE_SECRET;
  const organizationId = process.env.ARCHIOS_ORGANIZATION_ID;
  const authorization = request.headers.get("authorization");

  if (!secret || !organizationId || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag(websiteContentTag(organizationId), "max");
  return NextResponse.json({ revalidated: true });
}
