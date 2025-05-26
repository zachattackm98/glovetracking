import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { backOff } from 'exponential-backoff';
import App from './App.tsx';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Configure Clerk with retry mechanism
const clerkConfig = {
  publishableKey: clerkPubKey,
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/dashboard',
  signInUrl: '/sign-in',
  loadRetry: {
    retries: 3,
    minDelay: 1000,
    maxDelay: 5000,
    onRetry: (error: Error, attempt: number) => {
      console.warn(`Clerk load retry attempt ${attempt}:`, error);
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider {...clerkConfig}>
      <App />
    </ClerkProvider>
  </StrictMode>
);