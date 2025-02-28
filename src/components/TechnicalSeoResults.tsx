import React from 'react';
import { Card, Flex, Text, Badge, Separator, Box, Table } from '@radix-ui/themes';
import { TechnicalSeoResult } from '../agents';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

interface TechnicalSeoResultsProps {
  result: TechnicalSeoResult | null;
}

const TechnicalSeoResults: React.FC<TechnicalSeoResultsProps> = ({ result }) => {
  if (!result) return null;

  const chartData = [
    { subject: 'Structure', A: result.structureScore },
    { subject: 'Performance', A: result.performanceScore },
    { subject: 'Mobile', A: result.mobileScore },
    { subject: 'Schema', A: result.schemaScore },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const getPriorityColor = (priority: string) => {
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes('high')) return 'red';
    if (lowerPriority.includes('medium')) return 'yellow';
    if (lowerPriority.includes('low')) return 'green';
    return 'gray';
  };

  const getEffortColor = (effort: string) => {
    const lowerEffort = effort.toLowerCase();
    if (lowerEffort.includes('high')) return 'red';
    if (lowerEffort.includes('medium')) return 'yellow';
    if (lowerEffort.includes('low')) return 'green';
    return 'gray';
  };

  return (
    <Card size="2">
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="4" weight="bold">Technical SEO Audit</Text>
          <Badge color={getScoreColor(result.overallScore)}>
            Score: {result.overallScore}/100
          </Badge>
        </Flex>

        <Separator size="4" />

        <Flex wrap="wrap" gap="4">
          <Box width={{ initial: '100%', sm: '48%' }}>
            <Text size="2" weight="bold">Score Breakdown</Text>
            <Flex direction="column" gap="2" mt="2">
              <Flex justify="between">
                <Text size="2" color="gray">Structure:</Text>
                <Text size="2">{result.structureScore}/100</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Performance:</Text>
                <Text size="2">{result.performanceScore}/100</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Mobile Friendliness:</Text>
                <Text size="2">{result.mobileScore}/100</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">Schema Markup:</Text>
                <Text size="2">{result.schemaScore}/100</Text>
              </Flex>
            </Flex>
          </Box>

          <Box width={{ initial: '100%', sm: '48%' }} style={{ height: '300px' }}>
            <Text size="2" weight="bold">Audit Radar</Text>
            <div style={{ width: '100%', height: '280px' }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Flex>

        <Box mt="2">
          <Text size="2" weight="bold">Critical Issues</Text>
          <Table.Root variant="surface" mt="2">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Issue</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Impact</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Recommendation</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {result.criticalIssues.map((issue, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{issue.category}</Table.Cell>
                  <Table.Cell>{issue.issue}</Table.Cell>
                  <Table.Cell>{issue.impact}</Table.Cell>
                  <Table.Cell>{issue.recommendation}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        <Box mt="4">
          <Text size="2" weight="bold">Recommended Improvements</Text>
          <Table.Root variant="surface" mt="2">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Category</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Recommendation</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Priority</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Effort</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {result.improvements.map((improvement, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{improvement.category}</Table.Cell>
                  <Table.Cell>{improvement.recommendation}</Table.Cell>
                  <Table.Cell>
                    <Badge color={getPriorityColor(improvement.priority)}>
                      {improvement.priority}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={getEffortColor(improvement.effort)}>
                      {improvement.effort}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Flex>
    </Card>
  );
};

export default TechnicalSeoResults;