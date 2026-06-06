import { serve } from "inngest/next";
import {
  inngest,
  handlePostScheduled,
  handleAiGeneration,
  handleAccountExpiring,
  handleAutoReplyCheck,
} from "@/lib/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    handlePostScheduled,
    handleAiGeneration,
    handleAccountExpiring,
    handleAutoReplyCheck,
  ],
});
