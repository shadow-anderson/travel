import { useState } from 'react';
import TravelSearch from './components/TravelSearch';
import { searchHotelsDelhi } from './services/hotelSearchDelhi';

const tabs = [
  { name: 'Flights', icon: '✈', key: 'flights' },
  { name: 'Hotels', icon: '🏨', key: 'hotels' },
  { name: 'Travel Packages', icon: '🎒', key: 'packages' },
];

export default function TravelBooking() {
  const [activeTab, setActiveTab] = useState('flights');
  // Today's date in yyyy-mm-dd for min attribute
  const todayStr = new Date().toISOString().split('T')[0];
  // Tomorrow's date in yyyy-mm-dd for default 'to' value
  const tomorrowStr = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  })();
  // State for hotel date selection
  const [hotelFromDate, setHotelFromDate] = useState(todayStr);
  const [hotelToDate, setHotelToDate] = useState(tomorrowStr);
  // State for hotel search
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelError, setHotelError] = useState('');
  const [hotelResults, setHotelResults] = useState(null);
  // State for expanded hotel cards
  const [expandedHotelIdx, setExpandedHotelIdx] = useState(null);

  // Calculate min for 'To' date (one day after 'From' or tomorrow)
  function getToMinDate() {
    if (hotelFromDate) {
      const from = new Date(hotelFromDate);
      from.setDate(from.getDate() + 1);
      return from.toISOString().split('T')[0];
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
  }

  async function handleHotelSearch() {
    setHotelLoading(true);
    setHotelError('');
    setHotelResults(null);
    try {
      const data = await searchHotelsDelhi({
        checkInDate: hotelFromDate,
        checkOutDate: hotelToDate,
      });
      setHotelResults(data);
    } catch (err) {
      setHotelError(err.message || 'Failed to fetch hotels');
    } finally {
      setHotelLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center py-6 px-2">
      {/* Tabs */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex rounded-lg shadow overflow-hidden bg-white">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`flex-1 py-3 px-2 text-lg font-semibold flex items-center justify-center gap-2 transition-colors duration-200 focus:outline-none ${
                activeTab === tab.key
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
      <div className="w-full max-w-2xl bg-white rounded-lg shadow p-4">
        {activeTab === 'flights' && (
          <div>
            <TravelSearch />
          </div>
        )}
        {activeTab === 'hotels' && (
          <div>
            {/* Hotels Tab UI */}
            <h2 className="text-2xl font-extrabold mb-6 text-blue-800 tracking-wide text-center flex items-center justify-center gap-2">
              <span className="text-3xl">🏨</span> Search Hotels
            </h2>
            {/* Form */}
            <form
              className="grid gap-6 mb-8 bg-gradient-to-r from-blue-100 to-blue-50 p-6 rounded-xl shadow-lg border border-blue-100"
              onSubmit={e => { e.preventDefault(); handleHotelSearch(); }}
            >
              <div className="flex flex-col items-start">
                <label className="block text-base font-semibold text-blue-700 mb-2">Destination City</label>
                <input type="text" value="DELHI" disabled className="input input-bordered w-full rounded-lg shadow bg-gray-100 text-lg font-bold text-blue-900 cursor-not-allowed border-2 border-blue-300" />
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">From</label>
                  <input type="date" value={hotelFromDate} min={todayStr} onChange={e => setHotelFromDate(e.target.value)} className="input input-bordered w-full rounded-lg shadow border-2 border-blue-200" />
                </div>
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">To</label>
                  <input type="date" value={hotelToDate} min={getToMinDate()} onChange={e => setHotelToDate(e.target.value)} className="input input-bordered w-full rounded-lg shadow border-2 border-blue-200" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Adults</label>
                  <select defaultValue="Adults: 1" className="input input-bordered w-full rounded-lg shadow border-2 border-blue-200" disabled>
                    <option>Adults: 1</option>
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Rooms</label>
                  <select className="input input-bordered w-full rounded-lg shadow border-2 border-blue-200" disabled>
                    <option>Rooms: 1</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl shadow-xl font-extrabold text-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 tracking-wide flex items-center justify-center gap-2" disabled={hotelLoading}>
                <span className="text-2xl">🔍</span> {hotelLoading ? 'Searching...' : 'Search Hotels'}
              </button>
            </form>
            {/* Error State */}
            {hotelError && (
              <div className="bg-red-100 text-red-700 p-4 rounded mb-4 font-semibold">{hotelError}</div>
            )}
            {/* Loading State */}
            {hotelLoading && (
              <div className="animate-pulse grid gap-4">
                <div className="h-32 bg-blue-100 rounded-xl" />
              </div>
            )}
            {/* Results State */}
            {hotelResults && (
              <div className="grid gap-4">
                {hotelResults.data && hotelResults.data.length > 0 ? (
                  hotelResults.data.slice(0, 5).map((hotel, idx) => {
                    // Debug: log the hotel object to inspect its shape
                    console.log('Hotel object:', hotel);
                    const addressLines = Array.isArray(hotel.hotel?.address?.lines) ? hotel.hotel.address.lines.join(', ') : '';
                    const cityName = hotel.hotel?.address?.cityName || '';
                    const isExpanded = expandedHotelIdx === idx;
                    return (
                      <div key={hotel.hotel.hotelId || idx} className="p-4 bg-blue-50 rounded-xl shadow border border-blue-100 mb-2">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedHotelIdx(isExpanded ? null : idx)}>
                          <div>
                            <div className="font-bold text-lg text-blue-800">{hotel.hotel.name}</div>
                            <div className="text-blue-700">{addressLines}{addressLines && cityName ? ', ' : ''}{cityName}</div>
                            <div className="text-blue-600">{hotel.offers && hotel.offers[0]?.price?.total ? `From ₹${hotel.offers[0].price.total}` : 'No price info'}</div>
                          </div>
                          <span className="ml-4 text-blue-700 text-xl">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                        {isExpanded && (
                          <pre className="mt-3 bg-white rounded p-3 text-xs text-gray-800 overflow-x-auto border border-blue-100">
                            {JSON.stringify(hotel, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-blue-700 font-semibold">No hotels found for selected dates.</div>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'packages' && (
          <div>
            {/* Travel Packages Tab UI */}
            <h2 className="text-xl font-bold mb-4 text-blue-700">Search Travel Packages</h2>
            {/* Form */}
            <form className="grid gap-4 mb-6">
              <div className="flex gap-2">
                <input type="text" placeholder="From Country" className="input input-bordered w-full rounded shadow" />
                <input type="text" placeholder="From City" className="input input-bordered w-full rounded shadow" />
              </div>
              <input type="text" placeholder="To City" className="input input-bordered w-full rounded shadow" />
              <input type="date" className="input input-bordered w-full rounded shadow" placeholder="Flight Departure Date" />
              <div className="flex gap-2">
                <input type="date" className="input input-bordered w-full rounded shadow" placeholder="Check-in" />
                <input type="date" className="input input-bordered w-full rounded shadow" placeholder="Check-out" />
              </div>
              <div className="flex gap-2">
                <select className="input input-bordered w-full rounded shadow">
                  <option>Adults: 2</option>
                  <option>Adults: 1</option>
                  <option>Adults: 3</option>
                </select>
                <select className="input input-bordered w-full rounded shadow">
                  <option>Rooms: 1</option>
                  <option>Rooms: 2</option>
                </select>
              </div>
              <button type="button" className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-lg font-bold text-lg hover:bg-blue-700 transition">Search Flights + Hotels</button>
            </form>
            {/* Skeleton Loader for Results */}
            <div className="animate-pulse grid gap-4">
              <div className="h-32 bg-blue-100 rounded-lg" />
              <div className="h-32 bg-blue-100 rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
