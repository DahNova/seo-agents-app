import React from 'react';
import { Heading, Text, Card, Flex, Box, Button } from '@radix-ui/themes';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, TextAlignLeftIcon, GlobeIcon } from '@radix-ui/react-icons';

const HomePage: React.FC = () => {
  return (
    <Flex direction="column" gap="6">
      <Box py="6">
        <Flex direction="column" align="center" gap="3" style={{ textAlign: 'center' }}>
          <Heading size="8" align="center">
            Optimize Your SEO with AI Agents
          </Heading>
          <Text size="3" color="gray" align="center" style={{ maxWidth: '650px' }}>
            Leverage AI to improve your search rankings with keyword research, content optimization, 
            and technical SEO audits - all powered by intelligent agents.
          </Text>
        </Flex>
      </Box>

      <Flex gap="4" wrap="wrap">
        <Card size="2" style={{ flex: '1', minWidth: '280px' }}>
          <Flex direction="column" gap="3" height="100%">
            <Flex justify="center" py="4">
              <Box style={{ 
                backgroundColor: 'var(--purple-3)', 
                borderRadius: '50%', 
                width: '60px', 
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MagnifyingGlassIcon width="28" height="28" color="var(--purple-9)" />
              </Box>
            </Flex>
            <Heading size="4" align="center">Keyword Research</Heading>
            <Text size="2" align="center">
              Discover high-value keywords based on search volume, competition, and relevance to your business.
            </Text>
            <Box flex="1" />
            <Flex justify="center" py="2">
              <Button asChild>
                <Link to="/keywords">Try Keyword Research</Link>
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card size="2" style={{ flex: '1', minWidth: '280px' }}>
          <Flex direction="column" gap="3" height="100%">
            <Flex justify="center" py="4">
              <Box style={{ 
                backgroundColor: 'var(--green-3)', 
                borderRadius: '50%', 
                width: '60px', 
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TextAlignLeftIcon width="28" height="28" color="var(--green-9)" />
              </Box>
            </Flex>
            <Heading size="4" align="center">Content Optimization</Heading>
            <Text size="2" align="center">
              Evaluate and improve your content for better readability, keyword usage, and semantic relevance.
            </Text>
            <Box flex="1" />
            <Flex justify="center" py="2">
              <Button asChild>
                <Link to="/content">Try Content Optimization</Link>
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Card size="2" style={{ flex: '1', minWidth: '280px' }}>
          <Flex direction="column" gap="3" height="100%">
            <Flex justify="center" py="4">
              <Box style={{ 
                backgroundColor: 'var(--blue-3)', 
                borderRadius: '50%', 
                width: '60px', 
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <GlobeIcon width="28" height="28" color="var(--blue-9)" />
              </Box>
            </Flex>
            <Heading size="4" align="center">Technical SEO</Heading>
            <Text size="2" align="center">
              Analyze website structure, speed, mobile-friendliness, and schema markup for better performance.
            </Text>
            <Box flex="1" />
            <Flex justify="center" py="2">
              <Button asChild>
                <Link to="/technical">Try Technical SEO</Link>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>

      <Card size="2" my="4">
        <Flex direction="column" gap="3">
          <Heading size="3">How It Works</Heading>
          <Text>
            SEO Agents uses advanced language models and specialized agents to analyze and optimize your SEO 
            strategy. Each agent is designed to focus on specific aspects of SEO:
          </Text>
          <Box>
            <Text size="2" weight="bold">Keyword Research Agent</Text>
            <Text size="2">Analyzes search trends, competition, and relevance to identify high-value keywords</Text>
          </Box>
          <Box>
            <Text size="2" weight="bold">Content Optimization Agent</Text>
            <Text size="2">Evaluates existing content and suggests improvements for readability, keyword usage, and semantic relevance</Text>
          </Box>
          <Box>
            <Text size="2" weight="bold">Technical SEO Agent</Text>
            <Text size="2">Audits website structure, speed, mobile-friendliness, and schema markup</Text>
          </Box>
        </Flex>
      </Card>
    </Flex>
  );
};

export default HomePage;