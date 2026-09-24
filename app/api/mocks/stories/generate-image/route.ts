import { NextResponse } from "next/server";

interface GenerateImageRequest {
  story?: string;
  title?: string;
}

export async function POST(request: Request) {
  const body: GenerateImageRequest = await request.json().catch(() => ({}));

  if (!body.story || body.story.trim() === "") {
    return NextResponse.json(
      { success: false, error: "物語の本文（story）を入力してください" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    image: {
      url: "/globe.svg",
    },
  });
}