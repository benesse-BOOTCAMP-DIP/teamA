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
    <div  className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-3">
        <p className="bg-stone-50 rounded-xl p-5 border border-stone-100">{japaneseStory}</p>
        <div className="bg-stone-50 rounded-xl p-5 mt-3 border border-stone-100">{words.map((word) => (
            <p key={word.meaningId}>
                {word.english} / {word.japanese}
            </p>
            ))}
        </div>
    </div>
  );
}
