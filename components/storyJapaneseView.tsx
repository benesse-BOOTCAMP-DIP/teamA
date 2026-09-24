"use client";

type Words = {
  meaningId: number; 
  english: string; 
  japanese: string; 
  surfaces: string[];
};

type Props = { 
  japaneseStory: string;
  words: Words[]; 
};

export default function StoryJapaneseViews({ japaneseStory, words }: Props) {
  return (
    <div className="sunset-glass-card rounded-3xl p-6 border border-[#e79f4d]/30 mb-6 shadow-xl">
      <h3 className="text-sm font-bold text-[#e79f4d] mb-3 flex items-center gap-2">
        <span>🇯🇵</span> 日本語対訳
      </h3>
      <p className="bg-[#0f0f28]/75 rounded-2xl p-5 border border-[#3c3876]/80 text-sm leading-relaxed text-[#f5e6ab] whitespace-pre-wrap font-sans">
        {japaneseStory}
      </p>
      
      {words.length > 0 && (
        <div className="bg-[#0f0f28]/60 rounded-2xl p-4 mt-4 border border-[#3c3876]/60 flex flex-wrap gap-2">
          {words.map((word) => (
            <span key={word.meaningId} className="inline-flex items-center px-3 py-1 rounded-xl text-xs bg-[#5f448a]/40 border border-[#e79f4d]/30 text-[#f5e6ab]">
              <span className="font-bold text-[#e79f4d] mr-1.5">{word.english}</span>: {word.japanese}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

