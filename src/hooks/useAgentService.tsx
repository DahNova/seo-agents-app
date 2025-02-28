import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgentService, createAgentService } from '../agents';

interface AgentServiceContextType {
  agentService: AgentService;
  apiKey: string;
  setApiKey: (key: string) => void;
  isApiKeySet: boolean;
}

const AgentServiceContext = createContext<AgentServiceContextType | undefined>(undefined);

export const AgentServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [agentService, setAgentService] = useState<AgentService | null>(null);

  useEffect(() => {
    // Set the Gemini API key that was provided
    const defaultApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAo5Cm_T-PJf3iGDm9mpxfdBjmsE49F4Ow';
    
    if (defaultApiKey) {
      setApiKey(defaultApiKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      const service = createAgentService(apiKey, "gemini-2.0-flash");
      setAgentService(service);
    }
  }, [apiKey]);

  const value = {
    agentService: agentService as AgentService,
    apiKey,
    setApiKey,
    isApiKeySet: !!apiKey,
  };

  return (
    <AgentServiceContext.Provider value={value}>
      {children}
    </AgentServiceContext.Provider>
  );
};

export const useAgentService = (): AgentServiceContextType => {
  const context = useContext(AgentServiceContext);
  if (context === undefined) {
    throw new Error('useAgentService must be used within an AgentServiceProvider');
  }
  return context;
};