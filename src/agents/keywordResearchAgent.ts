import { BaseLanguageModel } from "langchain/base_language";
import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents";
import { Tool } from "langchain/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";

import axios from 'axios';
import * as googlethis from 'googlethis';
import * as keywordExtractor from 'keyword-extractor';

// Tools for the keyword research agent
class SearchTrendsTool extends Tool {
  name = "search_trends";
  description = "Use to get information about current search trends for a keyword";

  constructor() {
    super();
  }

  async _call(query: string): Promise<string> {
    try {
      // Using googlethis library to get search results and related terms
      const options = {
        page: 0,
        safe: true,
        additional_params: {
          hl: 'en'
        }
      };
      
      const searchResults = await googlethis.search(query, options);
      
      // Extract related search terms
      const relatedSearches = searchResults.related_searches || [];
      const relatedTerms = relatedSearches.map(term => term.query).slice(0, 5);
      
      // Get basic search volume estimate from result stats
      const searchVolume = searchResults.results.length * 1000; // Very simplified estimate
      
      return `Search trend data for "${query}": 
        - Estimated monthly search volume: ${searchVolume}
        - Top search position: ${searchResults.results[0]?.position || 'N/A'} 
        - Number of search results: ${searchResults.results.length}
        - Related rising terms: ${relatedTerms.join(', ')}`;
    } catch (error) {
      console.error("Error in search trends tool:", error);
      return `Error getting search trend data for "${query}". Please try again with a different query.`;
    }
  }
}

class CompetitionAnalysisTool extends Tool {
  name = "competition_analysis";
  description = "Use to analyze competition strength for a keyword";

  constructor() {
    super();
  }

  async _call(query: string): Promise<string> {
    try {
      // Using googlethis library to get top competing sites
      const options = {
        page: 0, 
        safe: true,
        additional_params: {
          hl: 'en'
        }
      };
      
      const searchResults = await googlethis.search(query, options);
      
      // Extract competing websites
      const topSites = searchResults.results
        .filter(result => result.url && result.title)
        .map(result => {
          const url = new URL(result.url);
          return url.hostname.replace('www.', '');
        })
        .slice(0, 5);
      
      // Determine competition level based on presence of big domains
      let competitionLevel = "Low";
      const bigDomains = ["amazon.com", "wikipedia.org", "youtube.com", "facebook.com", "instagram.com"];
      const bigDomainCount = topSites.filter(site => 
        bigDomains.some(domain => site.includes(domain))
      ).length;
      
      if (bigDomainCount >= 3) {
        competitionLevel = "High";
      } else if (bigDomainCount >= 1) {
        competitionLevel = "Medium";
      }
      
      // Analyze content types
      const contentTypes = [];
      if (searchResults.results.some(r => r.url?.includes("youtube.com"))) {
        contentTypes.push("Video content");
      }
      if (searchResults.results.some(r => r.description?.includes("guide") || r.title?.includes("guide"))) {
        contentTypes.push("Guides");
      }
      if (searchResults.results.some(r => r.description?.includes("blog") || r.title?.includes("blog"))) {
        contentTypes.push("Blog posts");
      }
      if (contentTypes.length === 0) {
        contentTypes.push("Mixed content");
      }
      
      return `Competition analysis for "${query}":
        - Competition level: ${competitionLevel}
        - Top ranking sites: ${topSites.join(', ')}
        - Number of major competitors: ${bigDomainCount}
        - Content types: ${contentTypes.join(', ')}`;
        
    } catch (error) {
      console.error("Error in competition analysis tool:", error);
      return `Error analyzing competition for "${query}". Please try again with a different query.`;
    }
  }
}

class KeywordRelevanceTool extends Tool {
  name = "keyword_relevance";
  description = "Use to analyze how relevant a keyword is to a specific business or website";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { keyword, business } = JSON.parse(input);
      
      // Extract keywords from business description
      const businessKeywords = keywordExtractor.extract(business, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true
      });
      
      // Extract keywords from the search keyword
      const searchKeywords = keywordExtractor.extract(keyword, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true
      });
      
      // Calculate relevance based on keyword overlap
      const matchingKeywords = businessKeywords.filter(word => 
        searchKeywords.includes(word) || keyword.toLowerCase().includes(word.toLowerCase())
      );
      
      const relevanceScore = Math.min(10, Math.ceil((matchingKeywords.length / businessKeywords.length) * 10)) || 5;
      
      // Estimate commercial intent
      let commercialIntent = "Medium";
      const commercialTerms = ["buy", "price", "cost", "purchase", "shop", "deal", "best", "top", "review"];
      if (commercialTerms.some(term => keyword.toLowerCase().includes(term))) {
        commercialIntent = "High";
      } else if (keyword.toLowerCase().includes("how") || keyword.toLowerCase().includes("what")) {
        commercialIntent = "Low";
      }
      
      // Calculate audience match
      const audienceMatch = relevanceScore >= 7 ? "Strong" : (relevanceScore >= 4 ? "Moderate" : "Weak");
      
      // Calculate conversion potential
      const conversionPotential = commercialIntent === "High" ? "Above average" : 
                                 (commercialIntent === "Medium" ? "Average" : "Below average");
      
      return `Relevance analysis for "${keyword}" to "${business}":
        - Relevance score: ${relevanceScore}/10
        - Commercial intent: ${commercialIntent}
        - Target audience match: ${audienceMatch}
        - Conversion potential: ${conversionPotential}
        - Matching business terms: ${matchingKeywords.join(', ') || 'None found'}`;
        
    } catch (e) {
      return "Please provide input as JSON with 'keyword' and 'business' fields";
    }
  }
}

// Create the Keyword Research Agent
export async function createKeywordResearchAgent(model: BaseLanguageModel) {
  const tools = [
    new SearchTrendsTool(),
    new CompetitionAnalysisTool(),
    new KeywordRelevanceTool(),
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
    agentArgs: {
      systemMessage: `You are an expert SEO keyword research specialist.
    
Your job is to analyze search terms to identify high-value keywords based on:
1. Search volume and trends
2. Competition level
3. Relevance to the business
4. Commercial intent
5. Keyword difficulty

Important: You MUST use the tools to gather data first, then thoroughly analyze that data to provide deeper insights.
For each analysis step:
1. Call the appropriate tool to get data
2. Carefully interpret the data provided by the tool 
3. Add your own expert analysis and strategic insights
4. Connect the findings to practical business implications

For example, don't just report search volume - explain what it means for the business and compare it to industry standards.

Provide comprehensive keyword analysis with detailed, actionable insights that go beyond the raw tool data.
Include specific recommendations tailored to the business context.`
    }
  });

  return executor;
}

export type KeywordAnalysisResult = {
  keyword: string;
  searchVolume: number;
  trend: string;
  competitionLevel: string;
  relevanceScore: number;
  commercialIntent: string;
  difficulty: number;
  recommendation: string;
  relatedKeywords: string[];
};

// Function to format the raw agent output into a structured result
export function formatKeywordResults(rawOutput: string): KeywordAnalysisResult {
  // Extract the main keyword from the output
  const keywordMatch = rawOutput.match(/for "(.*?)"/);
  const keyword = keywordMatch ? keywordMatch[1] : "Unknown keyword";
  
  // Extract search volume
  const volumeMatch = rawOutput.match(/volume:?\s*(\d[\d,]*)/i);
  const searchVolume = volumeMatch ? parseInt(volumeMatch[1].replace(/,/g, '')) : 1000;
  
  // Extract trend
  const trendRegexes = [
    /trend:?\s*(.*?)(\n|$)/i,
    /trends?:?\s*(.*?)(\n|$)/i,
    /search trends? (is|are):?\s*(.*?)(\n|$)/i,
    /keyword (is|has been) (increasing|decreasing|stable|trending|growing)/i
  ];
  
  let trend = "Stable";
  for (const regex of trendRegexes) {
    const match = rawOutput.match(regex);
    if (match) {
      // If the match includes words like "increasing", "growing", "upward", set trend to "Increasing"
      const trendText = match[1] || match[2] || "";
      if (/increas|grow|upward|rising|positive|up|higher/i.test(trendText)) {
        trend = "Increasing";
        break;
      } else if (/decreas|down|declining|falling|negative|lower/i.test(trendText)) {
        trend = "Decreasing";
        break;
      } else if (/stable|steady|consistent|flat|unchanged/i.test(trendText)) {
        trend = "Stable";
        break;
      } else if (/seasonal|cyclical|periodic/i.test(trendText)) {
        trend = "Seasonal";
        break;
      }
    }
  }
  
  // Extract competition level
  const competitionRegexes = [
    /competition level:?\s*(.*?)(\n|$)/i,
    /competition:?\s*(.*?)(\n|$)/i,
    /competitive:?\s*(.*?)(\n|$)/i,
    /competition (is|seems|appears to be) (high|medium|low|moderate|intense|minimal)/i
  ];
  
  let competitionLevel = "Medium";
  for (const regex of competitionRegexes) {
    const match = rawOutput.match(regex);
    if (match) {
      const compText = match[1] || match[2] || "";
      if (/high|intense|strong|fierce|significant/i.test(compText)) {
        competitionLevel = "High";
        break;
      } else if (/medium|moderate|average|mid/i.test(compText)) {
        competitionLevel = "Medium";
        break;
      } else if (/low|minimal|weak|little|limited/i.test(compText)) {
        competitionLevel = "Low";
        break;
      }
    }
  }
  
  // Extract relevance score
  const relevanceRegexes = [
    /relevance score:?\s*(\d+)\/10/i,
    /relevance:?\s*(\d+)\/10/i,
    /relevance:?\s*(\d+) out of 10/i,
    /relevance (?:score|rating) of (\d+)/i
  ];
  
  let relevanceScore = 5;
  for (const regex of relevanceRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      relevanceScore = parseInt(match[1]);
      break;
    }
  }
  
  // Extract commercial intent
  const intentRegexes = [
    /commercial intent:?\s*(.*?)(\n|$)/i,
    /buying intent:?\s*(.*?)(\n|$)/i,
    /purchase intent:?\s*(.*?)(\n|$)/i,
    /intent:?\s*(.*?)(\n|$)/i,
    /intent (is|appears to be|seems) (high|medium|low)/i
  ];
  
  let commercialIntent = "Medium";
  for (const regex of intentRegexes) {
    const match = rawOutput.match(regex);
    if (match) {
      const intentText = match[1] || match[2] || "";
      if (/high|strong|significant|excellent|good|above average/i.test(intentText)) {
        commercialIntent = "High";
        break;
      } else if (/medium|moderate|average|mid/i.test(intentText)) {
        commercialIntent = "Medium";
        break;
      } else if (/low|minimal|weak|little|poor|limited|below average/i.test(intentText)) {
        commercialIntent = "Low";
        break;
      }
    }
  }
  
  // Calculate difficulty based on competition and search volume with more nuance
  let difficulty = competitionLevel === "High" ? 8 : 
                   competitionLevel === "Medium" ? 6 : 4;
                   
  // Adjust difficulty based on search volume
  if (searchVolume > 10000) {
    difficulty += 1;
  } else if (searchVolume < 1000) {
    difficulty -= 1;
  }
  
  // Ensure difficulty is within 1-10 range
  difficulty = Math.max(1, Math.min(10, difficulty));
  
  // Extract related keywords more comprehensively
  const relatedRegexes = [
    /related .*?:?\s*(.*?)(\n|$)/i,
    /related keywords:?\s*(.*?)(\n|$)/i,
    /similar keywords:?\s*(.*?)(\n|$)/i,
    /keyword variations:?\s*(.*?)(\n|$)/i,
    /alternative keywords:?\s*(.*?)(\n|$)/i,
    /suggested keywords:?\s*(.*?)(\n|$)/i
  ];
  
  let relatedKeywords: string[] = [`${keyword} guide`, `${keyword} tutorial`];
  for (const regex of relatedRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      const keywordsList = match[1].split(/,|;/).map(kw => kw.trim()).filter(kw => kw.length > 0);
      if (keywordsList.length > 0) {
        relatedKeywords = keywordsList;
        break;
      }
    }
  }
  
  // Extract recommendation directly if present, otherwise generate one
  const recommendationRegexes = [
    /recommendation:?\s*(.*?)(\n|$)/i,
    /recommended approach:?\s*(.*?)(\n|$)/i,
    /recommended strategy:?\s*(.*?)(\n|$)/i,
    /suggest(ion|ed):?\s*(.*?)(\n|$)/i,
    /I recommend:?\s*(.*?)(\n|$)/i
  ];
  
  let recommendation = "";
  for (const regex of recommendationRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1] && match[1].length > 20) {  // Ensure it's a substantial recommendation
      recommendation = match[1].trim();
      break;
    }
  }
  
  // If no good recommendation found, generate one based on the metrics
  if (!recommendation) {
    if (commercialIntent === "High" && competitionLevel === "Low") {
      recommendation = `Priority target: Create commercial content for "${keyword}"`;
    } else if (commercialIntent === "High" && competitionLevel === "High") {
      recommendation = `Create in-depth, unique content to compete for "${keyword}"`;
    } else if (commercialIntent === "Low") {
      recommendation = `Create informational content for "${keyword}" to build authority`;
    } else {
      recommendation = `Target this keyword with comprehensive, long-form content`;
    }
  }
  
  return {
    keyword,
    searchVolume,
    trend,
    competitionLevel,
    relevanceScore,
    commercialIntent,
    difficulty,
    recommendation,
    relatedKeywords,
  };
}