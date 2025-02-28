import React, { useState } from 'react';
import { Button, TextField, Card, Flex, Text, Box } from '@radix-ui/themes';
import { TechnicalSeoResult } from '../agents';

interface TechnicalSeoFormProps {
  onAnalyze: (input: { url: string }) => Promise<TechnicalSeoResult>;
  isLoading: boolean;
}

const TechnicalSeoForm: React.FC<TechnicalSeoFormProps> = ({ onAnalyze, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    // Simple URL validation - allow URLs without protocol
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = 'https://' + url;
    }
    
    try {
      new URL(formattedUrl);
    } catch (e) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      await onAnalyze({ url: formattedUrl });
    } catch (err) {
      setError('An error occurred while analyzing the website');
      console.error(err);
    }
  };

  return (
    <Card size="2">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Text size="2" weight="bold">Technical SEO Audit</Text>
          <Text size="2" color="gray">
            Analyze website structure, performance, mobile-friendliness, and schema markup.
          </Text>
          
          <TextField.Root>
            <TextField.Input 
              placeholder="Enter website URL (e.g., https://example.com)" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </TextField.Root>

          {error && (
            <Text size="2" color="red">
              {error}
            </Text>
          )}

          <Box>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Website'}
            </Button>
          </Box>
        </Flex>
      </form>
    </Card>
  );
};

export default TechnicalSeoForm;