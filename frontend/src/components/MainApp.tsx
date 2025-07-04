import React, { useState, useRef, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useAuth } from '@clerk/clerk-react';
import {
  FaDatabase,
  FaNetworkWired,
  FaWallet,
  FaUser,
  FaSearch,
  FaPlus,
  FaSync,
  FaEllipsisV,
  FaFolder,
  FaFile,
  FaPlay,
  FaHistory,
  FaCube,
  FaFolderPlus,
  FaDownload
} from 'react-icons/fa';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { ProjectService } from '../services/projectService';
import { DeploymentService } from '../services/deploymentService';
import { FaucetService } from '../services/faucetService';
import { AdvancedTerminalService } from '../services/advancedTerminalService';
import { VulnerabilityService } from '../services/vulnerabilityService';


// Ethereum window type declaration for Web3 wallet integration
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      selectedAddress?: string;
    };
  }
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  project_data: any;
  status: 'active' | 'completed' | 'draft';
  type: 'contract' | 'dapp';
}

interface Template {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  network: string;
}

interface NetworkOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

function MainApp() {
  console.log('🚀 MainApp component initializing...');

  // Get authentication
  const { getToken } = useAuth();
  const { userId } = useSupabaseAuth();

  // Simplified state for debugging
  const [currentView, setCurrentView] = useState<'dashboard' | 'templates' | 'ide' | 'vulnerability'>('dashboard');

  console.log('Current view state:', currentView);
  console.log('User ID:', userId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">⚡ NovaGuard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <SignedIn>
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to NovaGuard
                </h2>
                <p className="text-gray-600 mb-6">
                  Your AI-powered smart contract security platform
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentView('vulnerability')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 mr-4"
                  >
                    Start Security Audit
                  </button>
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Please sign in to access NovaGuard
              </h2>
              <p className="text-gray-600 mb-8">
                Secure your smart contracts with AI-powered analysis
              </p>
              <SignInButton mode="modal">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-md hover:bg-blue-700 text-lg">
                  Get Started
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
      </main>


    </div>
  );
}

export default MainApp;
