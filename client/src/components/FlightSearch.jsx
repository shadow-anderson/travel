import { useState, useEffect } from 'react';
import Select from 'react-select';
import { countries } from '../data/countries';
import { fetchAirportsByCountry, searchFlights } from '../services/amadeusService';
import { UserIcon, MapPinIcon, CalendarDaysIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const FlightDetails = ({ flight }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper function to format date-time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* Flight Summary - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <p className="text-sm text-gray-600">Airline</p>
          <p className="font-medium">{flight.itineraries[0].segments[0].carrierCode}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Departure</p>
          <p className="font-medium">{formatDateTime(flight.itineraries[0].segments[0].departure.at)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Arrival</p>
          <p className="font-medium">{formatDateTime(flight.itineraries[0].segments[0].arrival.at)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price</p>
          <p className="font-medium">{flight.price.total} {flight.price.currency}</p>
        </div>
      </div>

      {/* Expandable Detailed Information */}
      {isExpanded && (
        <div className="mt-4 border-t pt-4">
          {/* Itineraries */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Itinerary Details</h4>
            {flight.itineraries.map((itinerary, iIndex) => (
              <div key={iIndex} className="mb-4 pl-4 border-l-2 border-blue-200">
                <p className="font-medium mb-2">Itinerary {iIndex + 1}</p>
                {itinerary.segments.map((segment, sIndex) => (
                  <div key={sIndex} className="mb-2 bg-gray-50 p-2 rounded">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">From: {segment.departure.iataCode}</p>
                        <p className="font-medium">{formatDateTime(segment.departure.at)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">To: {segment.arrival.iataCode}</p>
                        <p className="font-medium">{formatDateTime(segment.arrival.at)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Flight: {segment.carrierCode} {segment.number}</p>
                        <p className="text-gray-600">Aircraft: {segment.aircraft.code}</p>
                        {segment.duration && <p className="text-gray-600">Duration: {segment.duration}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Price Details */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Price Details</h4>
            <div className="bg-gray-50 p-2 rounded">
              <p>Base Price: {flight.price.base} {flight.price.currency}</p>
              {flight.price.fees?.map((fee, index) => (
                <p key={index}>{fee.type}: {fee.amount} {flight.price.currency}</p>
              ))}
              <p className="font-bold mt-2">Total: {flight.price.total} {flight.price.currency}</p>
            </div>
          </div>

          {/* Fare Details */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Fare Details</h4>
            <div className="bg-gray-50 p-2 rounded">
              {flight.travelerPricings?.map((pricing, index) => (
                <div key={index} className="mb-2">
                  <p className="font-medium">Traveler {index + 1} - {pricing.travelerType}</p>
                  {pricing.fareDetailsBySegment?.map((detail, dIndex) => (
                    <div key={dIndex} className="pl-4 text-sm">
                      <p>Class: {detail.cabin}</p>
                      <p>Fare Basis: {detail.fareBasis}</p>
                      {detail.includedCheckedBags && (
                        <p>Included Bags: {detail.includedCheckedBags.quantity || 0}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Raw JSON Data */}
          <div>
            <h4 className="font-semibold mb-2">Raw Data</h4>
            <div className="bg-gray-50 p-2 rounded overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(flight, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FlightSearch = () => {
  const [formData, setFormData] = useState({
    from: null,  // This will store the selected country
    city: null,
    to: 'Delhi',
    departDate: '',
    returnDate: '',
    passengers: 1
  });
  const [cityError, setCityError] = useState(null);
  const [cityOptions, setCityOptions] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [flights, setFlights] = useState([]);

  // Variables to always hold the selected city and departure date
  const selectedCity = formData.city;
  const selectedDepartureDate = formData.departDate;

  const validateForm = () => {
    setSearchError(null);
    if (!formData.city) {
      setSearchError('Please select a departure city');
      return false;
    }
    if (!formData.departDate) {
      setSearchError('Please select a departure date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSearching(true);
    setFlights([]);
    
    try {
      const flightResults = await searchFlights({
        selectedCity: formData.city.value,
        selectedDepartureDate: formData.departDate,
        adults: formData.passengers
      });
      
      setFlights(flightResults);
    } catch (error) {
      setSearchError(error.response?.data?.error || 'Failed to search flights. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountryChange = async (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      from: selectedOption,
      city: null // Reset city when country changes
    }));
    
    if (selectedOption) {
      setIsLoadingCities(true);
      setCityError(null);
      try {
        // Send country name to backend for CSV match
        const airports = await fetchAirportsByCountry(selectedOption.label); // Use label (country name)
        const options = airports.map(airport => ({
          value: airport.code,
          label: airport.name // Format: "[Airport Name] - [City Name] ([IATA Code])"
        }));
        setCityOptions(options);
      } catch (error) {
        console.error('Error loading airports:', error);
        setCityError('Failed to load airports. Please try again.');
      } finally {
        setIsLoadingCities(false);
      }
    } else {
      setCityOptions([]);
    }
  };

  const handleCityChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      city: selectedOption
    }));
    // selectedCity will always reflect the latest city
  };

  const handleDepartureDateChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      departDate: value
    }));
    // selectedDepartureDate will always reflect the latest date
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      cursor: 'pointer'
    })
  };

  return (
    <div className="bg-transparent flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border border-blue-100">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-blue-700 mb-8 tracking-tight drop-shadow-lg">
          <PaperAirplaneIcon className="inline h-8 w-8 text-blue-500 mr-2 align-middle" />
          Book Your Medical Flight
        </h1>
        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                <UserIcon className="h-5 w-5 text-blue-400" /> Select your country
              </label>
              <Select
                options={countries}
                value={formData.from}
                onChange={handleCountryChange}
                styles={customStyles}
                placeholder="Search and select your country"
                isClearable
                isSearchable
                required
                classNamePrefix="react-select"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                <MapPinIcon className="h-5 w-5 text-blue-400" /> Select your city
              </label>
              <Select
                value={formData.city}
                onChange={handleCityChange}
                options={cityOptions}
                styles={customStyles}
                placeholder={formData.from ? (isLoadingCities ? 'Loading cities...' : 'Select city') : 'Select a country first'}
                isClearable
                isSearchable
                required
                isDisabled={!formData.from || isLoadingCities}
                noOptionsMessage={() => cityError ? cityError : 'No cities found'}
                classNamePrefix="react-select"
              />
              {cityError && (
                <p className="mt-2 text-xs text-red-600">
                  {cityError}
                </p>
              )}
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                <CalendarDaysIcon className="h-5 w-5 text-blue-400" /> Departure Date
              </label>
              <input
                type="date"
                name="departDate"
                value={formData.departDate}
                onChange={handleDepartureDateChange}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-blue-50 text-gray-900 font-medium"
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                <PaperAirplaneIcon className="h-5 w-5 text-blue-400" /> To
              </label>
              <input
                type="text"
                value="Delhi (DEL)"
                className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                disabled
              />
            </div>
          </div>
          {searchError && (
            <div className="text-red-600 text-xs mt-2">
              {searchError}
            </div>
          )}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSearching}
              className={`w-full bg-gradient-to-r from-blue-600 to-blue-400 text-white py-3 px-6 rounded-xl font-bold shadow-lg text-lg tracking-wide transition-all duration-200
                ${isSearching ? 'opacity-60 cursor-not-allowed' : 'hover:from-blue-700 hover:to-blue-500 hover:scale-[1.03] active:scale-100'}`}
            >
              {isSearching ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  Searching Flights...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <PaperAirplaneIcon className="h-5 w-5 text-white" /> Search Flights
                </span>
              )}
            </button>
          </div>
        </form>
        {/* Flight Results Section */}
        {isSearching && (
          <div className="mt-10 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-blue-700 font-medium">Searching for flights...</p>
          </div>
        )}
        {!isSearching && searchError && (
          <div className="mt-10 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-semibold">{searchError}</p>
          </div>
        )}
        {!isSearching && flights.length === 0 && !searchError && (
          <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-700 font-semibold">No flights found for the selected criteria.</p>
          </div>
        )}
        {!isSearching && flights.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Available Flights ({flights.length})</h2>
            <div className="space-y-6">
              {flights.map((flight, index) => (
                <FlightDetails key={index} flight={flight} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;
