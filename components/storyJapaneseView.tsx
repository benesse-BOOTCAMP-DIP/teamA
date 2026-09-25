"use client";

import type { StoryDetailWord } from "@/app/api/stories/[id]/route";
import "./storyJapaneseView.css";

type Props = {
  japaneseStory: string;
  words: StoryDetailWord[];
};

export default function StoryJapaneseViews({
  japaneseStory,
  words,
}: Props) {
  return (
    <div className="japaneseView">
      <p className="japaneseStory">
        {japaneseStory}
      </p>

      <div className="wordList">
        {words.map((word) => (
          <p key={word.meaningId} className="wordItem">
            {word.english} / {word.japanese}
          </p>
        ))}
      </div>
    </div>
  );
}