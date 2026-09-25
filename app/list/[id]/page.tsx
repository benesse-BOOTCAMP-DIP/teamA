"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { StoryDetailResponse } from "@/app/api/stories/[id]/route";
import styles from "./page.module.css";
import StoryJapaneseViews from "@/components/storyJapaneseView";
import DetailStoryEnglishView from "@/components/DetailStoryEnglishView";
import Loading from "@/components/Loading";
import Link from "next/link";


export default function StoryDetailPages() {
  const params = useParams();
  const id = params.id;

  const [story, setStory] = useState<StoryDetailResponse|null>(null);
  //和訳表示状態
  const [isJapaneseVisible, setIsJapaneseVisible] = useState(false);
  //ローディング
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function getData() {
      try{
        const response = await fetch(`/api/stories/${id}`);
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const data: StoryDetailResponse = await response.json();
        setStory(data);
    }catch(error){
      alert("データの取得に失敗しました");
    }finally{
      // ローディング終了
      setIsLoading(false);
    }
  }

    getData();
  }, [id]);

  return (
    <div className="container">
      {isLoading?(
        <Loading />       
      ):story?(
         <div>
          <Link href={`/list`}>
            <img className={styles.returnButton} src="/returnBlue.png" alt="戻るボタン" />
          </Link>
          <DetailStoryEnglishView title={story.title} imageUrl={story.imageUrl} story={story.story} words={story.words} />
          <div className={styles.boxCenter}>
             <button className={styles.japaneseToggle}  onClick={() => setIsJapaneseVisible(!isJapaneseVisible)} >
              {isJapaneseVisible ? "和訳を見る　▲" : "和訳を見る　▼"} 
            </button> 
          </div>
          {isJapaneseVisible && ( 
            <div>
              <StoryJapaneseViews japaneseStory={story.japaneseStory} words={story.words}/>
            </div> 
          )}
        </div>
      ):null}
    </div>
  );
}