import React from "react";
import toast from "react-hot-toast";

export interface IStories {
  uuid: string;
  title: string;
  content: string;
  tag?: string;
  genre?: string;
  imageURL?: string;
}

interface StoriesViewProps {
  stories: IStories[];
  isLogin: boolean;
  setStories: React.Dispatch<React.SetStateAction<IStories[]>>;
  onPublishSuccess: () => void;
  isLoading: boolean;
}

const StoriesViewComponent: React.FC<StoriesViewProps> = ({
  stories,
  isLogin,
  setStories,
  onPublishSuccess,
  isLoading,
}) => {
  const handleCopy = async (story: IStories) => {
    try {
      await navigator.clipboard.writeText(`${story.title}\n\n${story.content}`);
      toast.success("Story copied to clipboard.");
    } catch {
      toast.error("Unable to copy story. Please try again.");
    }
  };

  const handleRemove = (uuid: string) => {
    setStories((previous) => previous.filter((story) => story.uuid !== uuid));
  };

  const handleClearAll = () => {
    setStories([]);
    toast("All generated stories cleared.");
  };

  const handlePublishClick = () => {
    onPublishSuccess();
    if (stories.length > 0) {
      setStories([]);
    }
    toast.success(isLogin ? "Story published successfully." : "Story draft cleared.");
  };

  if (isLoading && stories.length === 0) {
    return (
      <div className="mx-auto max-w-6xl py-16 text-center text-slate-400">
        <p className="text-lg font-medium">Generating your story. Please wait...</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Story workspace</p>
          <h2 className="text-3xl font-bold text-slate-100">Generated Stories</h2>
          <p className="mt-2 text-sm text-slate-400">
            {stories.length > 0
              ? `${stories.length} story ${stories.length === 1 ? "result" : "results"} available.`
              : "Generate a story above and it will appear here."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={stories.length === 0}
            className="rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={stories.length === 0 || isLoading}
            className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLogin ? "Publish stories" : "Finalize story"}
          </button>
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-3xl border border-slate-700/60 bg-slate-950/60 p-12 text-center text-slate-400 shadow-xl shadow-slate-950/20">
          <p className="text-lg font-semibold text-slate-100">No generated stories yet.</p>
          <p className="mt-3 text-sm leading-relaxed">
            Use the story generator above to create your first draft. Your generated stories will appear here for preview, copy, or publishing.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.uuid}
              className="overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20"
            >
              {story.imageURL ? (
                <img
                  src={story.imageURL}
                  alt={story.title}
                  className="mb-5 h-44 w-full rounded-3xl object-cover"
                />
              ) : null}
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                  {story.tag || story.genre || "Story"}
                </span>
                <span className="text-xs text-slate-500">Draft</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100">{story.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-300 line-clamp-6">
                {story.content}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(story)}
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(story.uuid)}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default StoriesViewComponent;
