import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        {(title || description) && (
          <div className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;