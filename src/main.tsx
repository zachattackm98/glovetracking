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
        layout: {
          socialButtonsPlacement: "bottom",
          socialButtonsVariant: "iconButton",
        },
        variables: {
          colorPrimary: '#0F172A',
        },
        elements: {
          rootBox: "min-h-screen flex items-center justify-center bg-gray-50",
          card: "bg-white shadow-lg rounded-lg border border-gray-200 p-8 w-full max-w-md",
          headerTitle: "text-2xl font-bold text-center mb-2",
          headerSubtitle: "text-gray-500 text-center mb-6",
          formButtonPrimary: "w-full bg-primary-600 text-white rounded-md py-2 hover:bg-primary-700 transition-colors",
          formFieldInput: "w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          formFieldLabel: "block text-sm font-medium text-gray-700 mb-1",
          dividerLine: "bg-gray-200",
          dividerText: "text-gray-500",
          footerActionLink: "text-primary-600 hover:text-primary-700",
          identityPreviewText: "text-gray-600",
          identityPreviewEditButton: "text-primary-600 hover:text-primary-700",
        },
      }}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      navigate={(to) => {
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>
);