import React, { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Shield, Menu as MenuIcon, X, Bell, HelpCircle } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

const Header: React.FC = () => {
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', adminOnly: false },
    { name: 'Assets', href: '/assets', adminOnly: false },
    { name: 'Users', href: '/users', adminOnly: true },
    { name: 'Import/Export', href: '/import-export', adminOnly: true },
    { name: 'Help', href: '/walkthrough', adminOnly: false },
  ];
  
  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly) {
      return user?.publicMetadata.role === 'admin';
    }
    return true;
  });
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <Shield className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Safeguard<span className="text-primary-600">70E</span></span>
              </Link>
            </div>
            
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {filteredNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>
            
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {filteredNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive(item.href)
                  ? 'border-primary-500 text-primary-700 bg-primary-50'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user?.fullName}</div>
              <div className="text-sm font-medium text-gray-500">{user?.primaryEmailAddress?.emailAddress}</div>
            </div>
            <button
              type="button"
              className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-3 space-y-1">
            <Link
              to="/walkthrough"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Help & Training
            </Link>
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  userButtonBox: "w-full",
                  userButtonTrigger: "w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;