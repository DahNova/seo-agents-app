import React, { useState } from 'react';
import { Heading, Text, Flex, Grid } from '@radix-ui/themes';
import KeywordResearchForm from '../components/KeywordResearchForm';
import KeywordResults from '../components/KeywordResults';
import { KeywordAnalysisResult } from '../agents';
import { useAgentService } from '../hooks/useAgentService';

const KeywordResearchPage: React.FC = () => {
  const { agentService } = useAgentService();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<KeywordAnalysisResult | null>(null);

  const handleAnalyze = async (input: { keyword: string; business: string }) => {
    setIsLoading(true);
    try {
      const analysisResult = await agentService.runKeywordResearch(input);
      setResult(analysisResult);
    } catch (error) {
      console.error('Error analyzing keyword:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" gap="2">
        <Heading size="6">Keyword Research</Heading>
        <Text size="2" color="gray">
          Analyze keywords to identify high-value opportunities based on search volume, competition, and relevance.
        </Text>
      </Flex>

      <Grid columns={{ initial: '1', sm: '2' }} gap="4">
        <KeywordResearchForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        {result && <KeywordResults result={result} />}
      </Grid>

      {!result && (
        <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
          <Text size="2" weight="bold">How to use this tool:</Text>
          <Text size="2">1. Enter a keyword you want to analyze</Text>
          <Text size="2">2. Specify your business or website for relevance analysis</Text>
          <Text size="2">3. Click "Analyze Keyword" to get comprehensive insights</Text>
          <Text size="2">4. Review search volume, competition, and recommendations</Text>
        </Flex>
      )}
    </Flex>
  );
};

export default KeywordResearchPage;