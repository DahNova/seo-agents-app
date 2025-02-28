import React from 'react';
import { Card, Flex, Text, Badge, Separator, Box } from '@radix-ui/themes';
import { KeywordAnalysisResult } from '../agents';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface KeywordResultsProps {
  result: KeywordAnalysisResult | null;
}

const KeywordResults: React.FC<KeywordResultsProps> = ({ result }) => {
  if (!result) return null;

  const chartData = [
    { name: 'Search Volume', value: result.searchVolume / 1000 },
    { name: 'Relevance', value: result.relevanceScore },
    { name: 'Difficulty', value: result.difficulty },
  ];

  const getBadgeColor = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('high')) return 'green';
    if (lowerLevel.includes('medium')) return 'yellow';
    if (lowerLevel.includes('low')) return 'red';
    return 'gray';
  };

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold">{result.keyword}</Text>
          <Badge color={getBadgeColor(result.commercialIntent)}>
            {result.commercialIntent} Intent
          </Badge>
        </Flex>

        <Separator size="4" />

        <Flex wrap="wrap" gap="4">
          <Box width={{ initial: '100%', sm: '48%' }}>
            <Text size="2" weight="bold">Overview</Text>
            <Flex direction="column" gap="2" mt="2">
              <Flex justify="between">
                <Text size="2" color="gray">Search Volume:</Text>
                <Text size="2">{result.searchVolume.toLocaleString()}</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Trend:</Text>
                <Text size="2">{result.trend}</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Competition:</Text>
                <Text size="2">{result.competitionLevel}</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Relevance Score:</Text>
                <Text size="2">{result.relevanceScore}/10</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Difficulty:</Text>
                <Text size="2">{result.difficulty}/10</Text>
              </Flex>
            </Flex>
          </Box>

          <Box width={{ initial: '100%', sm: '48%' }} style={{ height: '200px' }}>
            <Text size="2" weight="bold">Metrics</Text>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#845EF7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Flex>

        <Box mt="2">
          <Text size="2" weight="bold">Recommendation</Text>
          <Text size="2" mt="1">{result.recommendation}</Text>
        </Box>

        <Box mt="2">
          <Text size="2" weight="bold">Related Keywords</Text>
          <Flex gap="2" wrap="wrap" mt="1">
            {result.relatedKeywords.map((keyword, index) => (
              <Badge key={index} variant="surface">
                {keyword}
              </Badge>
            ))}
          </Flex>
        </Box>
      </Flex>
    </Card>
  );
};

export default KeywordResults;