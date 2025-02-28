import React from 'react';
import { Flex, Box, Button } from '@radix-ui/themes';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <Flex gap="4" justify="center" p="2">
      <Button 
        variant={location.pathname === '/' ? 'solid' : 'outline'} 
        asChild
      >
        <Link to="/">Home</Link>
      </Button>
      
      <Button 
        variant={location.pathname === '/keywords' ? 'solid' : 'outline'} 
        asChild
      >
        <Link to="/keywords">Keyword Research</Link>
      </Button>
      
      <Button 
        variant={location.pathname === '/content' ? 'solid' : 'outline'} 
        asChild
      >
        <Link to="/content">Content Optimization</Link>
      </Button>
      
      <Button 
        variant={location.pathname === '/technical' ? 'solid' : 'outline'} 
        asChild
      >
        <Link to="/technical">Technical SEO</Link>
      </Button>
    </Flex>
  );
};

export default Navigation;