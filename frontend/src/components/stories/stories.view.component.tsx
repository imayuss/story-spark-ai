import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { useCreatePostMutation } from "../../redux/apis/post.api";
import AudioPlayer, {
  type AudioPlayerHandle,
  type NarrationPlaybackState,
} from "../AudioPlayer";
import ImageFallback from "../ImageFallback";
import ReaderPreferencesPanel from "../reader-preferences/ReaderPreferences";
import { useReaderPreferences } from "../reader-preferences/useReaderPreferences";
import StoryCoverImage from "./StoryCoverImage";
import StoryWorldMap from "../story-map/StoryWorldMap";
import { topicsData } from "./stories.utils";

export interface IStories {
  uuid: string;
  title: string;
  content: string;
  tag: string;
  imageURL: string;
  language?: string;
  enhancedPrompt?: string;
}

interface StoriesViewComponentProps {
  stories: IStories[];
  isLogin: boolean;
  setStories: React.Dispatch<React.SetStateAction<IStories[]>>;
  onPublishSuccess?: () => void;
  isLoading?: boolean;
}

type StorySentenceSegment = {
  id: string;
  text: string;
  startWordIndex: number;
  endWordIndex: number;
};

const splitStoryIntoSegments = (content: string): StorySentenceSegment[] => {
  let wordIndex = 0;

  return content
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .map((sentence, index) => {
      const wordCount = sentence.trim().split(/\s+/).filter(Boolean).length;
      const startWordIndex = wordIndex;
      const endWordIndex = Math.max(startWordIndex, wordIndex + wordCount - 1);
      wordIndex += wordCount;

      return {
        id: `${index}-${startWordIndex}`,
        text: `${sentence.trim()} `,
        startWordIndex,
        endWordIndex,
      };
    });
};

const getPublishTopics = () =>
  topicsData
    .filter((topic) => topic.selected)
    .slice(0, 2)
    .map((topic) => ({
      title: topic.title,
      color: topic.color,
      selected: topic.selected,
    }));

const StoriesViewComponent: React.FC<StoriesViewComponentProps> = ({
  stories,
  isLogin,
  onPublishSuccess,
  isLoading = false,
}) => {
  const [selectedStory, setSelectedStory] = useState<IStories | null>(
    stories[0] ?? null
  );
  const [isCopied, setIsCopied] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [createPost, { isLoading: isPublishing }] = useCreatePostMutation();
  const [narrationWordIndex, setNarrationWordIndex] = useState(-1);
  const [narrationState, setNarrationState] =
    useState<NarrationPlaybackState>("idle");
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const readerPreferences = useReaderPreferences();

  useEffect(() => {
    setSelectedStory((current) => {
      if (!stories.length) {
        return null;
      }

      return stories.find((story) => story.uuid === current?.uuid) ?? stories[0];
    });
  }, [stories]);

  const sentenceSegments = useMemo(
    () => splitStoryIntoSegments(selectedStory?.content ?? ""),
    [selectedStory?.content]
  );

  const isNarrationActive =
    narrationState === "playing" || narrationState === "paused";

  const handleStorySelection = (story: IStories) => {
    setSelectedStory(story);
    setNarrationWordIndex(-1);
    audioPlayerRef.current?.stop();
  };

  const handleCopyStory = async () => {
    if (!selectedStory) {
      return;
    }

    await navigator.clipboard.writeText(selectedStory.content);
    setIsCopied(true);
    toast.success("Story copied.");
    window.setTimeout(() => setIsCopied(false), 1800);
  };

  const handleExportPDF = () => {
    if (!selectedStory) {
      return;
    }

    const doc = new jsPDF();
    const margin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const lines = doc.splitTextToSize(
      selectedStory.content,
      pageWidth - margin * 2
    );

    doc.setFontSize(16);
    doc.text(selectedStory.title, margin, 18);
    doc.setFontSize(11);
    doc.text(lines, margin, 30);
    doc.save(`${selectedStory.title || "story"}.pdf`);
  };

  const handleExportMarkdown = () => {
    if (!selectedStory) {
      return;
    }

    const markdown = `# ${selectedStory.title}\n\n${selectedStory.content}`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedStory.title || "story"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishStory = async () => {
    if (!selectedStory) {
      return;
    }

    if (!isLogin) {
      toast.error("Please login to publish your story.");
      return;
    }

    try {
      await createPost({
        title: selectedStory.title,
        content: selectedStory.content,
        tag: selectedStory.tag,
        imageURL:
          selectedStory.imageURL ||
          "https://images.unsplash.com/photo-1516979187457-637abb4f9353",
        topic: getPublishTopics(),
        language: selectedStory.language,
      }).unwrap();

      toast.success("Story published.");
      onPublishSuccess?.();
    } catch {
      toast.error("Unable to publish story. Please try again.");
    }
  };

  if (isLoading) {
    return null;
  }

  if (!selectedStory) {
    return (
      <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Generated stories will appear here.
      </div>
    );
  }

  return (
    <section className="mx-auto mt-10 max-w-7xl px-4 pb-16">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedStory.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-700/50 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {selectedStory.tag}
                </span>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-700/50 dark:bg-sky-950/60 dark:text-sky-300">
                  {selectedStory.language || "English"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {stories.map((story, index) => (
                <button
                  key={story.uuid}
                  type="button"
                  onClick={() => handleStorySelection(story)}
                  className={`h-12 w-12 overflow-hidden rounded-full border-2 transition-transform hover:scale-105 ${
                    selectedStory.uuid === story.uuid
                      ? "border-indigo-500"
                      : "border-white/80 dark:border-slate-700"
                  }`}
                  aria-label={`Select story variation ${index + 1}`}
                >
                  <ImageFallback
                    src={story.imageURL}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/75">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Generated Story
              </h3>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={handleCopyStory}
                >
                  {isCopied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
                  onClick={handleExportPDF}
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  onClick={handleExportMarkdown}
                >
                  Export Markdown
                </button>
                <button
                  type="button"
                  className="rounded-md bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                  onClick={() => setShowWorldMap(true)}
                >
                  World Map
                </button>
                <button
                  type="button"
                  id="publish-story-btn"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handlePublishStory}
                  disabled={isPublishing}
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>

            {selectedStory.enhancedPrompt && (
              <div className="mb-5 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-700/50 dark:bg-indigo-950/40 dark:text-indigo-200">
                <span className="font-semibold">AI Enhanced Prompt: </span>
                {selectedStory.enhancedPrompt}
              </div>
            )}

            <div
              id="story-content"
              className={`mx-auto whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300 ${readerPreferences.readerClassName}`}
            >
              <p>
                {sentenceSegments.length > 0
                  ? sentenceSegments.map((segment) => {
                      const isActiveSentence =
                        isNarrationActive &&
                        narrationWordIndex >= segment.startWordIndex &&
                        narrationWordIndex <= segment.endWordIndex;

                      return (
                        <span
                          key={segment.id}
                          className={
                            isActiveSentence
                              ? "rounded bg-indigo-500/20 px-0.5 text-indigo-700 dark:text-indigo-200"
                              : undefined
                          }
                        >
                          {segment.text}
                        </span>
                      );
                    })
                  : selectedStory.content}
              </p>
            </div>

            <div className="mt-6">
              <AudioPlayer
                ref={audioPlayerRef}
                text={selectedStory.content}
                title={selectedStory.title}
                onWordIndexChange={setNarrationWordIndex}
                onPlaybackStateChange={setNarrationState}
              />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <ReaderPreferencesPanel {...readerPreferences} />
          <StoryCoverImage
            title={selectedStory.title}
            tag={selectedStory.tag}
            className="h-64 rounded-lg border border-slate-200 shadow-sm dark:border-slate-700"
          />
        </aside>
      </div>

      {showWorldMap && (
        <StoryWorldMap
          story={selectedStory.content}
          title={selectedStory.title}
          onClose={() => setShowWorldMap(false)}
        />
      )}
    </section>
  );
};

export default StoriesViewComponent;
