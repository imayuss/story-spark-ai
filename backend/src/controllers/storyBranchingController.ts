import { Request, Response } from "express";
import { generateStory } from "../services/ai.service";
import sendResponse from "../shared/send_response";
import { storyQueue } from "../services/storyRequestQueue";
import {
  safeParseAIResponse,
  StoryBranchingResponseSchema,
  type StoryBranchingResponse,
} from "../app/modules/ai";

const DEFAULT_CHOICES = [
  "Explore the surroundings",
  "Search for another way",
  "Wait and see what happens",
];

const buildFallback = (rawText: string): StoryBranchingResponse => ({
  storySegment: rawText?.trim() || "The story continues into the unknown...",
  choices: [...DEFAULT_CHOICES],
});

export const StoryBranchingController = {
  createBranchingStory: async (req: Request, res: Response) => {
    try {
      const { storyContext, selectedChoice, genre } = req.body;

      // Calculate segmentIndex based on the number of selection steps in storyContext
      const segmentIndex = (storyContext.match(/\[Player chose:/g) || []).length + 1;

      // Build prompt to request JSON structure
      const prompt = `
You are an interactive fiction writer. Generate the next segment of a branching story.
Genre: ${genre || "general"}
Story so far: ${storyContext || "This is the start of the story."}
${selectedChoice ? `The player chose: "${selectedChoice}"` : "This is the introduction/first scene of the story."}

Task:
1. Continue the story based on the player's choice or write the introduction scene if it is the start.
2. Provide exactly three distinct and engaging choices for what the player can do next.
3. Output the response ONLY as a valid JSON object in the following format (no markdown blocks, no prefix/suffix text, just the raw JSON):
{
  "storySegment": "The next segment of the story...",
  "choices": [
    "Choice 1 description",
    "Choice 2 description",
    "Choice 3 description"
  ]
}
`;

      const result = await storyQueue.enqueue(() => generateStory(prompt));

      const parsed = safeParseAIResponse(
        result.story,
        StoryBranchingResponseSchema,
        buildFallback(result.story),
        { label: "story branching" }
      );

      // Normalize choices to exactly 3
      let choices: string[];
      if (!parsed.choices || parsed.choices.length === 0) {
        choices = [...DEFAULT_CHOICES];
      } else if (parsed.choices.length < 3) {
        choices = [...parsed.choices];
        while (choices.length < 3) {
          choices.push(`Option ${choices.length + 1}`);
        }
      } else if (parsed.choices.length > 3) {
        choices = parsed.choices.slice(0, 3);
      } else {
        choices = parsed.choices;
      }

      sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Story generated successfully",
        data: {
          storySegment: parsed.storySegment,
          choices,
          segmentIndex,
        },
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : String(error);

      console.error("[StoryBranching] generation error:", detail);

      sendResponse(res, {
        success: false,
        statusCode: 503,
        message:
          "Story generation is temporarily unavailable. Please try again later.",
        data: null,
      });
    }
  },
};
