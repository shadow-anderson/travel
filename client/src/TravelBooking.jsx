import { useState } from 'react';
import TravelSearch from './components/TravelSearch';
import { searchHotelsDelhi } from './services/hotelSearchDelhi';
import Select from 'react-select';
import { countries } from './data/countries';
import { fetchAirportsByCountry, searchFlights } from './services/amadeusService';

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

  // Travel Packages state
  const [pkgCountry, setPkgCountry] = useState(null); // country object
  const [pkgCity, setPkgCity] = useState(null); // city object
  const [pkgCityOptions, setPkgCityOptions] = useState([]);
  const [pkgCityLoading, setPkgCityLoading] = useState(false);
  const [pkgCityError, setPkgCityError] = useState('');
  const [pkgDepartDate, setPkgDepartDate] = useState('');
  const [pkgHotelFrom, setPkgHotelFrom] = useState(todayStr);
  const [pkgHotelTo, setPkgHotelTo] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pkgAdults] = useState(1);
  const [pkgRooms] = useState(1);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [pkgError, setPkgError] = useState('');
  const [pkgResult, setPkgResult] = useState(null);

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

  // Helper for required validation
  function validatePackageForm() {
    if (!pkgCountry || !pkgCity || !pkgDepartDate || !pkgHotelFrom || !pkgHotelTo) {
      setPkgError('All fields are required.');
      return false;
    }
    setPkgError('');
    return true;
  }

  // Handle country change for package
  const handlePkgCountryChange = async (selectedOption) => {
    setPkgCountry(selectedOption);
    setPkgCity(null);
    setPkgCityError('');
    if (selectedOption) {
      setPkgCityLoading(true);
      try {
        const airports = await fetchAirportsByCountry(selectedOption.label);
        const options = airports.map(airport => ({
          value: airport.code,
          label: airport.name
        }));
        setPkgCityOptions(options);
      } catch (error) {
        setPkgCityError('Failed to load cities.');
      } finally {
        setPkgCityLoading(false);
      }
    } else {
      setPkgCityOptions([]);
    }
  };

  // Handler for package search
  async function handlePackageSearch(e) {
    e.preventDefault();
    if (!pkgCountry || !pkgCity || !pkgDepartDate || !pkgHotelFrom || !pkgHotelTo) {
      setPkgError('All fields are required.');
      return;
    }
    setPkgLoading(true);
    setPkgError('');
    setPkgResult(null);
    try {
      // 1. Search flights (to DEL)
      const flightRes = await searchFlights({
        selectedCity: pkgCity.value,
        selectedDepartureDate: pkgDepartDate,
        adults: 1,
        currencyCode: 'USD'
      });
      // 2. Search hotels (DEL)
      const hotelRes = await searchHotelsDelhi({
        checkInDate: pkgHotelFrom,
        checkOutDate: pkgHotelTo
      });
      // 3. Get best/first flight and hotel offer
      const bestFlight = Array.isArray(flightRes) && flightRes.length > 0 ? flightRes[0] : null;
      const bestHotel = hotelRes?.data && hotelRes.data.length > 0 ? hotelRes.data[0] : null;
      // 4. Calculate integrated price
      let flightPriceUSD = bestFlight?.price?.total ? parseFloat(bestFlight.price.total) : 0;
      let hotelPriceINR = bestHotel?.offers?.[0]?.price?.total ? parseFloat(bestHotel.offers[0].price.total) : 0;
      let hotelPriceUSD = hotelPriceINR / 88;
      let totalUSD = flightPriceUSD + hotelPriceUSD;
      // 5. Prepare summary
      let summary = `Flights: $${flightPriceUSD.toFixed(2)} USD + Hotels: ₹${hotelPriceINR.toFixed(0)} INR = $${totalUSD.toFixed(2)} USD (1 USD = 88 INR)`;
      setPkgResult({
        summary,
        flight: bestFlight,
        hotel: bestHotel,
        totalUSD: totalUSD.toFixed(2),
        flightPriceUSD: flightPriceUSD.toFixed(2),
        hotelPriceINR: hotelPriceINR.toFixed(0),
        hotelPriceUSD: hotelPriceUSD.toFixed(2)
      });
    } catch (err) {
      setPkgError('Failed to fetch package results.');
    } finally {
      setPkgLoading(false);
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
            <form className="grid gap-4 mb-6" onSubmit={handlePackageSearch}>
              <div className="flex gap-2">
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Select your country</label>
                  <Select
                    options={countries}
                    value={pkgCountry}
                    onChange={handlePkgCountryChange}
                    placeholder="Select your country"
                    isClearable
                    required
                  />
                </div>
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Select your city</label>
                  <Select
                    options={pkgCityOptions}
                    value={pkgCity}
                    onChange={setPkgCity}
                    placeholder={pkgCityLoading ? 'Loading...' : 'Select your city'}
                    isDisabled={!pkgCountry || pkgCityLoading}
                    isClearable
                    required
                  />
                  {pkgCityError && <div className="text-red-600 text-xs mt-1">{pkgCityError}</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Departure Date</label>
                  <input type="date" value={pkgDepartDate} min={todayStr} onChange={e => setPkgDepartDate(e.target.value)} required className="input input-bordered w-full rounded shadow" />
                </div>
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">To</label>
                  <input type="text" value="DELHI" disabled className="input input-bordered w-full rounded shadow bg-gray-100 text-lg font-bold text-blue-900 cursor-not-allowed border-2 border-blue-300" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Hotel Check-in</label>
                  <input type="date" value={pkgHotelFrom} min={todayStr} onChange={e => setPkgHotelFrom(e.target.value)} required className="input input-bordered w-full rounded shadow" />
                </div>
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Hotel Check-out</label>
                  <input type="date" value={pkgHotelTo} min={pkgHotelFrom} onChange={e => setPkgHotelTo(e.target.value)} required className="input input-bordered w-full rounded shadow" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Adults</label>
                  <select value={pkgAdults} disabled className="input input-bordered w-full rounded shadow">
                    <option>1</option>
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-base font-semibold text-blue-700 mb-2">Rooms</label>
                  <select value={pkgRooms} disabled className="input input-bordered w-full rounded shadow">
                    <option>1</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-lg font-bold text-lg hover:bg-blue-700 transition" disabled={pkgLoading}>Search Flights + Hotels</button>
            </form>
            {pkgError && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 font-semibold">{pkgError}</div>}
            {pkgLoading && <div className="text-blue-700 font-semibold text-center py-4">Loading package...</div>}
            {pkgResult && (
              <div className="bg-white rounded-xl shadow-lg p-6 mt-4 flex flex-col gap-6 md:gap-8">
                {/* Total Package Summary */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl text-blue-700">💼</span>
                    <span className="font-bold text-xl md:text-2xl text-blue-900">Total Package</span>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <span className="text-lg font-semibold text-blue-800">Flight: <span className="text-blue-600">${pkgResult.flightPriceUSD} USD</span></span>
                    <span className="text-lg font-semibold text-blue-800">Hotel: <span className="text-blue-600">₹{pkgResult.hotelPriceINR} INR</span> <span className="text-gray-500">(≈ ${pkgResult.hotelPriceUSD} USD)</span></span>
                    <span className="text-xl font-bold text-green-700 mt-1">Total: ${pkgResult.totalUSD} USD</span>
                    <span className="text-xs text-gray-500">Exchange Rate: 1 USD = 88 INR</span>
                  </div>
                </div>
                {/* Flight Details Card */}
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✈️</span>
                    <span className="font-semibold text-blue-800 text-lg">Flight Details</span>
                  </div>
                  {pkgResult.flight ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-4 text-sm md:text-base">
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Airline:</span> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'N/A'} {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.number || ''}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Departure:</span> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? new Date(pkgResult.flight.itineraries[0].segments[0].departure.at).toLocaleString() : 'N/A'} – {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || ''}, Terminal {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.terminal || ''}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Arrival:</span> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.at ? new Date(pkgResult.flight.itineraries[0].segments[0].arrival.at).toLocaleString() : 'N/A'} – {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode || ''}, Terminal {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.terminal || ''}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Stop:</span> {pkgResult.flight.itineraries?.[0]?.segments?.length > 1 ? pkgResult.flight.itineraries[0].segments.length - 1 : 0}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Duration:</span> {pkgResult.flight.itineraries?.[0]?.duration || 'N/A'}
                        </div>
                        <div className="flex-1 min-w-[180px] flex items-center gap-1">
                          <span className="font-medium">Baggage:</span> <span title="Cabin bag included">🧳</span> <span className="text-xs text-gray-500">Checked bag {pkgResult.flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity ? 'included' : 'extra'}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
                        <div className="flex-1 min-w-[180px] flex items-center gap-1">
                          <span className="font-medium">Amenities:</span> 🍽️ Complimentary Meal, 💺 Seat Selection
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Book Now</button>
                        <button className="bg-white border border-blue-600 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">Add Baggage</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No flight details available.</div>
                  )}
                </div>
                {/* Hotel Details Card */}
                <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏨</span>
                    <span className="font-semibold text-blue-800 text-lg">Hotel Details</span>
                  </div>
                  {pkgResult.hotel ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-4 text-sm md:text-base">
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Hotel:</span> {pkgResult.hotel.hotel?.name || 'N/A'}
                        </div>
                        <div className="flex-1 min-w-[180px] flex items-center gap-1">
                          <span className="font-medium">Location:</span> <span className="text-blue-700">📍</span> {pkgResult.hotel.hotel?.address?.cityName || 'N/A'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Check-in:</span> {pkgHotelFrom}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Check-out:</span> {pkgHotelTo}
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Room:</span> {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.bedType || 'N/A'}, {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.roomType || ''} {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.beds ? `, ${pkgResult.hotel.offers[0].room.typeEstimated.beds} Bed(s)` : ''} {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.roomArea ? `, ${pkgResult.hotel.offers[0].room.typeEstimated.roomArea} sq ft` : ''}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
                        <div className="flex-1 min-w-[180px]">
                          <span className="font-medium">Refund Policy:</span> {pkgResult.hotel.policies?.cancellation?.description || 'See hotel details'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
                        <div className="flex-1 min-w-[180px] flex items-center gap-1">
                          <span className="font-medium">Amenities:</span> {pkgResult.hotel.offers?.[0]?.room?.description?.text || 'See hotel details'}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Book Now</button>
                        <button className="bg-white border border-blue-600 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">Upgrade Room</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">No hotel details available.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
