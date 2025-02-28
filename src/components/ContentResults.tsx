import React from 'react';
import { Card, Flex, Text, Badge, Separator, Box, Table } from '@radix-ui/themes';
import { ContentOptimizationResult } from '../agents';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ContentResultsProps {
  result: ContentOptimizationResult | null;
}

const ContentResults: React.FC<ContentResultsProps> = ({ result }) => {
  if (!result) return null;

  const chartData = [
    { name: 'Readability', value: result.readabilityScore },
    { name: 'Keyword Usage', value: result.keywordScore },
    { name: 'Semantic', value: result.semanticScore },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const getPriorityColor = (priority: string) => {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes('high')) return 'red';
    if (lowerPriority.includes('medium')) return 'yellow';
    if (lowerPriority.includes('low')) return 'green';
    return 'gray';
  };

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold">Content Analysis</Text>
          <Badge color={result.contentScore >= 80 ? 'green' : result.contentScore >= 60 ? 'yellow' : 'red'}>
            Score: {result.contentScore}/100
          </Badge>
        </Flex>

        <Separator size="4" />

        <Flex wrap="wrap" gap="4">
          <Box width={{ initial: '100%', sm: '48%' }}>
            <Text size="2" weight="bold">Score Breakdown</Text>
            <Flex direction="column" gap="2" mt="2">
              <Flex justify="between">
                <Text size="2" color="gray">Readability:</Text>
                <Text size="2">{result.readabilityScore}/100</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Keyword Usage:</Text>
                <Text size="2">{result.keywordScore}/100</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Semantic Relevance:</Text>
                <Text size="2">{result.semanticScore}/100</Text>
              </Flex>
            </Flex>
          </Box>

          <Box width={{ initial: '100%', sm: '48%' }} style={{ height: '200px' }}>
            <Text size="2" weight="bold">Score Distribution</Text>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Flex>

        <Box mt="2">
          <Text size="2" weight="bold">Improvement Recommendations</Text>
          <Table.Root variant="surface" mt="2">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Priority</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Suggestion</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {result.recommendations.map((rec, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <Badge color={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{rec.category}</Table.Cell>
                  <Table.Cell>{rec.suggestion}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {result.missingSubtopics.length > 0 && (
          <Box mt="2">
            <Text size="2" weight="bold">Missing Subtopics</Text>
            <Flex gap="2" wrap="wrap" mt="1">
              {result.missingSubtopics.map((topic, index) => (
                <Badge key={index} variant="surface">
                  {topic}
                </Badge>
              ))}
            </Flex>
          </Box>
        )}

        {result.improvedTitle && (
          <Box mt="2">
            <Text size="2" weight="bold">Improved Title</Text>
            <Text size="2" mt="1">{result.improvedTitle}</Text>
          </Box>
        )}

        {result.improvedMetaDescription && (
          <Box mt="2">
            <Text size="2" weight="bold">Improved Meta Description</Text>
            <Text size="2" mt="1">{result.improvedMetaDescription}</Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
};

export default ContentResults;