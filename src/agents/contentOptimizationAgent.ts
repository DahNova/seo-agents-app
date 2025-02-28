import { BaseLanguageModel } from "langchain/base_language";
import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents";
import { Tool } from "langchain/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";

import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import * as keywordExtractor from 'keyword-extractor';
import axios from 'axios';
import * as googlethis from 'googlethis';

// Tools for the content optimization agent
class ReadabilityAnalysisTool extends Tool {
  name = "readability_analysis";
  description = "Analyzes content readability metrics like Flesch-Kincaid score, sentence length, and paragraph density";

  constructor() {
    super();
  }

  async _call(content: string): Promise<string> {
    try {
      // Simple readability metrics
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      const avgSentenceLength = wordCount / (sentenceCount || 1);
      
      // Paragraph count and density
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const paragraphCount = paragraphs.length;
      const avgWordsPerParagraph = wordCount / (paragraphCount || 1);
      
      // Basic HTML conversion - browser DOMParser not available in Node.js
      const html = `<html><body>${content.split('\n').map(p => `<p>${p}</p>`).join('')}</body></html>`;
      
      // Calculate reading time (average reading speed is ~200-250 WPM)
      const readingTime = Math.ceil(wordCount / 200);
      
      // Simple Flesch-Kincaid readability score approximation
      // FK = 206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
      // This is a simplified version as syllable counting is complex
      const avgSyllablesPerWord = 1.5; // English average
      const fleschKincaid = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
      const fkRounded = Math.round(Math.max(0, Math.min(100, fleschKincaid)));
      
      // Determine readability level
      let readabilityLevel = "Complex";
      if (fkRounded >= 80) {
        readabilityLevel = "Very Easy";
      } else if (fkRounded >= 70) {
        readabilityLevel = "Easy";
      } else if (fkRounded >= 60) {
        readabilityLevel = "Standard";
      } else if (fkRounded >= 50) {
        readabilityLevel = "Fairly Difficult";
      } else if (fkRounded >= 30) {
        readabilityLevel = "Difficult";
      }
      
      // Paragraph density assessment
      let paragraphDensity = "Poor";
      if (avgWordsPerParagraph <= 40) {
        paragraphDensity = "Excellent";
      } else if (avgWordsPerParagraph <= 60) {
        paragraphDensity = "Good";
      } else if (avgWordsPerParagraph <= 100) {
        paragraphDensity = "Acceptable";
      }
      
      return `Readability analysis:
        - Word count: ${wordCount}
        - Sentence count: ${sentenceCount}
        - Paragraph count: ${paragraphCount}
        - Flesch-Kincaid score: ${fkRounded} (${readabilityLevel})
        - Average sentence length: ${avgSentenceLength.toFixed(1)} words
        - Average paragraph length: ${avgWordsPerParagraph.toFixed(1)} words
        - Paragraph density: ${paragraphDensity}
        - Reading time: ${readingTime} minute${readingTime !== 1 ? 's' : ''}`;
    } catch (error) {
      console.error("Error in readability analysis:", error);
      return `Error analyzing readability. Please check content format.`;
    }
  }
}

class KeywordUsageAnalysisTool extends Tool {
  name = "keyword_usage";
  description = "Analyzes keyword density, placement, and variations";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { content, keyword } = JSON.parse(input);
      const lowerContent = content.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();
      
      // Simple keyword density calculation
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const exactKeywordCount = (lowerContent.match(new RegExp(`\\b${lowerKeyword}\\b`, "g")) || []).length;
      const exactKeywordDensity = (exactKeywordCount / wordCount) * 100;
      
      // Look for keyword variations
      const keywordParts = lowerKeyword.split(/\s+/);
      let partialMatches = 0;
      
      // Count partial matches (if the keyword has multiple words)
      if (keywordParts.length > 1) {
        keywordParts.forEach(part => {
          if (part.length > 3) { // Only consider meaningful words
            const partMatches = (lowerContent.match(new RegExp(`\\b${part}\\b`, "g")) || []).length;
            partialMatches += partMatches;
          }
        });
        // Don't double count exact matches
        partialMatches = Math.max(0, partialMatches - (exactKeywordCount * keywordParts.length));
      }
      
      // Convert HTML-like content to analyze headings
      let $ = cheerio.load(`<body>${content}</body>`);
      
      // Check for headings (naively if no HTML)
      const hasH1 = $('h1').length > 0 ? 
        $('h1').text().toLowerCase().includes(lowerKeyword) :
        content.split('\n').some(line => line.trim().startsWith('#') && line.toLowerCase().includes(lowerKeyword));
        
      const hasH2 = $('h2').length > 0 ? 
        $('h2').text().toLowerCase().includes(lowerKeyword) :
        content.split('\n').some(line => line.trim().startsWith('##') && line.toLowerCase().includes(lowerKeyword));
      
      // Check for keyword in first 100 words
      const first100Words = content.split(/\s+/).slice(0, 100).join(" ").toLowerCase();
      const keywordInIntro = first100Words.includes(lowerKeyword);
      
      // LSI keywords (related terms)
      const lsiTerms = keywordExtractor.extract(content, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true
      }).filter(term => !keywordParts.includes(term)).slice(0, 5);
      
      // Calculate optimal keyword density
      const optimalDensity = keyword.split(/\s+/).length > 2 ? "0.5% to 1%" : "1% to 2%";
      const densityAssessment = exactKeywordDensity > 3 ? "Too high" : 
                              (exactKeywordDensity > 0.5 ? "Good" : "Too low");
      
      return `Keyword usage analysis for "${keyword}":
        - Exact keyword count: ${exactKeywordCount}
        - Keyword density: ${exactKeywordDensity.toFixed(2)}% (${densityAssessment})
        - Recommended density: ${optimalDensity}
        - Keyword variations found: ${partialMatches}
        - H1/Title inclusion: ${hasH1 ? "Yes" : "No"}
        - H2/Subheading inclusion: ${hasH2 ? "Yes" : "No"}
        - First 100 words: ${keywordInIntro ? "Yes" : "No"}
        - Related terms found: ${lsiTerms.join(', ')}`;
        
    } catch (e) {
      console.error("Error in keyword usage analysis:", e);
      return "Please provide input as JSON with 'content' and 'keyword' fields";
    }
  }
}

class SemanticRelevanceTool extends Tool {
  name = "semantic_relevance";
  description = "Analyzes content for semantic relevance to the target topic";

  constructor() {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { content, topic } = JSON.parse(input);
      
      // Get top search results for topic to determine key subtopics
      const options = {
        page: 0,
        safe: true,
        additional_params: {
          hl: 'en'
        }
      };
      
      const searchResults = await googlethis.search(topic, options);
      
      // Extract related searches and people also ask
      const relatedSearches = searchResults.related_searches?.map(s => s.query) || [];
      const peopleAlsoAsk = searchResults.people_also_ask?.map(q => q.question) || [];
      
      // Combine to get potential subtopics
      const potentialSubtopics = [...relatedSearches, ...peopleAlsoAsk];
      
      // Extract keywords from content
      const contentKeywords = keywordExtractor.extract(content, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true
      });
      
      // Check which subtopics are covered in the content
      const coveredSubtopics = [];
      const missingSubtopics = [];
      
      potentialSubtopics.forEach(subtopic => {
        const subtopicKeywords = keywordExtractor.extract(subtopic, {
          language: "english",
          remove_digits: true,
          return_changed_case: true,
          remove_duplicates: true
        });
        
        // Check if subtopic keywords are present in content keywords
        const matches = subtopicKeywords.filter(keyword => 
          contentKeywords.includes(keyword) || 
          content.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // If more than half of subtopic keywords are found, consider it covered
        if (matches.length > subtopicKeywords.length / 2) {
          coveredSubtopics.push(subtopic);
        } else {
          missingSubtopics.push(subtopic);
        }
      });
      
      // Only keep top 5 for each list
      const topCoveredSubtopics = coveredSubtopics.slice(0, 5);
      const topMissingSubtopics = missingSubtopics.slice(0, 5);
      
      // Calculate topic coverage score
      const totalSubtopics = potentialSubtopics.length || 1;
      const coverageRatio = coveredSubtopics.length / totalSubtopics;
      const coverageScore = Math.min(10, Math.round(coverageRatio * 10));
      
      // Determine semantic depth
      let semanticDepth = "Low";
      if (coverageScore >= 8) {
        semanticDepth = "High";
      } else if (coverageScore >= 5) {
        semanticDepth = "Medium";
      }
      
      return `Semantic relevance analysis for "${topic}":
        - Topic coverage score: ${coverageScore}/10
        - Key subtopics detected: ${topCoveredSubtopics.join(", ") || "None"}
        - Missing subtopics: ${topMissingSubtopics.join(", ") || "None"}
        - Entity recognition: ${coverageScore >= 7 ? "Good" : coverageScore >= 4 ? "Moderate" : "Poor"} coverage of main entities
        - Semantic depth: ${semanticDepth}`;
        
    } catch (e) {
      console.error("Error in semantic relevance analysis:", e);
      return "Please provide input as JSON with 'content' and 'topic' fields";
    }
  }
}

// Create the Content Optimization Agent
export async function createContentOptimizationAgent(model: BaseLanguageModel) {
  const tools = [
    new ReadabilityAnalysisTool(),
    new KeywordUsageAnalysisTool(),
    new SemanticRelevanceTool(),
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
    agentArgs: {
      systemMessage: `You are an expert content optimization specialist with deep understanding of SEO, user experience, and content strategy.
    
Your job is to analyze content and provide comprehensive, thoughtful improvements for:
1. Readability and engagement
2. Keyword usage and optimization
3. Semantic relevance and topical depth
4. Structure and formatting
5. User intent alignment

Important: You MUST use the tools to gather data first, then thoroughly analyze that data to provide deeper insights that go far beyond the raw metrics.

For each analysis area:
1. Call the appropriate tool to get quantitative data
2. Deeply interpret those findings in the context of the specific content and topic
3. Apply your expert knowledge to identify issues the tools can't directly measure
4. Suggest specific edits with examples where possible
5. Explain the strategic reasoning behind each recommendation

For example, after analyzing readability, don't just suggest "make sentences shorter" - provide specific examples from the content, suggest rewrites, and explain how these changes will improve reader engagement.

Provide a comprehensive content analysis that includes:
- Detailed assessment of the current content strengths and weaknesses
- Multiple specific examples from the content
- Prioritized, actionable recommendations with clear explanations
- Strategic insights about how the content could better serve user intent and business goals`
    }
  });

  return executor;
}

export type ContentOptimizationResult = {
  contentScore: number;
  readabilityScore: number;
  keywordScore: number;
  semanticScore: number;
  recommendations: {
    priority: string;
    category: string;
    suggestion: string;
  }[];
  missingSubtopics: string[];
  improvedTitle?: string;
  improvedMetaDescription?: string;
};

// Function to format the raw agent output into a structured result
export function formatContentResults(rawOutput: string): ContentOptimizationResult {
  // Extract readability score with enhanced regex patterns
  const readabilityRegexes = [
    /Flesch-Kincaid score:?\s*(\d+)/i,
    /readability score:?\s*(\d+)/i,
    /FK score:?\s*(\d+)/i,
    /readability:?\s*(\d+)/i,
    /readability rating of (\d+)/i
  ];
  
  let readabilityScore = 65; // Default value
  for (const regex of readabilityRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      readabilityScore = parseInt(match[1]);
      break;
    }
  }
  
  // Extract keyword usage data with more flexible patterns
  const keywordDensityRegexes = [
    /keyword density:?\s*([\d.]+)%/i,
    /density:?\s*([\d.]+)%/i,
    /keyword frequency:?\s*([\d.]+)%/i,
    /keyword usage:?\s*([\d.]+)%/i,
    /keyword appears at (?:a|an) ([\d.]+)% density/i
  ];
  
  let keywordDensity = 1.5; // Default value
  for (const regex of keywordDensityRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      keywordDensity = parseFloat(match[1]);
      break;
    }
  }
  
  // Check for keyword placement in important areas
  const h1InclusionRegexes = [
    /H1\/Title inclusion:?\s*Yes/i,
    /keyword.*?found.*?H1/i,
    /H1.*?contains.*?keyword/i,
    /keyword.*?present.*?title/i,
    /title.*?includes.*?keyword/i
  ];
  
  let keywordInH1 = false;
  for (const regex of h1InclusionRegexes) {
    if (regex.test(rawOutput)) {
      keywordInH1 = true;
      break;
    }
  }
  
  const introInclusionRegexes = [
    /First 100 words:?\s*Yes/i,
    /keyword.*?found.*?introduction/i,
    /keyword.*?present.*?beginning/i,
    /introduction.*?contains.*?keyword/i,
    /keyword.*?appears.*?first.*?paragraph/i
  ];
  
  let keywordInIntro = false;
  for (const regex of introInclusionRegexes) {
    if (regex.test(rawOutput)) {
      keywordInIntro = true;
      break;
    }
  }
  
  // Calculate keyword score with more sophisticated logic
  let keywordScore = 60; // Base score
  
  // Adjust for optimal density (not too low, not too high)
  if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
    keywordScore += 20;
  } else if (keywordDensity > 2.5 && keywordDensity <= 3.5) {
    keywordScore += 10;
  } else if (keywordDensity > 3.5) {
    keywordScore -= 10;
  } else if (keywordDensity < 0.5) {
    keywordScore -= 15;
  }
  
  // Adjust for keyword placement
  if (keywordInH1) keywordScore += 10;
  if (keywordInIntro) keywordScore += 10;
  
  // Cap at 100
  keywordScore = Math.min(100, Math.max(0, keywordScore));
  
  // Extract semantic score with enhanced patterns
  const semanticScoreRegexes = [
    /Topic coverage score:?\s*([\d.]+)\/10/i,
    /semantic relevance:?\s*([\d.]+)\/10/i,
    /semantic score:?\s*([\d.]+)\/10/i,
    /semantic depth:?\s*([\d.]+)\/10/i,
    /topical coverage:?\s*([\d.]+)\/10/i,
    /semantic coverage of (\d+)%/i, // Convert percentage to /10 score
    /topic coverage:?\s*(\d+)%/i
  ];
  
  let topicScoreRaw = 7; // Default value
  for (const regex of semanticScoreRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      // If it's a percentage (out of 100), convert to scale of 10
      if (regex.toString().includes('%')) {
        topicScoreRaw = parseInt(match[1]) / 10;
      } else {
        topicScoreRaw = parseFloat(match[1]);
      }
      break;
    }
  }
  
  const semanticScore = Math.round(topicScoreRaw * 10);
  
  // Calculate overall content score with weighted average
  // Give more weight to keyword and semantic scores as they're more important for SEO
  const contentScore = Math.round((readabilityScore * 0.3) + (keywordScore * 0.4) + (semanticScore * 0.3));
  
  // Extract missing subtopics with enhanced patterns
  const missingSubtopicsRegexes = [
    /Missing subtopics:?\s*(.*?)(\n|$)/i,
    /content should cover:?\s*(.*?)(\n|$)/i,
    /topics to add:?\s*(.*?)(\n|$)/i,
    /recommended subtopics:?\s*(.*?)(\n|$)/i,
    /consider adding sections on:?\s*(.*?)(\n|$)/i,
    /important subtopics missing:?\s*(.*?)(\n|$)/i
  ];
  
  let missingSubtopics: string[] = ["Topic research needed"];
  for (const regex of missingSubtopicsRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      const subtopics = match[1].split(/,|;/).map(s => s.trim()).filter(s => s !== "None" && s.length > 0);
      if (subtopics.length > 0) {
        missingSubtopics = subtopics;
        break;
      }
    }
  }
  
  // Extract direct recommendations from the agent's output
  const recommendationRegexes = [
    /recommendation:?\s*(.*?)(\n|$)/i,
    /suggest(?:ion|ed):?\s*(.*?)(\n|$)/i,
    /improve:?\s*(.*?)(\n|$)/i,
    /priorit(?:y|ize):?\s*(.*?)(\n|$)/i,
    /should:?\s*(.*?)(\n|$)/i,
    /consider:?\s*(.*?)(\n|$)/i
  ];
  
  // Try to find direct recommendations in the output
  const directRecommendations: {priority: string, category: string, suggestion: string}[] = [];
  for (const regex of recommendationRegexes) {
    let startPos = 0;
    let match;
    
    while ((match = rawOutput.substring(startPos).match(regex)) !== null) {
      const fullMatch = match[0];
      const suggestion = match[1].trim();
      
      if (suggestion.length > 15) { // Only meaningful recommendations
        // Try to determine the category
        let category = "Content Structure";
        if (/keyword|densit|placement|h1|title/i.test(suggestion)) {
          category = "Keyword Usage";
        } else if (/readab|sentence|paragraph|complex|jargon/i.test(suggestion)) {
          category = "Readability";
        } else if (/semantic|topic|subtopic|coverage|depth/i.test(suggestion)) {
          category = "Semantic Relevance";
        } else if (/structure|format|heading|subhead|layout/i.test(suggestion)) {
          category = "Content Structure";
        } else if (/meta|description|title tag|schema/i.test(suggestion)) {
          category = "Meta Data";
        }
        
        // Try to determine priority
        let priority = "Medium";
        if (/urgent|critical|important|high|essential|must/i.test(suggestion)) {
          priority = "High";
        } else if (/consider|might|could|option|low|minor/i.test(suggestion)) {
          priority = "Low";
        }
        
        directRecommendations.push({
          priority,
          category,
          suggestion
        });
      }
      
      // Move past this match to find the next one
      startPos += match.index + fullMatch.length;
    }
  }
  
  // Generate fallback recommendations if we couldn't extract enough direct ones
  const fallbackRecommendations = [];
  
  // Keyword recommendations
  if (!keywordInH1) {
    fallbackRecommendations.push({
      priority: "High",
      category: "Keyword Usage",
      suggestion: "Include target keyword in H1 heading"
    });
  }
  
  if (keywordDensity < 0.5) {
    fallbackRecommendations.push({
      priority: "High",
      category: "Keyword Usage",
      suggestion: "Increase keyword usage throughout the content to at least 0.5% density"
    });
  } else if (keywordDensity > 3) {
    fallbackRecommendations.push({
      priority: "Medium",
      category: "Keyword Usage",
      suggestion: "Reduce keyword density to 1-2% to avoid keyword stuffing"
    });
  }
  
  // Readability recommendations
  const avgSentenceLengthMatch = rawOutput.match(/Average sentence length:?\s*([\d.]+)/i);
  const avgSentenceLength = avgSentenceLengthMatch ? parseFloat(avgSentenceLengthMatch[1]) : 20;
  
  if (avgSentenceLength > 20) {
    fallbackRecommendations.push({
      priority: "Medium",
      category: "Readability",
      suggestion: "Break long sentences into shorter ones for better readability (aim for 15-20 words per sentence)"
    });
  }
  
  const avgParaLengthMatch = rawOutput.match(/Average paragraph length:?\s*([\d.]+)/i);
  const avgParaLength = avgParaLengthMatch ? parseFloat(avgParaLengthMatch[1]) : 100;
  
  if (avgParaLength > 70) {
    fallbackRecommendations.push({
      priority: "Medium",
      category: "Readability",
      suggestion: "Break long paragraphs into shorter ones (3-4 sentences max) to improve readability"
    });
  }
  
  // Semantic recommendations
  if (missingSubtopics.length > 0 && missingSubtopics[0] !== "None") {
    fallbackRecommendations.push({
      priority: "Medium",
      category: "Semantic Relevance",
      suggestion: `Add sections on ${missingSubtopics.slice(0, 2).join(" and ")} to improve topical coverage and relevance`
    });
  }
  
  if (semanticScore < 60) {
    fallbackRecommendations.push({
      priority: "High",
      category: "Semantic Relevance",
      suggestion: "Expand content to cover more aspects of the topic for better search visibility"
    });
  }
  
  // Combine direct and fallback recommendations, prioritizing direct ones
  let recommendations = directRecommendations.length >= 3 ? 
    directRecommendations : 
    [...directRecommendations, ...fallbackRecommendations];
  
  // Extract the keyword if possible for title and meta description generation
  const keywordRegexes = [
    /for "(.*?)"/i,
    /keyword "(.*?)"/i,
    /analyzing "(.*?)"/i,
    /optimizing for "(.*?)"/i
  ];
  
  let keyword = "your topic";
  for (const regex of keywordRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      keyword = match[1];
      break;
    }
  }
  
  // Extract custom title and meta description if provided by the agent
  const titleRegexes = [
    /improved title:?\s*(.*?)(\n|$)/i,
    /suggested title:?\s*(.*?)(\n|$)/i,
    /recommended title:?\s*(.*?)(\n|$)/i,
    /title tag:?\s*(.*?)(\n|$)/i,
    /optimal title:?\s*(.*?)(\n|$)/i
  ];
  
  let improvedTitle = `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide & Best Practices | YourBrand`;
  for (const regex of titleRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1] && match[1].length > 10) {
      improvedTitle = match[1].trim();
      break;
    }
  }
  
  const metaRegexes = [
    /improved meta description:?\s*(.*?)(\n|$)/i,
    /suggested meta description:?\s*(.*?)(\n|$)/i,
    /recommended meta:?\s*(.*?)(\n|$)/i,
    /meta description:?\s*(.*?)(\n|$)/i,
    /optimal meta:?\s*(.*?)(\n|$)/i
  ];
  
  let improvedMetaDescription = `Learn everything about ${keyword} in this comprehensive guide. Discover best practices, examples, and expert tips to maximize your results.`;
  for (const regex of metaRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1] && match[1].length > 20) {
      improvedMetaDescription = match[1].trim();
      break;
    }
  }
  
  return {
    contentScore,
    readabilityScore,
    keywordScore,
    semanticScore,
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
    missingSubtopics,
    improvedTitle,
    improvedMetaDescription
  };
}