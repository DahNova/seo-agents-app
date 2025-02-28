import React, { useState } from 'react';
import { Button, TextField, Card, Flex, Text, Box } from '@radix-ui/themes';
import { KeywordAnalysisResult } from '../agents';

interface KeywordResearchFormProps {
  onAnalyze: (input: { keyword: string; business: string }) => Promise<KeywordAnalysisResult>;
  isLoading: boolean;
}

const KeywordResearchForm: React.FC<KeywordResearchFormProps> = ({ onAnalyze, isLoading }) => {
  const [keyword, setKeyword] = useState('');
  const [business, setBusiness] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!keyword.trim()) {
      setError('Please enter a keyword to analyze');
      return;
    }

    if (!business.trim()) {
      setError('Please enter your business or website');
      return;
    }

    try {
      await onAnalyze({ keyword, business });
    } catch (err) {
      setError('An error occurred while analyzing the keyword');
      console.error(err);
    }
  };

  return (
    <Card size="2">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Text size="2" weight="bold">Keyword Research</Text>
          <Text size="2" color="gray">
            Discover high-value keywords based on search volume, competition, and relevance to your business.
          </Text>
          
          <TextField.Root>
            <TextField.Input 
              placeholder="Enter keyword to analyze" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </TextField.Root>

          <TextField.Root>
            <TextField.Input 
              placeholder="Your business or website" 
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
            />
          </TextField.Root>

          {error && (
            <Text size="2" color="red">
              {error}
            </Text>
          )}

          <Box>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Keyword'}
            </Button>
          </Box>
        </Flex>
      </form>
    </Card>
  );
};

export default KeywordResearchForm;