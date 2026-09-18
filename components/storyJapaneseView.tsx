"use client";

type Words={
    meaningId: number; 
    english: string; 
    japanese: string; 
    surfaces: string[];
}

type Props = { 
    japaneseStory: string;
    words:Words[]; 
};

export default function StoryJapaneseViews({japaneseStory,words}:Props) {
  
    
  return (
    <div>
        <p>{japaneseStory}</p>
        <div>{words.map((word) => (
            <p key={word.meaningId}>
                {word.english} / {word.japanese}
            </p>
            ))}
        </div>
    </div>
  );
}
