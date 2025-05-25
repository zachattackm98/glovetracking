import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={clerkPubKey}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary-600 hover:bg-primary-700 text-white',
          formFieldInput: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
          card: 'bg-white shadow-sm rounded-lg border border-gray-200',
        },
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);