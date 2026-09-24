import { NextResponse } from "next/server";

export interface StoryDetailWord {
  meaningId: number;
  english: string;
  japanese: string;
  surfaces: string[];
}

export interface StoryDetailResponse {
  storyId: number;
  title: string;
  story: string;
  japaneseStory: string;
  createdAt: string;
  words: StoryDetailWord[];
}

const stories: StoryDetailResponse[] = [
     { storyId: 1,
       title: "朝の公園ルーティン", 
       story: "Every morning, I ran to the park to enjoy the fresh air.", 
       japaneseStory: "毎朝、私は新鮮な空気を楽しむために公園へ走りました。", 
       createdAt: "2026-09-16T10:00:00Z", 
       words: [ 
        { 
            meaningId: 1, 
            english: "run", 
            japanese: "走る", 
            surfaces: ["ran"],
         }, 
         { 
            meaningId: 2, 
            english: "park", 
            japanese: "公園", 
            surfaces: ["park"],
         },
        ],
     }, 
     { 
        storyId: 2, 
        title: "週末のカフェ", 
        story: "Last weekend, I visited a small cafe and drank coffee.", 
        japaneseStory: "先週末、私は小さなカフェを訪れてコーヒーを飲みました。", 
        createdAt: "2026-09-17T10:00:00Z", 
        words: [ 
            { meaningId: 3, 
                english: "visit", 
                japanese: "訪れる", 
                surfaces: ["visited"],
             }, 
             { 
                meaningId: 4, 
                english: "drink", 
                japanese: "飲む", 
                surfaces: ["drank"], 
            }, 
        ], 
    }, 
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const storyId = Number(id);

  const story = stories.find((story) => story.storyId === storyId);

  if (!story) {
    return NextResponse.json(
      { message: "物語が見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json(story);
}