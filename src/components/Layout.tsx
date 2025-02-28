import React from 'react';
import { Flex, Box, Heading, Container, Text } from '@radix-ui/themes';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Flex direction="column" style={{ minHeight: '100vh' }}>
      <Box px="4" py="3" style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <Container size="3">
          <Flex justify="between" align="center">
            <Heading size="5" as="h1">SEO Agents</Heading>
            <Text size="2" weight="medium">AI-Powered SEO Tools</Text>
          </Flex>
        </Container>
      </Box>
      
      <Box py="3">
        <Container size="3">
          <Navigation />
        </Container>
      </Box>
      
      <Box style={{ flex: '1' }} py="4">
        <Container size="3">
          {children}
        </Container>
      </Box>
      
      <Box py="4" style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
        <Container size="3">
          <Flex justify="between" align="center">
            <Text size="1" color="gray">© 2025 SEO Agents</Text>
            <Text size="1" color="gray">Powered by LangChain & Radix UI</Text>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
};

export default Layout;