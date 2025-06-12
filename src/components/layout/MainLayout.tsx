import React, { ReactNode } from 'react';
import Header from '@/components/Header';
import TopLeaguesFilter from '@/components/TopLeaguesFilter';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="flex-1 pb-10 pt-16 md:pt-20">
        <div className="container mx-auto px-4 sm:px-6 mt-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {children}
            </div>
            
            {/* Featured Leagues Sidebar */}
            <div className="lg:w-80 flex-shrink-0 rounded-3xl p-6 h-fit" style={{ backgroundColor: '#000000', border: '1px solid #1B1B1B' }}>
              <div className="lg:sticky lg:top-24">
                <TopLeaguesFilter
                  selectedLeagueId={null}
                  onLeagueSelect={() => {}}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-[#1B1B1B] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 League Lens. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
