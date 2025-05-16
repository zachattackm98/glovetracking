import React from 'react';
import { Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-primary-600" />
              <span className="ml-2 text-base font-bold text-gray-900">Safeguard<span className="text-primary-600">70E</span></span>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-center text-sm text-gray-500 md:text-right">
              &copy; {new Date().getFullYear()} Safeguard70E. All rights reserved. <span className="hidden md:inline">|</span><br className="md:hidden" /> OSHA 1910.137 &amp; NFPA 70E Compliance
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;