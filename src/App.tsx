import React from 'react';
import { Theme } from '@radix-ui/themes';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@radix-ui/themes/styles.css';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import KeywordResearchPage from './pages/KeywordResearchPage';
import ContentOptimizationPage from './pages/ContentOptimizationPage';
import TechnicalSeoPage from './pages/TechnicalSeoPage';
import { AgentServiceProvider } from './hooks/useAgentService';

const App: React.FC = () => {
  return (
    <Theme accentColor="violet" grayColor="slate" radius="medium" scaling="100%">
      <AgentServiceProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/keywords" element={<KeywordResearchPage />} />
              <Route path="/content" element={<ContentOptimizationPage />} />
              <Route path="/technical" element={<TechnicalSeoPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AgentServiceProvider>
    </Theme>
  );
};

export default App;