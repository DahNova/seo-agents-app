import React, { useState } from 'react';
import { Button, TextField, TextArea, Card, Flex, Text, Box } from '@radix-ui/themes';
import { ContentOptimizationResult } from '../agents';

interface ContentOptimizationFormProps {
  onAnalyze: (input: { content: string; keyword: string; topic: string }) => Promise<ContentOptimizationResult>;
  isLoading: boolean;
}

const ContentOptimizationForm: React.FC<ContentOptimizationFormProps> = ({ onAnalyze, isLoading }) => {
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter content to analyze');
      return;
    }

    if (!keyword.trim()) {
      setError('Please enter a target keyword');
      return;
    }

    if (!topic.trim()) {
      setError('Please enter the content topic');
      return;
    }

    try {
      await onAnalyze({ content, keyword, topic });
    } catch (err) {
      setError('An error occurred while analyzing the content');
      console.error(err);
    }
  };

  return (
    <Card size="2">
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Text size="2" weight="bold">Content Optimization</Text>
          <Text size="2" color="gray">
            Evaluate and improve your content for better readability, keyword usage, and semantic relevance.
          </Text>
          
          <TextField.Root>
            <TextField.Input 
              placeholder="Target keyword" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </TextField.Root>

          <TextField.Root>
            <TextField.Input 
              placeholder="Content topic" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </TextField.Root>

          <TextArea 
            placeholder="Paste your content here to analyze"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />

          {error && (
            <Text size="2" color="red">
              {error}
            </Text>
          )}

          <Box>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Analyze Content'}
            </Button>
          </Box>
        </Flex>
      </form>
    </Card>
  );
};

export default ContentOptimizationForm;