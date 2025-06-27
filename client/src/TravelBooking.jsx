import { useState } from 'react';
import FlightSearch from './components/FlightSearch';
import HotelSearch from './components/HotelSearch';
import PackageSearch from './components/PackageSearch';

const tabs = [
  { name: 'Flights', icon: '✈', key: 'flights' },
  { name: 'Hotels', icon: '🏨', key: 'hotels' },
  { name: 'Travel Packages', icon: '🎒', key: 'packages' },
];

export default function TravelBooking() {
  const [activeTab, setActiveTab] = useState('flights');

  return (
    <div className="min-h-screen bg-blue-50 font-sans">

      {/* Branding Header */}
      <div className="flex gap-2 items-center justify-center sm:justify-start xl:gap-4 py-4 px-4">
        <div className="flex items-center">
          <img src="/medyatralogo.jpg" alt="MedYatra Logo" className="h-16 w-16 rounded-full shadow-md bg-white border border-blue-100" />
        </div>
        <div className='flex h-16 flex-col items-center justify-center'>
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight drop-shadow-sm">MedYatra Travel</span>
          <span className="text-blue-600 w-fit text-xs font-medium bg-blue-100 px-3 py-1 rounded-full shadow-sm">Travel for Health, Made Easy</span>
        </div>
      </div>

      <div className='main flex flex-col items-center justify-center p-4'>
        {/* Tabs */}
        <div className="w-full max-w-2xl mb-6">
          <div className="flex rounded-lg shadow overflow-hidden bg-white">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-3 px-2 text-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none ${activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-inner'
                  : 'bg-white text-blue-700 hover:bg-blue-100'
                  }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.icon}</span> {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Panels */}
        <div className="w-full max-w-2xl bg-transparent rounded-lg">
          {activeTab === 'flights' && (
            <div>
              <FlightSearch />
            </div>
          )}
          {activeTab === 'hotels' && (
            <HotelSearch />
          )}
          {activeTab === 'packages' && (
            <PackageSearch />
          )}
        </div>
      </div>
    </div>
  );
}
