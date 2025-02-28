import React, { useState } from 'react';
import { Heading, Text, Flex, Grid } from '@radix-ui/themes';
import ContentOptimizationForm from '../components/ContentOptimizationForm';
import ContentResults from '../components/ContentResults';
import { ContentOptimizationResult } from '../agents';
import { useAgentService } from '../hooks/useAgentService';

const ContentOptimizationPage: React.FC = () => {
  const { agentService } = useAgentService();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ContentOptimizationResult | null>(null);

  const handleAnalyze = async (input: { content: string; keyword: string; topic: string }) => {
    setIsLoading(true);
    try {
      const analysisResult = await agentService.runContentOptimization(input);
      setResult(analysisResult);
    } catch (error) {
      console.error('Error analyzing content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" gap="2">
        <Heading size="6">Content Optimization</Heading>
        <Text size="2" color="gray">
          Evaluate and improve your content for better readability, keyword usage, and semantic relevance.
        </Text>
      </Flex>

      <Grid columns={{ initial: '1', md: result ? '2' : '1' }} gap="4">
        <ContentOptimizationForm onAnalyze={handleAnalyze} isLoading={isLoading} />
        {result && <ContentResults result={result} />}
      </Grid>

      {!result && (
        <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
          <Text size="2" weight="bold">How to use this tool:</Text>
          <Text size="2">1. Enter your target keyword and content topic</Text>
          <Text size="2">2. Paste the content you want to optimize</Text>
          <Text size="2">3. Click "Analyze Content" to get optimization recommendations</Text>
          <Text size="2">4. Review scores and implement suggested improvements</Text>
          <Text size="2">5. Get improved title and meta description suggestions</Text>
        </Flex>
      )}
    </Flex>
  );
};

export default ContentOptimizationPage;