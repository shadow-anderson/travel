import { useState, useEffect } from 'react';
import Select from 'react-select';
import { countries } from '../data/countries';
import { fetchAirportsByCountry, searchFlights } from '../services/amadeusService';
import { UserIcon, MapPinIcon, CalendarDaysIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { MdOutlineTravelExplore } from "react-icons/md";
import { GiBackpack } from "react-icons/gi";
import { searchHotelsDelhi } from '../services/hotelSearchDelhi.js';

const PackageDetails = ({ packageData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper function to format date-time
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">

        </div>
    );
};

const PackageSearch = () => {
    // Today's date in yyyy-mm-dd for min attribute
    const todayStr = new Date().toISOString().split('T')[0];
    // Tomorrow's date in yyyy-mm-dd for default 'to' value
    const tomorrowStr = (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    })();

    // State for hotel date selection
    const [checkInDate, setCheckInDate] = useState(todayStr);
    const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);

    const [formData, setFormData] = useState({
        from: null,  // This will store the selected country
        city: null,
        to: 'Delhi',
        departDate: todayStr,
        checkInDate: todayStr,
        checkOutDate: tomorrowStr,
        passengers: 1
    });
    const [cityError, setCityError] = useState(null);
    const [cityOptions, setCityOptions] = useState([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [flights, setFlights] = useState([]);
    const [pkgLoading, setPkgLoading] = useState(false);
    const [pkgError, setPkgError] = useState(false);
    const [pkgResult, setPkgResult] = useState(null);

    const adultOptions = [1, 2, 3, 4, 5].map((num) => ({
        label: `${num} ${num === 1 ? "Adult" : "Adults"}`,
        value: num
    }));

    const roomOptions = [1, 2, 3, 4, 5].map((num) => ({
        label: `${num} ${num === 1 ? "Room" : "Rooms"
            }`,
        value: num
    }));

    // Variables to always hold the selected city and departure date
    const selectedCity = formData.city;
    const selectedDepartureDate = formData.departDate;

    // Calculate min for 'To' date (one day after 'From' or tomorrow)
    function getToMinDate(checkIn = formData.checkInDate) {
        const from = new Date(checkIn);
        from.setDate(from.getDate() + 1);
        return from.toISOString().split('T')[0];
    }


    const validateForm = () => {
        setSearchError(null);
        if (!formData.city) {
            setSearchError('Please select a departure city');
            return false;
        }
        if (!formData.checkInDate) {
            setSearchError('Please select a check in date');
            return false;
        }
        if (!formData.checkOutDate) {
            setSearchError('Please select a check out date');
            return false;
        }
        return true;
    };

    // useEffect(() => {
    //     console.log("Form Data Updated:", formData);
    // }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        // console.log("form data", formData);
        setPkgLoading(true);
        setPkgError('');
        setIsSearching(true);
        setPkgResult(null);
        try {
            const flightRes = await searchFlights({
                selectedCity: formData.city.value,
                selectedDepartureDate: formData.departDate,
                adults: formData.passengers,
                currencyCode: 'USD'
            });

            const hotelRes = await searchHotelsDelhi({
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
            });

            // console.log("hotel res", hotelRes);

            // 3. Get best/first flight and hotel offer
            const bestFlight = Array.isArray(flightRes) && flightRes.length > 0 ? flightRes[0] : null;
            const bestHotel = hotelRes?.data && hotelRes.data.length > 0 ? hotelRes.data[0] : null;
            // console.log("Best Hotel", bestHotel);
            // 4. Calculate integrated price
            let flightPriceUSD = bestFlight?.price?.total ? parseFloat(bestFlight.price.total) : 0;
            let hotelPriceINR = bestHotel?.offers?.[0]?.price?.total ? parseFloat(bestHotel.offers[0].price.total) : 0;
            let hotelPriceUSD = hotelPriceINR / 88;
            let totalUSD = flightPriceUSD + hotelPriceUSD;
            // 5. Prepare summary
            let summary = `Flights: $${flightPriceUSD.toFixed(2)} USD + Hotels: ₹${hotelPriceINR.toFixed(0)} INR = $${totalUSD.toFixed(2)} USD (1 USD = 88 INR)`;
            // console.log(summary);
            setPkgResult({
                summary,
                flight: bestFlight,
                hotel: bestHotel,
                totalUSD: totalUSD.toFixed(2),
                flightPriceUSD: flightPriceUSD.toFixed(2),
                hotelPriceINR: hotelPriceINR.toFixed(0),
                hotelPriceUSD: hotelPriceUSD.toFixed(2)
            });
            setIsSearching(false);
        } catch (error) {
            setIsSearching(false);
            setSearchError(error.response?.data?.error || 'Failed to search flights. Please try again.');
        } finally {
            setPkgLoading(false);
        }
    };

    // useEffect(() => {
    //     if (!isSearching && pkgResult) {
    //         // console.log("Package Result:", pkgResult);
    //     }
    // }, [isSearching, pkgResult]);


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
    const handlePassengerChange = (selectedOption) => {
        setFormData(prev => ({
            ...prev,
            passengers: selectedOption
        }));
        // selectedPassengers will always reflect the latest passengers
    };

    const handleRoomChange = (selectedOption) => {
        setFormData(prev => ({
            ...prev,
            rooms: selectedOption
        }));
        // selectedRooms will always reflect the latest rooms
    };

    const handleCityChange = (selectedOption) => {
        setFormData(prev => ({
            ...prev,
            city: selectedOption
        }));
        // selectedCity will always reflect the latest city
    };

    const handleToChange = (selectedOption) => {
        setFormData(prev => ({
            ...prev,
            to: selectedOption
        }));
        // selectedCity will always reflect the latest city
    };

    const handleCheckInDateChange = (e) => {
        const value = e.target.value;
        const toMinDate = getToMinDate(value); // one day after check-in

        setFormData((prev) => ({
            ...prev,
            checkInDate: value,
            checkOutDate:
                value && new Date(prev.checkOutDate) <= new Date(toMinDate)
                    ? toMinDate
                    : prev.checkOutDate
        }));
    };

    useEffect(() => {
        // console.log(checkInDate, checkOutDate);
    }, [checkInDate, checkOutDate]);


    const handleCheckOutDateChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            checkOutDate: value
        }));
        // selectedToDate will always reflect the latest date
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
                    <MdOutlineTravelExplore className="inline h-8 w-8 text-green-900 mr-2 align-middle" />
                    Book Your Travel Package
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
                                <MapPinIcon className="h-5 w-5 text-blue-400" /> Select your city
                            </label>
                            <Select
                                value={formData.to || "DELHI"}
                                onChange={handleToChange}
                                options={cityOptions}
                                styles={customStyles}
                                placeholder="Delhi" // Default to Delhi
                                // placeholder={formData.from ? (isLoadingCities ? 'Loading cities...' : 'Select city') : 'Select a country first'}
                                isClearable
                                isSearchable
                                required
                                isDisabled={true}
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
                                <CalendarDaysIcon className="h-5 w-5 text-blue-400" /> Hotel Check-In
                            </label>
                            <input
                                type="date"
                                name="checkInDate"
                                value={formData.checkInDate}
                                onChange={handleCheckInDateChange}
                                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-blue-50 text-gray-900 font-medium"
                                required
                                min={todayStr}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                                <CalendarDaysIcon className="h-5 w-5 text-blue-400" /> Hotel Check-Out
                            </label>
                            <input
                                type="date"
                                name="checkOutDate"
                                value={
                                    formData.checkOutDate && new Date(formData.checkOutDate) >= new Date(getToMinDate())
                                        ? formData.checkOutDate : getToMinDate()
                                }
                                onChange={handleCheckOutDateChange}
                                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-blue-50 text-gray-900 font-medium"
                                required
                                min={getToMinDate()}
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                                <UserIcon className="h-5 w-5 text-blue-400" /> Adults
                            </label>

                            <Select
                                isDisabled={true}
                                name="passengers"
                                options={adultOptions}
                                value={formData.passengers || adultOptions[0]}
                                onChange={handlePassengerChange}
                                styles={customStyles}
                                placeholder="1 Adult"
                                // placeholder={formData.passengers ? `${formData.passengers} ${formData.passengers === 1 ? 'Adult' : 'Adults'}` : 'Select Adults'}
                                required
                                classNamePrefix="react-select"
                            />

                        </div>
                        <div>
                            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                                <UserIcon className="h-5 w-5 text-blue-400" /> Rooms
                            </label>
                            <Select
                                isDisabled={true}
                                name="rooms"
                                options={roomOptions}
                                value={formData.rooms || roomOptions[0]}
                                onChange={handleRoomChange}
                                styles={customStyles}
                                placeholder="1 Room"
                                // placeholder={formData.rooms ? `${formData.rooms} ${formData.rooms === 1 ? 'Room' : 'Rooms'}` : 'Select Rooms'}
                                required
                                classNamePrefix="react-select"
                            />
                        </div>
                    </div>
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
                                    Searching Packages...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <GiBackpack className="h-5 w-5 text-white" /> Search Package
                                </span>
                            )}
                        </button>
                    </div>
                </form>
                {/* Package Results Section */}
                {isSearching && (
                    <div className="mt-10 text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="mt-3 text-blue-700 font-medium">Searching for Package...</p>
                    </div>
                )}
                {!isSearching && searchError && (
                    <div className="mt-10 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 font-semibold">{searchError}</p>
                    </div>
                )}
                {!isSearching && !pkgResult === 0 && !searchError && (
                    <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-yellow-700 font-semibold">No Package found for the selected criteria.</p>
                    </div>
                )}
                {!isSearching && pkgResult && (
                    <div className="mt-10">
                        <h2 className="text-2xl font-bold mb-6 text-blue-800">Available Travel Package</h2>

                        {/* ====== Package Summary ====== */}
                        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col gap-6 md:gap-8">

                            {/* Total Cost Summary */}
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

                            {/* ====== Flight Details ====== */}
                            <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✈️</span>
                                    <span className="font-semibold text-blue-800 text-lg">Flight Details</span>
                                </div>

                                {pkgResult.flight ? (
                                    <div className="flex flex-col gap-2 text-sm md:text-base">
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex-1 min-w-[180px]"><strong>Airline:</strong> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'N/A'} {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.number}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Departure:</strong> {new Date(pkgResult.flight.itineraries[0].segments[0].departure.at).toLocaleString()} – {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Arrival:</strong> {new Date(pkgResult.flight.itineraries[0].segments[0].arrival.at).toLocaleString()} – {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <div className="flex-1 min-w-[180px]"><strong>Stops:</strong> {pkgResult.flight.itineraries?.[0]?.segments?.length - 1}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Duration:</strong> {pkgResult.flight.itineraries?.[0]?.duration}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Baggage:</strong> {pkgResult.flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity ? 'Checked bag included' : 'Checked bag extra'}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">No flight details available.</div>
                                )}
                            </div>

                            {/* ====== Hotel Details ====== */}
                            <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">🏨</span>
                                    <span className="font-semibold text-blue-800 text-lg">Hotel Details</span>
                                </div>

                                {pkgResult.hotel ? (
                                    <div className="flex flex-col gap-2 text-sm md:text-base">
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex-1 min-w-[180px]"><strong>Hotel:</strong> {pkgResult.hotel.hotel?.name || 'N/A'}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>City:</strong> {pkgResult.hotel.hotel?.cityCode || 'N/A'}</div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <div className="flex-1 min-w-[180px]"><strong>Check-in:</strong> {pkgResult.hotel.offers?.[0]?.checkInDate}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Check-out:</strong> {pkgResult.hotel.offers?.[0]?.checkOutDate}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Room:</strong> {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.bedType || 'N/A'} {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.beds ? `, ${pkgResult.hotel.offers[0].room.typeEstimated.beds} bed(s)` : ''}</div>
                                        </div>

                                        <div className="flex flex-wrap gap-4 mt-2">
                                            <div className="flex-1 min-w-[180px]"><strong>Refund Policy:</strong> {pkgResult.hotel.policies?.cancellation?.description || 'N/A'}</div>
                                            <div className="flex-1 min-w-[180px]"><strong>Amenities:</strong> {pkgResult.hotel.offers?.[0]?.room?.description?.text || 'N/A'}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500">No hotel details available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );


};

export default PackageSearch;


// {/* <div>
//     {/* Travel Packages Tab UI */}
//     <h2 className="text-xl font-bold mb-4 text-blue-700">Search Travel Packages</h2>
//     {/* Form */}
//     <form className="grid gap-4 mb-6" onSubmit={handlePackageSearch}>
//         <div className="flex gap-2">
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Select your country</label>
//                 <Select
//                     options={countries}
//                     value={pkgCountry}
//                     onChange={handlePkgCountryChange}
//                     placeholder="Select your country"
//                     isClearable
//                     required
//                 />
//             </div>
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Select your city</label>
//                 <Select
//                     options={pkgCityOptions}
//                     value={pkgCity}
//                     onChange={setPkgCity}
//                     placeholder={pkgCityLoading ? 'Loading...' : 'Select your city'}
//                     isDisabled={!pkgCountry || pkgCityLoading}
//                     isClearable
//                     required
//                 />
//                 {pkgCityError && <div className="text-red-600 text-xs mt-1">{pkgCityError}</div>}
//             </div>
//         </div>
//         <div className="flex gap-2">
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Departure Date</label>
//                 <input type="date" value={pkgDepartDate} min={todayStr} onChange={e => setPkgDepartDate(e.target.value)} required className="input input-bordered w-full rounded shadow" />
//             </div>
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">To</label>
//                 <input type="text" value="DELHI" disabled className="input input-bordered w-full rounded shadow bg-gray-100 text-lg font-bold text-blue-900 cursor-not-allowed border-2 border-blue-300" />
//             </div>
//         </div>
//         <div className="flex gap-2">
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Hotel Check-in</label>
//                 <input type="date" value={pkgHotelFrom} min={todayStr} onChange={e => setPkgHotelFrom(e.target.value)} required className="input input-bordered w-full rounded shadow" />
//             </div>
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Hotel Check-out</label>
//                 <input type="date" value={pkgHotelTo} min={pkgHotelFrom} onChange={e => setPkgHotelTo(e.target.value)} required className="input input-bordered w-full rounded shadow" />
//             </div>
//         </div>
//         <div className="flex gap-2">
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Adults</label>
//                 <select value={pkgAdults} disabled className="input input-bordered w-full rounded shadow">
//                     <option>1</option>
//                 </select>
//             </div>
//             <div className="w-full">
//                 <label className="block text-base font-semibold text-blue-700 mb-2">Rooms</label>
//                 <select value={pkgRooms} disabled className="input input-bordered w-full rounded shadow">
//                     <option>1</option>
//                 </select>
//             </div>
//         </div>
//         <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg shadow-lg font-bold text-lg hover:bg-blue-700 transition" disabled={pkgLoading}>Search Flights + Hotels</button>
//     </form>
//     {pkgError && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 font-semibold">{pkgError}</div>}
//     {pkgLoading && <div className="text-blue-700 font-semibold text-center py-4">Loading package...</div>}
//     {pkgResult && (
//         <div className="bg-white rounded-xl shadow-lg p-6 mt-4 flex flex-col gap-6 md:gap-8">
//             {/* Total Package Summary */}
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
//                 <div className="flex items-center gap-3">
//                     <span className="text-2xl text-blue-700">💼</span>
//                     <span className="font-bold text-xl md:text-2xl text-blue-900">Total Package</span>
//                 </div>
//                 <div className="flex flex-col md:items-end">
//                     <span className="text-lg font-semibold text-blue-800">Flight: <span className="text-blue-600">${pkgResult.flightPriceUSD} USD</span></span>
//                     <span className="text-lg font-semibold text-blue-800">Hotel: <span className="text-blue-600">₹{pkgResult.hotelPriceINR} INR</span> <span className="text-gray-500">(≈ ${pkgResult.hotelPriceUSD} USD)</span></span>
//                     <span className="text-xl font-bold text-green-700 mt-1">Total: ${pkgResult.totalUSD} USD</span>
//                     <span className="text-xs text-gray-500">Exchange Rate: 1 USD = 88 INR</span>
//                 </div>
//             </div>
//             {/* Flight Details Card */}
//             <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
//                 <div className="flex items-center gap-2 mb-2">
//                     <span className="text-xl">✈️</span>
//                     <span className="font-semibold text-blue-800 text-lg">Flight Details</span>
//                 </div>
//                 {pkgResult.flight ? (
//                     <div className="flex flex-col gap-2">
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base">
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Airline:</span> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.carrierCode || 'N/A'} {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.number || ''}
//                             </div>
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Departure:</span> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.at ? new Date(pkgResult.flight.itineraries[0].segments[0].departure.at).toLocaleString() : 'N/A'} – {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || ''}, Terminal {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.departure?.terminal || ''}
//                             </div>
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Arrival:</span> {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.at ? new Date(pkgResult.flight.itineraries[0].segments[0].arrival.at).toLocaleString() : 'N/A'} – {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.iataCode || ''}, Terminal {pkgResult.flight.itineraries?.[0]?.segments?.[0]?.arrival?.terminal || ''}
//                             </div>
//                         </div>
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Stop:</span> {pkgResult.flight.itineraries?.[0]?.segments?.length > 1 ? pkgResult.flight.itineraries[0].segments.length - 1 : 0}
//                             </div>
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Duration:</span> {pkgResult.flight.itineraries?.[0]?.duration || 'N/A'}
//                             </div>
//                             <div className="flex-1 min-w-[180px] flex items-center gap-1">
//                                 <span className="font-medium">Baggage:</span> <span title="Cabin bag included">🧳</span> <span className="text-xs text-gray-500">Checked bag {pkgResult.flight.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.includedCheckedBags?.quantity ? 'included' : 'extra'}</span>
//                             </div>
//                         </div>
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
//                             <div className="flex-1 min-w-[180px] flex items-center gap-1">
//                                 <span className="font-medium">Amenities:</span> 🍽️ Complimentary Meal, 💺 Seat Selection
//                             </div>
//                         </div>
//                         <div className="flex gap-2 mt-4">
//                             <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Book Now</button>
//                             <button className="bg-white border border-blue-600 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">Add Baggage</button>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="text-gray-500">No flight details available.</div>
//                 )}
//             </div>
//             {/* Hotel Details Card */}
//             <div className="bg-blue-50 rounded-lg p-4 flex flex-col gap-2 shadow-sm">
//                 <div className="flex items-center gap-2 mb-2">
//                     <span className="text-xl">🏨</span>
//                     <span className="font-semibold text-blue-800 text-lg">Hotel Details</span>
//                 </div>
//                 {pkgResult.hotel ? (
//                     <div className="flex flex-col gap-2">
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base">
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Hotel:</span> {pkgResult.hotel.hotel?.name || 'N/A'}
//                             </div>
//                             <div className="flex-1 min-w-[180px] flex items-center gap-1">
//                                 <span className="font-medium">Location:</span> <span className="text-blue-700">📍</span> {pkgResult.hotel.hotel?.address?.cityName || 'N/A'}
//                             </div>
//                         </div>
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Check-in:</span> {pkgHotelFrom}
//                             </div>
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Check-out:</span> {pkgHotelTo}
//                             </div>
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Room:</span> {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.bedType || 'N/A'}, {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.roomType || ''} {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.beds ? `, ${pkgResult.hotel.offers[0].room.typeEstimated.beds} Bed(s)` : ''} {pkgResult.hotel.offers?.[0]?.room?.typeEstimated?.roomArea ? `, ${pkgResult.hotel.offers[0].room.typeEstimated.roomArea} sq ft` : ''}
//                             </div>
//                         </div>
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
//                             <div className="flex-1 min-w-[180px]">
//                                 <span className="font-medium">Refund Policy:</span> {pkgResult.hotel.policies?.cancellation?.description || 'See hotel details'}
//                             </div>
//                         </div>
//                         <div className="flex flex-wrap gap-4 text-sm md:text-base mt-2">
//                             <div className="flex-1 min-w-[180px] flex items-center gap-1">
//                                 <span className="font-medium">Amenities:</span> {pkgResult.hotel.offers?.[0]?.room?.description?.text || 'See hotel details'}
//                             </div>
//                         </div>
//                         <div className="flex gap-2 mt-4">
//                             <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Book Now</button>
//                             <button className="bg-white border border-blue-600 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition">Upgrade Room</button>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="text-gray-500">No hotel details available.</div>
//                 )}
//             </div>
//         </div>
//     )}
// </div> */}