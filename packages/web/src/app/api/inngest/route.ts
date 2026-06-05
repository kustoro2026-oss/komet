import { serve } from "inngest/next";
import {
  inngest,
  handlePostScheduled,
  handleAiGeneration,
  handleAccountExpiring,
} from "@/lib/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [handlePostScheduled, handleAiGeneration, handleAccountExpiring],
});
