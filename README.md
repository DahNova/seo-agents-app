# SEO Agents App

An AI-powered SEO toolkit featuring specialized agents for keyword research, content optimization, and technical SEO analysis.

## Features

- **Keyword Research Agent:** Analyzes search trends, competition, and relevance to identify high-value keywords
- **Content Optimization Agent:** Evaluates existing content and suggests improvements for readability, keyword usage, and semantic relevance
- **Technical SEO Agent:** Audits website structure, speed, mobile-friendliness, and schema markup

## Tech Stack

- **Frontend:** React with TypeScript
- **UI Components:** Radix UI
- **Routing:** React Router
- **Charts:** Recharts
- **AI Framework:** LangChain with Google's Gemini API
- **Build Tool:** Vite

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- NPM or Yarn
- Google Gemini API key (included in the app by default)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/seo-agents-app.git
cd seo-agents-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. The app comes preconfigured with a Gemini API key, but you can set your own in the `.env` file:
```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_MODEL_NAME=gemini-2.0-flash
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
seo-agents-app/
├── public/           # Static assets
├── src/
│   ├── agents/       # LangChain agent implementations
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── styles/       # Global styles
│   ├── App.tsx       # Main app component
│   └── main.tsx      # Entry point
├── .env              # Environment variables (create this file)
├── index.html        # HTML template
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite configuration
```

## Usage

### Keyword Research

1. Navigate to the Keyword Research page
2. Enter a keyword to analyze and your business/website
3. Review search volume, competition, and relevance metrics
4. Use the recommendations to inform your SEO strategy

### Content Optimization

1. Navigate to the Content Optimization page
2. Enter your target keyword and content topic
3. Paste the content you want to optimize
4. Review readability, keyword usage, and semantic scores
5. Implement the suggested improvements

### Technical SEO Audit

1. Navigate to the Technical SEO page
2. Enter the URL of the website you want to analyze
3. Review overall score and breakdown by category
4. Address critical issues with the highest priority
5. Implement recommended improvements based on priority and effort

## Notes for Production Use

- This application uses mock implementations for the agent tools. In a production environment, you would connect these to real data sources like:
  - Google Search Console / Google Analytics API
  - SEO tools APIs (Ahrefs, SEMrush, etc.)
  - Web scrapers
  - Performance measurement tools (Lighthouse API)

- The LangChain agents would need proper error handling and rate limiting for production use

- For improved performance, consider implementing:
  - Server-side rendering
  - API result caching
  - Background processing for longer analyses

## License

MIT

## Acknowledgements

- [LangChain](https://github.com/hwchase17/langchain)
- [Google Gemini API](https://ai.google.dev/)
- [Radix UI](https://www.radix-ui.com/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)