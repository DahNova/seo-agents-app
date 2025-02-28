import React, { useState } from 'react';
import { Heading, Text, Flex, Grid } from '@radix-ui/themes';
import TechnicalSeoForm from '../components/TechnicalSeoForm';
import TechnicalSeoResults from '../components/TechnicalSeoResults';
import { TechnicalSeoResult } from '../agents';
import { useAgentService } from '../hooks/useAgentService';

const TechnicalSeoPage: React.FC = () => {
  const { agentService } = useAgentService();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TechnicalSeoResult | null>(null);

  const handleAnalyze = async (input: { url: string }) => {
    setIsLoading(true);
    try {
      const analysisResult = await agentService.runTechnicalSeoAudit(input);
      setResult(analysisResult);
    } catch (error) {
      console.error('Error analyzing website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" gap="2">
        <Heading size="6">Technical SEO Audit</Heading>
        <Text size="2" color="gray">
          Analyze website structure, speed, mobile-friendliness, and schema markup for better performance.
        </Text>
      </Flex>

      <Grid columns={{ initial: '1', sm: result ? '1' : '1' }} gap="4">
        <TechnicalSeoForm onAnalyze={handleAnalyze} isLoading={isLoading} />
      </Grid>

      {result && <TechnicalSeoResults result={result} />}

      {!result && (
        <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
          <Text size="2" weight="bold">How to use this tool:</Text>
          <Text size="2">1. Enter the URL of the website you want to analyze</Text>
          <Text size="2">2. Click "Analyze Website" to start the technical audit</Text>
          <Text size="2">3. Review the overall score and breakdown by category</Text>
          <Text size="2">4. Address critical issues with the highest priority</Text>
          <Text size="2">5. Implement recommended improvements based on priority and effort</Text>
        </Flex>
      )}
    </Flex>
  );
};

export default TechnicalSeoPage;