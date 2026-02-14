import { Mastra } from "@mastra/core";
import { investorAgent } from "./agents/investor-agent";
import { evaluatorAgent } from "./agents/evaluator-agent";

// Initialize Mastra with both agents
export const mastra = new Mastra({
  agents: {
    investorAgent,
    evaluatorAgent,
  },
});
