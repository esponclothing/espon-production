import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService, useAuth } from '../lib/auth';

interface LayoutProps {
  children: ReactNode;
}

export default function AgentLayout({ children }: LayoutProps) {
  const { user } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Customers', href: '/customers', icon: '👥' },
    { name: 'Calls', href: '/calls', icon: '📞' },
    { name: 'Orders', href: '/orders', icon: '🛒' },
    { name: 'Attendance', href: '/attendance', icon: '⏰' },
    { name: 'Leave', href: '/leave', icon: '📅' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">ESPON</h1>
            <p className="text-sm text-blue-100">{user?.name}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-white hover:text-blue-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="lg:flex">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
              <h1 className="text-2xl font-bold text-white">ESPON</h1>
            </div>
            
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-4 border-b">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  Agent
                </span>
              </div>

              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="mr-3 text-xl">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="flex-shrink-0 group block w-full"
              >
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Sign out
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <nav className="flex justify-around">
          {navigation.slice(0, 5).map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex-1 flex flex-col items-center py-2 text-xs
                ${isActive(item.href) ? 'text-blue-600' : 'text-gray-600'}
              `}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
