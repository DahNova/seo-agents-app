import { BaseLanguageModel } from "langchain/base_language";
import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents";
import { Tool } from "langchain/tools";
import { ChatPromptTemplate, MessagesPlaceholder } from "langchain/prompts";

import axios from 'axios';
import * as cheerio from 'cheerio';
import MobileDetect from 'mobile-detect';

// Tools for the technical SEO agent
class WebsiteStructureTool extends Tool {
  name = "website_structure";
  description = "Analyzes website structure, including information architecture, internal linking, and URL patterns";

  constructor() {
    super();
  }

  async _call(url: string): Promise<string> {
    try {
      // Validate and normalize URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Fetch the website content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAgentBot/1.0; +http://seoagent.example.com)',
        },
        timeout: 10000, // 10 second timeout
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Check for basic SEO elements
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const h1Count = $('h1').length;
      const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
      
      // Analyze internal links
      const internalLinks = $('a[href]').map((i, el) => {
        const href = $(el).attr('href') || '';
        try {
          const linkUrl = new URL(href, url);
          // Check if it's an internal link (same hostname)
          if (linkUrl.hostname === new URL(url).hostname) {
            return linkUrl.href;
          }
        } catch {
          // Relative URL
          if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {
            return href;
          }
        }
        return null;
      }).get().filter(Boolean);
      
      // Count unique internal links
      const uniqueInternalLinks = new Set(internalLinks);
      
      // Analyze URL structure
      const urlStructure = new URL(url);
      const isCleanUrl = !urlStructure.pathname.includes('.php') && 
                          !urlStructure.pathname.includes('.html') &&
                          !urlStructure.search.includes('sid=') &&
                          !urlStructure.search.includes('sessionid=');
      
      // Check for breadcrumbs
      const hasBreadcrumbs = $('nav[aria-label="breadcrumb"], .breadcrumb, .breadcrumbs').length > 0 ||
                             $('*').filter((i, el) => 
                               $(el).text().includes(' > ') && 
                               $(el).find('a').length > 1
                             ).length > 0;
      
      // Check for site navigation
      const hasNavigation = $('nav, .nav, .navigation, .menu, header').length > 0;
      
      // Estimate information architecture depth
      let depthEstimate = 1;
      if (urlStructure.pathname.length > 1) {
        depthEstimate = urlStructure.pathname.split('/').filter(p => p.length > 0).length;
      }
      
      // Check URL parameters for potential duplicate content issues
      const hasSessionParams = urlStructure.search.includes('sid=') || 
                               urlStructure.search.includes('session=') ||
                               urlStructure.search.includes('s=');
      
      // Check for robots.txt and sitemap
      let hasSitemap = false;
      let hasRobotsTxt = false;
      try {
        const robotsUrl = `${urlStructure.protocol}//${urlStructure.hostname}/robots.txt`;
        const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 });
        hasRobotsTxt = robotsResponse.status === 200;
        
        // Check if robots.txt mentions sitemap
        hasSitemap = robotsResponse.data.includes('Sitemap:');
      } catch {
        // Robots.txt not found or accessible
      }
      
      return `Website structure analysis for ${url}:
        - Pages crawled: 1 (limited analysis)
        - Title: ${title ? 'Present' : 'Missing'} (${title.length || 0} characters)
        - Meta description: ${metaDescription ? 'Present' : 'Missing'} (${metaDescription.length || 0} characters)
        - Information architecture: Approximately ${depthEstimate} levels deep
        - Internal links: ${uniqueInternalLinks.size} unique links found
        - URL structure: ${isCleanUrl ? 'Clean, semantic URLs' : 'URLs contain undesirable elements'}
        - Breadcrumb navigation: ${hasBreadcrumbs ? 'Present' : 'Not detected'}
        - Site navigation: ${hasNavigation ? 'Present' : 'Not clearly defined'}
        - H1 headings: ${h1Count} detected (${h1Count === 1 ? 'Good' : h1Count === 0 ? 'Missing' : 'Too many'})
        - Canonical URL: ${canonicalUrl ? 'Present' : 'Missing'}
        - Robots.txt: ${hasRobotsTxt ? 'Present' : 'Not found'}
        - Sitemap: ${hasSitemap ? 'Referenced in robots.txt' : 'Not detected'}
        - Potential duplicate content issues: ${hasSessionParams ? 'URL parameters may cause duplicate content' : 'None detected'}`;
    } catch (error) {
      console.error("Error in website structure tool:", error);
      return `Error analyzing website structure for ${url}. Please check if the website is accessible and try again.`;
    }
  }
}

class PerformanceAuditTool extends Tool {
  name = "performance_audit";
  description = "Analyzes website performance metrics such as page speed, Core Web Vitals, and loading times";

  constructor() {
    super();
  }

  async _call(url: string): Promise<string> {
    try {
      // Validate and normalize URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Fetch the website and measure time
      const startTime = Date.now();
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAgentBot/1.0; +http://seoagent.example.com)',
        },
        timeout: 20000, // 20 second timeout
      });
      
      const loadTime = Date.now() - startTime;
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Count resources
      const scriptCount = $('script').length;
      const stylesheetCount = $('link[rel="stylesheet"]').length;
      const imageCount = $('img').length;
      const totalResourceCount = scriptCount + stylesheetCount + imageCount;
      
      // Check for render blocking resources
      const renderBlockingStyles = $('link[rel="stylesheet"]').not('[media="print"]').not('[media="(max-width: 0px)"]').length;
      const renderBlockingScripts = $('script').not('[async]').not('[defer]').not('[type="module"]').length;
      
      // Check for image optimization
      const unoptimizedImages = $('img').filter((i, el) => {
        return !$(el).attr('loading') || $(el).attr('loading') !== 'lazy';
      }).length;
      
      // Calculate performance score (simple estimate)
      let performanceScore = 100;
      
      // Penalize for load time
      if (loadTime > 3000) {
        performanceScore -= 20;
      } else if (loadTime > 1500) {
        performanceScore -= 10;
      } else if (loadTime > 800) {
        performanceScore -= 5;
      }
      
      // Penalize for render blocking resources
      performanceScore -= Math.min(20, (renderBlockingStyles + renderBlockingScripts) * 3);
      
      // Penalize for unoptimized images
      performanceScore -= Math.min(15, unoptimizedImages * 2);
      
      // Penalize for excessive resources
      if (totalResourceCount > 75) {
        performanceScore -= 15;
      } else if (totalResourceCount > 50) {
        performanceScore -= 10;
      } else if (totalResourceCount > 25) {
        performanceScore -= 5;
      }
      
      // Ensure score is within 0-100 range
      performanceScore = Math.max(0, Math.min(100, performanceScore));
      
      // Estimate Core Web Vitals (very rough approximations)
      const estimatedFCP = loadTime * 0.6; // First Contentful Paint
      const estimatedLCP = loadTime * 0.8; // Largest Contentful Paint
      const estimatedCLS = unoptimizedImages > 10 ? 0.25 : unoptimizedImages > 5 ? 0.15 : 0.05; // Cumulative Layout Shift
      const estimatedFID = renderBlockingScripts > 10 ? 300 : renderBlockingScripts > 5 ? 150 : 80; // First Input Delay
      const estimatedTBT = renderBlockingScripts * 50; // Total Blocking Time
      
      return `Performance audit for ${url}:
        - Performance score: ${Math.round(performanceScore)}/100
        - Load time: ${(loadTime / 1000).toFixed(2)}s
        - Estimated First Contentful Paint: ${(estimatedFCP / 1000).toFixed(1)}s
        - Estimated Largest Contentful Paint: ${(estimatedLCP / 1000).toFixed(1)}s
        - Estimated Cumulative Layout Shift: ${estimatedCLS.toFixed(2)}
        - Estimated First Input Delay: ${estimatedFID}ms
        - Estimated Total Blocking Time: ${estimatedTBT}ms
        - Total resources: ${totalResourceCount} (${scriptCount} scripts, ${stylesheetCount} stylesheets, ${imageCount} images)
        - Render-blocking resources: ${renderBlockingStyles + renderBlockingScripts}
        - Unoptimized images: ${unoptimizedImages}
        - Main issues: ${renderBlockingStyles + renderBlockingScripts > 5 ? 'Render-blocking resources, ' : ''}${unoptimizedImages > 5 ? 'Unoptimized images, ' : ''}${totalResourceCount > 50 ? 'Excessive resource count, ' : ''}${loadTime > 2000 ? 'Slow load time' : 'None major'}`;
    } catch (error) {
      console.error("Error in performance audit tool:", error);
      return `Error analyzing performance for ${url}. Please check if the website is accessible and try again.`;
    }
  }
}

class MobileAuditTool extends Tool {
  name = "mobile_audit";
  description = "Analyzes mobile-friendliness of a website";

  constructor() {
    super();
  }

  async _call(url: string): Promise<string> {
    try {
      // Validate and normalize URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Fetch the website with a mobile user agent
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        },
        timeout: 10000, // 10 second timeout
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Check for viewport meta tag
      const viewportTag = $('meta[name="viewport"]').attr('content') || '';
      const hasViewport = viewportTag.includes('width=device-width');
      const hasInitialScale = viewportTag.includes('initial-scale=1');
      
      // Check tap target sizes (approximation)
      const smallTapTargets = $('a, button, [role="button"], input, select, textarea').filter((i, el) => {
        const width = $(el).attr('width');
        const height = $(el).attr('height');
        if (width && Number(width) < 44) return true;
        if (height && Number(height) < 44) return true;
        return false;
      }).length;
      
      // Check for mobile-specific elements
      const hasMobileNav = $('nav[role="navigation"], .mobile-nav, .mobile-menu, .hamburger, .navbar-toggle').length > 0;
      
      // Check for proper text sizing
      const hasFontSizeAdjust = $('html, body').filter((i, el) => {
        const fontSize = $(el).css('font-size');
        return fontSize && (fontSize.includes('px') || fontSize.includes('em') || fontSize.includes('rem'));
      }).length > 0;
      
      // Check if there might be horizontal scrolling issues
      const potentialScrollIssues = $('div, section, table').filter((i, el) => {
        const width = $(el).attr('width');
        return width && (width.includes('px') && Number(width.replace('px', '')) > 400);
      }).length > 0;
      
      // Check for media queries in inline styles
      const hasMediaQueries = $('style').text().includes('@media');
      
      // Use mobile-detect to get device info from the HTML
      const md = new MobileDetect(html);
      const isMobileOptimized = md.mobile() !== null;
      
      // Calculate mobile-friendliness score
      let mobileScore = 100;
      
      if (!hasViewport) mobileScore -= 30;
      if (!hasInitialScale) mobileScore -= 10;
      if (smallTapTargets > 10) mobileScore -= 20;
      else if (smallTapTargets > 5) mobileScore -= 10;
      if (!hasMobileNav) mobileScore -= 5;
      if (!hasFontSizeAdjust) mobileScore -= 5;
      if (potentialScrollIssues) mobileScore -= 15;
      if (!hasMediaQueries) mobileScore -= 15;
      if (!isMobileOptimized) mobileScore -= 20;
      
      // Ensure score is within 0-100 range
      mobileScore = Math.max(0, Math.min(100, mobileScore));
      
      return `Mobile-friendliness audit for ${url}:
        - Mobile-friendly score: ${Math.round(mobileScore)}/100
        - Viewport configured: ${hasViewport ? 'Yes' : 'No'}
        - Initial scale set: ${hasInitialScale ? 'Yes' : 'No'}
        - Potentially small tap targets: ${smallTapTargets} detected
        - Mobile navigation: ${hasMobileNav ? 'Present' : 'Not detected'}
        - Responsive text sizing: ${hasFontSizeAdjust ? 'Present' : 'Not detected'}
        - Potential horizontal scrolling issues: ${potentialScrollIssues ? 'Yes' : 'No'}
        - Media queries: ${hasMediaQueries ? 'Present' : 'Not detected in inline styles'}
        - Mobile-optimized: ${isMobileOptimized ? 'Yes' : 'Needs improvement'}
        - Overall assessment: ${
          mobileScore >= 90 ? 'Excellent' : 
          mobileScore >= 70 ? 'Good' : 
          mobileScore >= 50 ? 'Needs improvement' : 
          'Poor'
        }`;
    } catch (error) {
      console.error("Error in mobile audit tool:", error);
      return `Error analyzing mobile-friendliness for ${url}. Please check if the website is accessible and try again.`;
    }
  }
}

class SchemaMarkupTool extends Tool {
  name = "schema_markup";
  description = "Analyzes structured data and schema markup on a webpage";

  constructor() {
    super();
  }

  async _call(url: string): Promise<string> {
    try {
      // Validate and normalize URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Fetch the website
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOAgentBot/1.0; +http://seoagent.example.com)',
        },
        timeout: 10000, // 10 second timeout
      });
      
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Look for JSON-LD structured data
      const jsonldScripts = $('script[type="application/ld+json"]');
      const jsonldData = [];
      
      jsonldScripts.each((i, el) => {
        try {
          const data = JSON.parse($(el).html());
          jsonldData.push(data);
        } catch {
          // Invalid JSON, skip
        }
      });
      
      // Look for Microdata
      const microdataElements = $('[itemtype]');
      const microdataTypes = new Set();
      
      microdataElements.each((i, el) => {
        const itemtype = $(el).attr('itemtype') || '';
        if (itemtype.includes('schema.org')) {
          microdataTypes.add(itemtype.split('/').pop());
        }
      });
      
      // Look for RDFa
      const rdfaElements = $('[typeof]');
      const rdfaTypes = new Set();
      
      rdfaElements.each((i, el) => {
        const type = $(el).attr('typeof') || '';
        if (type.includes('schema.org')) {
          rdfaTypes.add(type.split(':').pop());
        }
      });
      
      // Analyze detected schema types
      const allSchemaTypes = new Set();
      
      // From JSON-LD
      jsonldData.forEach(data => {
        if (data['@type']) {
          if (Array.isArray(data['@type'])) {
            data['@type'].forEach(type => allSchemaTypes.add(type));
          } else {
            allSchemaTypes.add(data['@type']);
          }
        }
      });
      
      // From Microdata
      microdataTypes.forEach(type => allSchemaTypes.add(type));
      
      // From RDFa
      rdfaTypes.forEach(type => allSchemaTypes.add(type));
      
      // Count total schema markup instances
      const totalSchemaInstances = jsonldScripts.length + microdataElements.length + rdfaElements.length;
      
      // Identify schema format
      let primarySchemaFormat = 'None detected';
      if (jsonldScripts.length > 0) {
        primarySchemaFormat = 'JSON-LD';
      } else if (microdataElements.length > 0) {
        primarySchemaFormat = 'Microdata';
      } else if (rdfaElements.length > 0) {
        primarySchemaFormat = 'RDFa';
      }
      
      // Check for common schema properties
      let missingProperties = [];
      
      const commonSchemaTypes = {
        'Organization': ['name', 'url', 'logo'],
        'LocalBusiness': ['name', 'address', 'telephone'],
        'Product': ['name', 'image', 'description', 'offers'],
        'Article': ['headline', 'author', 'datePublished'],
        'Person': ['name', 'jobTitle'],
        'BreadcrumbList': ['itemListElement'],
        'WebPage': ['name', 'description']
      };
      
      Object.entries(commonSchemaTypes).forEach(([type, properties]) => {
        if (allSchemaTypes.has(type)) {
          properties.forEach(property => {
            let propertyFound = false;
            
            jsonldData.forEach(data => {
              if (data['@type'] === type && data[property]) {
                propertyFound = true;
              }
            });
            
            if (!propertyFound) {
              missingProperties.push(`${property} for ${type}`);
            }
          });
        }
      });
      
      return `Schema markup analysis for ${url}:
        - Schema types detected: ${Array.from(allSchemaTypes).join(', ') || 'None detected'}
        - Total schema instances: ${totalSchemaInstances}
        - Schema format: ${primarySchemaFormat}
        - JSON-LD instances: ${jsonldScripts.length}
        - Microdata instances: ${microdataElements.length}
        - RDFa instances: ${rdfaElements.length}
        - Missing recommended properties: ${missingProperties.length > 0 ? missingProperties.slice(0, 5).join(', ') : 'None detected'}
        - Rich snippet eligibility: ${
          allSchemaTypes.size > 0 ? 
          (missingProperties.length === 0 ? 'Likely eligible' : 'Partially eligible (missing properties)') : 
          'Not eligible (no schema detected)'
        }
        - Implementation location: ${
          jsonldScripts.length > 0 && 
          $('head script[type="application/ld+json"]').length === jsonldScripts.length ? 
          'Within <head> tag (recommended)' : 
          'Mixed or within <body> tag'
        }`;
    } catch (error) {
      console.error("Error in schema markup tool:", error);
      return `Error analyzing schema markup for ${url}. Please check if the website is accessible and try again.`;
    }
  }
}

// Create the Technical SEO Agent
export async function createTechnicalSeoAgent(model: BaseLanguageModel) {
  const tools = [
    new WebsiteStructureTool(),
    new PerformanceAuditTool(),
    new MobileAuditTool(),
    new SchemaMarkupTool(),
  ];

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "chat-conversational-react-description",
    verbose: true,
    agentArgs: {
      systemMessage: `You are an expert technical SEO specialist with deep knowledge of web technologies, search engine algorithms, and technical optimization strategies.
    
Your job is to perform in-depth technical SEO audits and provide sophisticated recommendations related to:
1. Website structure and information architecture
2. Page speed and Core Web Vitals
3. Mobile-friendliness
4. Schema markup and structured data
5. Crawlability and indexability

Important: You MUST use the tools to gather raw data first, then apply your expert analysis to provide insights that go well beyond what the tools directly measure.

For each technical area:
1. Call ALL the relevant tools to gather comprehensive data
2. Analyze patterns and relationships between different metrics
3. Identify root causes of technical issues, not just symptoms
4. Provide specific code examples or implementation details where appropriate
5. Prioritize issues based on estimated search impact
6. Explain technical concepts in accessible ways

Your analysis should:
- Identify both obvious and subtle technical SEO issues
- Explain the search engine impact of each issue
- Provide detailed, step-by-step implementation instructions
- Consider the competitive landscape and industry best practices
- Prioritize recommendations by impact difficulty
- Connect technical issues to business metrics like visibility, traffic, and conversions

Remember that your goal is to provide actionable expertise that significantly improves the website's technical foundation for search visibility.`
    }
  });

  return executor;
}

export type TechnicalSeoResult = {
  overallScore: number;
  structureScore: number;
  performanceScore: number;
  mobileScore: number;
  schemaScore: number;
  criticalIssues: {
    category: string;
    issue: string;
    impact: string;
    recommendation: string;
  }[];
  improvements: {
    category: string;
    recommendation: string;
    priority: string;
    effort: string;
  }[];
};

// Function to format the raw agent output into a structured result
export function formatTechnicalSeoResults(rawOutput: string): TechnicalSeoResult {
  // Extract scores from the output with enhanced regex patterns
  
  // Performance score
  const performanceRegexes = [
    /Performance score:?\s*(\d+)\/100/i,
    /Performance rating:?\s*(\d+)\/100/i,
    /Performance:?\s*(\d+)\/100/i,
    /Performance:?\s*(\d+) out of 100/i,
    /Performance score of (\d+)/i
  ];
  
  let performanceScore = 65; // Default value
  for (const regex of performanceRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      performanceScore = parseInt(match[1]);
      break;
    }
  }
  
  // Mobile score
  const mobileRegexes = [
    /Mobile-friendly score:?\s*(\d+)\/100/i,
    /Mobile score:?\s*(\d+)\/100/i,
    /Mobile:?\s*(\d+)\/100/i,
    /Mobile-friendliness:?\s*(\d+)\/100/i,
    /Mobile optimization score:?\s*(\d+)/i
  ];
  
  let mobileScore = 70; // Default value
  for (const regex of mobileRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      mobileScore = parseInt(match[1]);
      break;
    }
  }
  
  // Structure score - analyze with more signals from the text
  let structureScore = 70; // Start with a more neutral default
  
  // Check for positive structure signals
  const structureSignals = [
    { pattern: /Clean, semantic URLs/i, points: 10 },
    { pattern: /Breadcrumb navigation: Present/i, points: 5 },
    { pattern: /H1 headings: 1 detected/i, points: 5 },
    { pattern: /Canonical URL: Present/i, points: 5 },
    { pattern: /Sitemap: Referenced/i, points: 5 },
    { pattern: /Robots.txt: Present/i, points: 5 },
    { pattern: /Information architecture:.*?good/i, points: 10 },
    { pattern: /Internal links:.*?found/i, points: 5 },
    { pattern: /URL structure:.*?clean/i, points: 10 },
    { pattern: /Site navigation: Present/i, points: 5 }
  ];
  
  // Check for negative structure signals
  const negativeStructureSignals = [
    { pattern: /H1 headings: 0 detected/i, points: -10 },
    { pattern: /H1 headings:.*?Too many/i, points: -5 },
    { pattern: /Canonical URL: Missing/i, points: -10 },
    { pattern: /Robots.txt: Not found/i, points: -5 },
    { pattern: /Sitemap: Not detected/i, points: -5 },
    { pattern: /duplicate content issues/i, points: -10 },
    { pattern: /URLs contain undesirable elements/i, points: -10 },
    { pattern: /Site navigation: Not clearly defined/i, points: -5 }
  ];
  
  // Apply all positive and negative signals
  for (const signal of structureSignals) {
    if (signal.pattern.test(rawOutput)) {
      structureScore += signal.points;
    }
  }
  
  for (const signal of negativeStructureSignals) {
    if (signal.pattern.test(rawOutput)) {
      structureScore += signal.points; // Points are already negative
    }
  }
  
  // Ensure structure score is between 0-100
  structureScore = Math.max(0, Math.min(100, structureScore));
  
  // Schema score with enhanced detection
  const schemaRegexes = [
    /Schema score:?\s*(\d+)\/100/i,
    /Structured data score:?\s*(\d+)\/100/i,
    /Schema markup rating:?\s*(\d+)/i
  ];
  
  // Try to find direct score first
  let schemaScore = -1;
  for (const regex of schemaRegexes) {
    const match = rawOutput.match(regex);
    if (match && match[1]) {
      schemaScore = parseInt(match[1]);
      break;
    }
  }
  
  // If no direct score, calculate based on signals
  if (schemaScore === -1) {
    schemaScore = 50; // Default value
    
    // Analyze schema quality
    if (rawOutput.includes("Likely eligible")) {
      schemaScore = 90;
    } else if (rawOutput.includes("Partially eligible")) {
      schemaScore = 70;
    } else if (rawOutput.includes("Schema types detected") && !rawOutput.includes("None detected")) {
      schemaScore = 60;
    } else if (rawOutput.includes("Schema types detected: None detected") || rawOutput.includes("No schema detected")) {
      schemaScore = 30;
    }
    
    // Additional schema quality signals
    if (rawOutput.includes("JSON-LD instances:") && !rawOutput.includes("JSON-LD instances: 0")) {
      schemaScore += 10;
    }
    
    if (rawOutput.includes("Within <head> tag (recommended)")) {
      schemaScore += 5;
    }
    
    if (rawOutput.includes("Missing recommended properties")) {
      schemaScore -= 15;
    }
    
    // Ensure schema score is between 0-100
    schemaScore = Math.max(0, Math.min(100, schemaScore));
  }
  
  // Overall score - weighted average with slight adjustment to prioritize performance more
  const overallScore = Math.round((performanceScore * 0.4) + (mobileScore * 0.25) + 
                                 (structureScore * 0.2) + (schemaScore * 0.15));
  
  // Extract critical issues by analyzing the output more thoroughly
  const criticalIssues = [];
  
  // Direct issue extraction
  const issueRegexes = [
    /critical issue:?\s*(.*?)(\n|$)/i,
    /major problem:?\s*(.*?)(\n|$)/i,
    /significant issue:?\s*(.*?)(\n|$)/i,
    /high priority:?\s*(.*?)(\n|$)/i,
    /urgent fix:?\s*(.*?)(\n|$)/i
  ];
  
  // Try to find directly mentioned issues
  for (const regex of issueRegexes) {
    let startPos = 0;
    let match;
    
    while ((match = rawOutput.substring(startPos).match(regex)) !== null) {
      const fullMatch = match[0];
      const issue = match[1].trim();
      
      if (issue.length > 15) { // Only meaningful issues
        // Try to determine the category
        let category = "Structure";
        if (/performance|speed|load time|core web vitals|lcp|fid|cls|render|resource/i.test(issue)) {
          category = "Performance";
        } else if (/mobile|viewport|tap target|screen size|responsive/i.test(issue)) {
          category = "Mobile";
        } else if (/schema|structured data|markup|json-ld|microdata|rich result/i.test(issue)) {
          category = "Schema";
        } else if (/structure|url|h1|canonical|sitemap|robot|navigation|internal link/i.test(issue)) {
          category = "Structure";
        }
        
        // Try to determine impact 
        let impact = "Reduces search visibility and user experience";
        if (/conversion|bounce|engagement|revenue|ranking|traffic/i.test(issue)) {
          impact = "Directly impacts conversions and search rankings";
        } else if (/user experience|usability|accessibility/i.test(issue)) {
          impact = "Degrades user experience and engagement metrics";
        } else if (/crawl|index|bot|spider/i.test(issue)) {
          impact = "Hinders search engine crawling and indexation";
        }
        
        // Try to extract recommendation if included
        let recommendation = "Fix the issue according to technical SEO best practices";
        const recMatch = issue.match(/(should|could|recommend|fix by|implement|add|use|change|improve) (.*?)(\.|$)/i);
        if (recMatch && recMatch[2]) {
          recommendation = recMatch[2].trim();
          // Capitalize first letter if needed
          recommendation = recommendation.charAt(0).toUpperCase() + recommendation.slice(1);
          // Add period if needed
          if (!recommendation.endsWith('.')) recommendation += '.';
        }
        
        criticalIssues.push({
          category,
          issue: issue.split(/\.|;/)[0].trim(), // Take just the first sentence
          impact,
          recommendation
        });
      }
      
      // Move past this match to find the next one
      startPos += match.index + fullMatch.length;
      
      // Limit to 5 issues to avoid overloading
      if (criticalIssues.length >= 5) break;
    }
    
    // If we found enough issues, stop checking other patterns
    if (criticalIssues.length >= 5) break;
  }
  
  // Fallback issue extraction based on specific checks
  if (criticalIssues.length < 3) {
    // Performance fallback issues
    if (performanceScore < 70) {
      // Check for specific performance issues
      if (rawOutput.includes("Render-blocking resources")) {
        criticalIssues.push({
          category: "Performance",
          issue: "Render-blocking resources detected",
          impact: "Slows down page rendering and initial content display",
          recommendation: "Defer non-critical JavaScript and CSS resources"
        });
      }
      
      if (rawOutput.includes("Unoptimized images")) {
        criticalIssues.push({
          category: "Performance",
          issue: "Unoptimized images",
          impact: "Increases page load time and bandwidth usage",
          recommendation: "Optimize images and implement lazy loading"
        });
      }
      
      const lcpMatch = rawOutput.match(/Estimated Largest Contentful Paint:?\s*([\d.]+)s/i);
      if (lcpMatch && parseFloat(lcpMatch[1]) > 2.5) {
        criticalIssues.push({
          category: "Performance",
          issue: "High Largest Contentful Paint (LCP)",
          impact: "Negatively affects Core Web Vitals and user experience",
          recommendation: "Optimize the largest element (usually hero image) and improve server response time"
        });
      }
    }
    
    // Mobile fallback issues
    if (mobileScore < 70) {
      if (rawOutput.includes("Viewport configured: No")) {
        criticalIssues.push({
          category: "Mobile",
          issue: "Missing viewport meta tag",
          impact: "Page won't scale properly on mobile devices",
          recommendation: "Add a viewport meta tag with width=device-width, initial-scale=1"
        });
      }
      
      const tapTargetsMatch = rawOutput.match(/small tap targets:?\s*(\d+)/i);
      if (tapTargetsMatch && parseInt(tapTargetsMatch[1]) > 5) {
        criticalIssues.push({
          category: "Mobile",
          issue: "Small tap targets",
          impact: "Difficult for users to tap elements on mobile devices",
          recommendation: "Increase size of buttons and interactive elements to at least 44px"
        });
      }
      
      if (rawOutput.includes("Potential horizontal scrolling issues: Yes")) {
        criticalIssues.push({
          category: "Mobile",
          issue: "Horizontal scrolling issues",
          impact: "Poor user experience on mobile devices",
          recommendation: "Implement responsive design with relative width units and proper viewport"
        });
      }
    }
    
    // Structure fallback issues
    if (rawOutput.includes("H1 headings: 0 detected")) {
      criticalIssues.push({
        category: "Structure",
        issue: "Missing H1 heading",
        impact: "Reduces content hierarchy clarity for users and search engines",
        recommendation: "Add a single H1 heading that includes the main keyword"
      });
    }
    
    if (rawOutput.includes("URL parameters may cause duplicate content")) {
      criticalIssues.push({
        category: "Structure",
        issue: "Potential duplicate content",
        impact: "Search engines may index multiple versions of the same page",
        recommendation: "Implement canonical tags or fix URL parameters"
      });
    }
    
    if (rawOutput.includes("Canonical URL: Missing")) {
      criticalIssues.push({
        category: "Structure",
        issue: "Missing canonical URL",
        impact: "May cause duplicate content issues with similar pages",
        recommendation: "Add canonical tags to indicate the preferred version of the page"
      });
    }
    
    // Schema fallback issues
    if (rawOutput.includes("Schema types detected: None detected")) {
      criticalIssues.push({
        category: "Schema",
        issue: "Missing structured data",
        impact: "No rich results in search engines",
        recommendation: "Implement JSON-LD structured data for your content type"
      });
    } else if (rawOutput.includes("Missing recommended properties:")) {
      criticalIssues.push({
        category: "Schema",
        issue: "Incomplete schema markup",
        impact: "May not qualify for rich results in search engines",
        recommendation: "Add missing recommended properties to schema markup"
      });
    }
  }
  
  // Extract recommended improvements 
  const directImprovements: {category: string, recommendation: string, priority: string, effort: string}[] = [];
  
  // Direct improvement extraction
  const improvementRegexes = [
    /recommend(?:ation|ed):?\s*(.*?)(\n|$)/i,
    /suggest(?:ion|ed):?\s*(.*?)(\n|$)/i,
    /improve(?:ment)?:?\s*(.*?)(\n|$)/i,
    /fix:?\s*(.*?)(\n|$)/i,
    /optimization:?\s*(.*?)(\n|$)/i
  ];
  
  // Try to find directly mentioned improvements
  for (const regex of improvementRegexes) {
    let startPos = 0;
    let match;
    
    while ((match = rawOutput.substring(startPos).match(regex)) !== null) {
      const fullMatch = match[0];
      const improvement = match[1].trim();
      
      if (improvement.length > 20) { // Only meaningful improvements
        // Try to determine the category
        let category = "Structure";
        if (/performance|speed|load time|core web vitals|lcp|fid|cls|render|resource|cache|compress/i.test(improvement)) {
          category = "Performance";
        } else if (/mobile|viewport|tap target|screen size|responsive/i.test(improvement)) {
          category = "Mobile";
        } else if (/schema|structured data|markup|json-ld|microdata|rich result/i.test(improvement)) {
          category = "Schema";
        } else if (/structure|url|h1|canonical|sitemap|robot|navigation|internal link/i.test(improvement)) {
          category = "Structure";
        }
        
        // Try to determine priority
        let priority = "Medium";
        if (/urgent|critical|important|high|essential|must|significant/i.test(improvement)) {
          priority = "High";
        } else if (/consider|might|could|option|low|minor/i.test(improvement)) {
          priority = "Low";
        }
        
        // Try to determine effort
        let effort = "Medium";
        if (/simple|easy|quick|straightforward|minor|fast/i.test(improvement)) {
          effort = "Low";
        } else if (/complex|difficult|major|extensive|significant|time-consuming/i.test(improvement)) {
          effort = "High";
        }
        
        directImprovements.push({
          category,
          recommendation: improvement.split(/\.|;/)[0].trim() + '.',
          priority,
          effort
        });
      }
      
      // Move past this match to find the next one
      startPos += match.index + fullMatch.length;
      
      // Limit to 7 improvements to avoid overloading
      if (directImprovements.length >= 7) break;
    }
    
    // If we found enough improvements, stop checking other patterns
    if (directImprovements.length >= 7) break;
  }
  
  // Fallback improvements if we didn't find enough direct ones
  const fallbackImprovements = [];
  
  // Performance improvements
  if (performanceScore < 90) {
    if (rawOutput.includes("Render-blocking resources")) {
      fallbackImprovements.push({
        category: "Performance",
        recommendation: "Eliminate render-blocking resources by deferring non-critical CSS/JS",
        priority: "High",
        effort: "Medium"
      });
    }
    
    if (rawOutput.includes("Unoptimized images")) {
      fallbackImprovements.push({
        category: "Performance",
        recommendation: "Optimize images and implement lazy loading",
        priority: "Medium",
        effort: "Low"
      });
    }
    
    // Check for LCP issues
    const lcpMatch = rawOutput.match(/Estimated Largest Contentful Paint:?\s*([\d.]+)s/i);
    if (lcpMatch && parseFloat(lcpMatch[1]) > 2.5) {
      fallbackImprovements.push({
        category: "Performance",
        recommendation: "Optimize Largest Contentful Paint by improving server response time and resource loading",
        priority: "High",
        effort: "Medium"
      });
    }
    
    // Check for excess resources
    if (rawOutput.includes("Total resources:")) {
      fallbackImprovements.push({
        category: "Performance",
        recommendation: "Reduce the number of resource requests by combining files and eliminating unnecessary scripts",
        priority: "Medium",
        effort: "Medium"
      });
    }
  }
  
  // Mobile improvements
  if (mobileScore < 90) {
    if (rawOutput.includes("small tap targets")) {
      fallbackImprovements.push({
        category: "Mobile",
        recommendation: "Increase size of tap targets for better mobile usability",
        priority: "Medium",
        effort: "Low"
      });
    }
    
    if (rawOutput.includes("Potential horizontal scrolling issues: Yes")) {
      fallbackImprovements.push({
        category: "Mobile",
        recommendation: "Fix horizontal scrolling issues with responsive design",
        priority: "High",
        effort: "Medium"
      });
    }
    
    if (rawOutput.includes("Media queries: Not detected")) {
      fallbackImprovements.push({
        category: "Mobile",
        recommendation: "Implement media queries for responsive design across all devices",
        priority: "High",
        effort: "Medium"
      });
    }
  }
  
  // Structure improvements
  if (!rawOutput.includes("Sitemap: Referenced in robots.txt")) {
    fallbackImprovements.push({
      category: "Structure",
      recommendation: "Add XML sitemap and reference it in robots.txt",
      priority: "Medium",
      effort: "Low"
    });
  }
  
  if (!rawOutput.includes("Canonical URL: Present")) {
    fallbackImprovements.push({
      category: "Structure",
      recommendation: "Add canonical tags to prevent duplicate content issues",
      priority: "Medium",
      effort: "Low"
    });
  }
  
  if (rawOutput.includes("H1 headings: 0 detected") || rawOutput.includes("H1 headings: Missing")) {
    fallbackImprovements.push({
      category: "Structure",
      recommendation: "Add a single, descriptive H1 heading that includes the primary keyword",
      priority: "High",
      effort: "Low"
    });
  }
  
  // Schema improvements
  if (rawOutput.includes("Schema types detected: None detected")) {
    fallbackImprovements.push({
      category: "Schema",
      recommendation: "Implement JSON-LD structured data markup relevant to your content type",
      priority: "Medium",
      effort: "Medium"
    });
  } else if (rawOutput.includes("Missing recommended properties:")) {
    const missingProps = rawOutput.match(/Missing recommended properties:?\s*(.*?)(\n|$)/i);
    if (missingProps && missingProps[1]) {
      fallbackImprovements.push({
        category: "Schema",
        recommendation: `Add missing schema properties: ${missingProps[1].substring(0, 40)}...`,
        priority: "Medium",
        effort: "Low"
      });
    }
  } else if (!rawOutput.includes("JSON-LD") && schemaScore < 80) {
    fallbackImprovements.push({
      category: "Schema",
      recommendation: "Convert existing schema markup to JSON-LD format for better compatibility",
      priority: "Low",
      effort: "Medium"
    });
  }
  
  // Combine direct and fallback improvements, prioritizing direct ones
  const improvements = directImprovements.length >= 4 ? 
    directImprovements : 
    [...directImprovements, ...fallbackImprovements];
  
  // Remove duplicates based on similar recommendations
  const uniqueImprovements = improvements.reduce((acc, current) => {
    const isDuplicate = acc.some(item => 
      item.category === current.category && 
      (item.recommendation.toLowerCase().includes(current.recommendation.toLowerCase().substring(0, 20)) ||
       current.recommendation.toLowerCase().includes(item.recommendation.toLowerCase().substring(0, 20)))
    );
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof improvements);
  
  return {
    overallScore,
    structureScore,
    performanceScore,
    mobileScore,
    schemaScore,
    criticalIssues: criticalIssues.slice(0, 3), // Top 3 critical issues
    improvements: uniqueImprovements.slice(0, 5) // Top 5 improvements
  };
}