import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  createKeywordResearchAgent, 
  type KeywordAnalysisResult, 
  formatKeywordResults 
} from "./keywordResearchAgent";
import { 
  createContentOptimizationAgent, 
  type ContentOptimizationResult, 
  formatContentResults 
} from "./contentOptimizationAgent";
import { 
  createTechnicalSeoAgent, 
  type TechnicalSeoResult, 
  formatTechnicalSeoResults 
} from "./technicalSeoAgent";

// Export types for use in components
export type { 
  KeywordAnalysisResult, 
  ContentOptimizationResult, 
  TechnicalSeoResult 
};

interface AgentServiceOptions {
  apiKey: string;
  modelName?: string;
}

export class AgentService {
  private model: ChatGoogleGenerativeAI;
  private keywordAgent: ReturnType<typeof createKeywordResearchAgent> | null = null;
  private contentAgent: ReturnType<typeof createContentOptimizationAgent> | null = null;
  private technicalSeoAgent: ReturnType<typeof createTechnicalSeoAgent> | null = null;
  
  constructor(options: AgentServiceOptions) {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: options.apiKey,
      modelName: options.modelName || "gemini-2.0-flash",
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    });
  }
  
  async initKeywordAgent() {
    if (!this.keywordAgent) {
      this.keywordAgent = await createKeywordResearchAgent(this.model);
    }
    return this.keywordAgent;
  }
  
  async initContentAgent() {
    if (!this.contentAgent) {
      this.contentAgent = await createContentOptimizationAgent(this.model);
    }
    return this.contentAgent;
  }
  
  async initTechnicalSeoAgent() {
    if (!this.technicalSeoAgent) {
      this.technicalSeoAgent = await createTechnicalSeoAgent(this.model);
    }
    return this.technicalSeoAgent;
  }
  
  async runKeywordResearch(input: { 
    keyword: string; 
    business: string;
  }): Promise<KeywordAnalysisResult> {
    const agent = await this.initKeywordAgent();
    
    const result = await agent.invoke({
      input: `Analyze this keyword: "${input.keyword}" for the business "${input.business}". Provide complete analysis on search volume, trends, competition, relevance, and commercial intent.`
    });
    
    return formatKeywordResults(result.output);
  }
  
  async runContentOptimization(input: { 
    content: string; 
    keyword: string; 
    topic: string;
  }): Promise<ContentOptimizationResult> {
    const agent = await this.initContentAgent();
    
    const result = await agent.invoke({
      input: `Analyze this content for the keyword "${input.keyword}" and topic "${input.topic}":\n\n${input.content}\n\nProvide comprehensive optimization recommendations.`
    });
    
    return formatContentResults(result.output);
  }
  
  async runTechnicalSeoAudit(input: { 
    url: string;
  }): Promise<TechnicalSeoResult> {
    const agent = await this.initTechnicalSeoAgent();
    
    const result = await agent.invoke({
      input: `Perform a technical SEO audit for this website: ${input.url}. Analyze website structure, performance, mobile-friendliness, and schema markup in detail.`
    });
    
    return formatTechnicalSeoResults(result.output);
  }
}

// Create and export a default agent service for use throughout the app
export const createAgentService = (apiKey: string, modelName?: string) => {
  return new AgentService({ apiKey, modelName });
};