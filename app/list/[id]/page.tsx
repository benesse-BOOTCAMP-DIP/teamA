"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { StoryDetailResponse } from "@/app/api/stories/[id]/route";
import styles from "./page.module.css";
import StoryJapaneseViews from "@/components/storyJapaneseView";
import DetailStoryEnglishView from "@/components/DetailStoryEnglishView";
import Link from "next/link";


export default function StoryDetailPages() {
  const params = useParams();
  const id = params.id;

  const [story, setStory] = useState<StoryDetailResponse|null>(null);
  const [isJapaneseVisible, setIsJapaneseVisible] = useState(false);
  
  useEffect(() => {
    async function getData() {
      const response = await fetch(`/api/stories/${id}`);

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
      <div className={styles.header}>
        <h1>物語詳細画面</h1>
        <Link href={`/list`}>
            <h3>一覧画面へ</h3>
        </Link>
      </div>
      
      {story && (
        <div>
          <DetailStoryEnglishView title={story.title} story={story.story} words={story.words} />
          <button onClick={() => setIsJapaneseVisible(!isJapaneseVisible)} >
             {isJapaneseVisible ? "和訳を閉じる　▲" : "和訳を見る　▼"} 
          </button> {isJapaneseVisible && ( 
            <div>
              <StoryJapaneseViews japaneseStory={story.japaneseStory} words={story.words}/>
            </div> 
          )}
        </div>
      )}
    </div>
  );
}