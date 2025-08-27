// src/hooks/useFeatureFlags.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const FeatureFlagContext = createContext({});

export const FeatureFlagProvider = ({ children }) => {
  const { user, userData } = useAuth();
  const [flags, setFlags] = useState({
    // Core features - always enabled
    inventory_management: true,
    banking_integration: true,
    payroll_system: true,
    
    // Advanced features (plan-based)
    multi_user_access: false,
    api_integrations: false,
    white_labeling: false,
    
    // Beta features
    ai_insights: true,
    mobile_app: true,
    voice_commands: false, // Beta
    blockchain_receipts: false, // Future
    
    // Regional features
    international_taxes: true,
    multi_currency: true,
    
    // Industry-specific
    restaurant_pos: false, // Coming soon
    manufacturing_mrp: false, // Coming soon
    retail_inventory: true,
  });

  useEffect(() => {
    if (userData?.plan) {
      // Update flags based on user plan changes
      setFlags(prev => ({
        ...prev,
        multi_user_access: userData?.plan === 'professional' || userData?.plan === 'business',
        api_integrations: userData?.plan === 'business',
        white_labeling: userData?.plan === 'business',
        ai_insights: userData?.plan !== 'free',
      }));
    }
  }, [userData?.plan]);

  const isFeatureEnabled = (featureName) => {
    return flags[featureName] || false;
  };

  const getFeatureList = () => {
    return Object.entries(flags).map(([key, enabled]) => ({
      name: key,
      enabled,
      displayName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isFeatureEnabled, getFeatureList }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
};