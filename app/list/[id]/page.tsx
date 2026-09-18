"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { StoryDetailResponse } from "@/app/api/mocks/stories/[id]/route";
import styles from "./page.module.css";
import StoryJapaneseViews from "@/components/storyJapaneseView";

export default function StoryDetailPages() {
  const params = useParams();
  const id = params.id;

  const [story, setStory] = useState<StoryDetailResponse|null>(null);
  const [isJapaneseVisible, setIsJapaneseVisible] = useState(false);
  
  useEffect(() => {
    async function getData() {
      const response = await fetch(`/api/mocks/stories/${id}`);

      if (!response.ok) {
        alert("データの取得に失敗しました");
        return;
      }

      const data: StoryDetailResponse = await response.json();

      setStory(data);
    }

    getData();
  }, [id]);

  return (
    <div className="container">
      <h1>物語詳細画面</h1>

      {story && (
        <>
          <h2>{story.title}</h2>
          <p>{story.story}</p>
          <button onClick={() => setIsJapaneseVisible(!isJapaneseVisible)} >
             {isJapaneseVisible ? "和訳を閉じる　▲" : "和訳を見る　▼"} 
          </button> {isJapaneseVisible && ( 
            <div>
              {/* <p>{story.japaneseStory}</p>
              <div  className={styles.keywords}>{story.words.map((word) => (
                <p key={word.meaningId}>
                  {word.english} / {word.japanese},
                </p>
              ))}
              </div> */}
              <StoryJapaneseViews japaneseStory={story.japaneseStory} words={story.words}/>
            </div> 
          )}
        </>
      )}
    </div>
  );
}