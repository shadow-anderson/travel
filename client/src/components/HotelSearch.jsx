import { useState, useEffect, use } from 'react';
import Select from 'react-select';
import { countries } from '../data/countries';
import { fetchAirportsByCountry, searchFlights } from '../services/amadeusService';
import { UserIcon, MapPinIcon, CalendarDaysIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { searchHotelsDelhi } from '../services/hotelSearchDelhi.js';

const HotelDetails = ({ hotelData }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Helper function to format date-time
    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const { hotel, offers } = hotelData;
    const { room, price, policies } = offers[0];

    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            {/* Hotel Summary - Always Visible */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <p className="text-sm text-gray-600">Hotel</p>
                    <p className="font-medium">{hotel.name}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Check In Date</p>
                    <p className="font-medium">{offers[0].checkInDate}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Check Out Date</p>
                    <p className="font-medium">{offers[0].checkOutDate}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-medium">{price.total} {price.currency}</p>
                </div>
            </div>

            {/* Expandable Detailed Information */}
            {isExpanded && (
                <div className="mt-4 border-t pt-4">
                    {/* Itineraries */}
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold text-blue-800 mb-3">Policy Details</h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 text-gray-800 text-sm">

                            {/* Refundable Info */}
                            {policies.refundable.cancellationRefund && (<p>
                                <span className="font-medium">Refund Policy:</span>{' '}
                                {policies.refundable?.cancellationRefund === 'REFUNDABLE_UP_TO_DEADLINE'
                                    ? 'Refundable up to the cancellation deadline'
                                    : 'Non-refundable'}
                            </p>)}


                            {/* Cancellation Policy */}
                            {policies.cancellations?.length > 0 && (
                                <div>
                                    <p className="font-medium">Cancellation Policy:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {policies.cancellations.map((cancel, index) => (
                                            <li key={index}>
                                                {cancel.policyType.replaceAll('_', ' ')} allowed until{' '}
                                                <span className="text-blue-700 font-medium">
                                                    {new Date(cancel.deadline).toLocaleString()}
                                                </span>{' '}
                                                ({cancel.numberOfNights} night{cancel.numberOfNights > 1 ? 's' : ''} charged if cancelled after)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Payment Methods */}
                            {/* <p>
                                <span className="font-medium">Payment Method:</span>{' '}
                                {policies.guarantee?.paymentType?.toUpperCase() || 'N/A'} — Accepted via:{' '}
                                {policies.guarantee?.methods?.join(', ') || 'N/A'}
                            </p> */}

                            {/* Accepted Cards */}
                            {/* {policies.guarantee?.creditCardPolicies?.length > 0 && (
                                <div>
                                    <p className="font-medium">Accepted Credit Cards:</p>
                                    <ul className="flex flex-wrap gap-2 mt-1">
                                        {policies.guarantee.creditCardPolicies.map((card, index) => (
                                            <li
                                                key={index}
                                                className="bg-white border border-gray-300 px-3 py-1 rounded-md text-gray-700 text-xs shadow-sm"
                                            >
                                                {card.vendorCode}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )} */}
                        </div>
                    </div>


                    {/* Price Details */}
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold text-blue-800 mb-2">Price Details</h4>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-800 space-y-2">

                            <p>
                                <span className="font-medium">Base Price:</span>{' '}
                                ₹{Number(price.base).toLocaleString()} {price.currency}
                            </p>

                            {price.taxes?.length > 0 && (
                                <>
                                    <p className="font-medium mt-2">Taxes:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {price.taxes.map((tax, index) => (
                                            <li key={index}>
                                                <strong>{tax.code.replaceAll('_', ' ')}:</strong>{' '}
                                                {tax.percentage}% —{' '}
                                                {tax.included ? (
                                                    <span className="text-green-700">Included</span>
                                                ) : (
                                                    <span className="text-red-700">Not Included</span>
                                                )}
                                                {tax.pricingFrequency && (
                                                    <> | <span className="italic">{tax.pricingFrequency}</span></>
                                                )}
                                                {tax.pricingMode && (
                                                    <> | <span className="italic">{tax.pricingMode}</span></>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}

                            <p className="font-bold text-blue-700 mt-2">
                                Total Price: ₹{Number(price.total).toLocaleString()} {price.currency}
                            </p>
                        </div>
                    </div>



                    {/* Fare Details */}
                    <div className="mb-4">
                        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
                            <h4 className="text-lg font-semibold text-blue-800 mb-4">Room Details</h4>

                            <div className="space-y-2 text-gray-800">
                                {
                                    room.type && (<p>
                                        <span className="font-medium text-gray-700">Room Type:</span>{' '}
                                        {room.type || 'N/A'}
                                    </p>)
                                }

                                {
                                    room.typeEstimated
                                        .category && (<p>
                                            <span className="font-medium text-gray-700">Room Category:</span>{' '}
                                            {room.typeEstimated
                                                .category || 'N/A'}
                                        </p>)
                                }

                                {
                                    room.typeEstimated.beds && (<p>
                                        <span className="font-medium text-gray-700">Bed Type:</span>{' '}
                                        {room.typeEstimated?.bedType || 'N/A'} ({room.typeEstimated?.beds} Bed{offers[0].room.typeEstimated?.beds > 1 ? 's' : ''})
                                    </p>)
                                }

                                {
                                    room.description && (<div>
                                        <span className="font-medium text-gray-700 block">Description:</span>
                                        <p className="whitespace-pre-line text-sm bg-gray-50 p-2 rounded-md border border-gray-200">
                                            {room.description?.text || 'No description available.'}
                                        </p>
                                    </div>)
                                }
                            </div>
                        </div>
                    </div>

                    {/* Raw JSON Data */}
                    <div>
                        {/* <h4 className="font-semibold mb-2">Raw Data</h4>
                        <div className="bg-gray-50 p-2 rounded overflow-x-auto">
                            <pre className="text-xs">{JSON.stringify(flight, null, 2)}</pre>
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
};

const HotelSearch = () => {

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

    // State for hotel search
    const [hotelLoading, setHotelLoading] = useState(false);
    const [hotelError, setHotelError] = useState('');
    const [hotelResults, setHotelResults] = useState([]);

    const adultOptions = [1, 2, 3, 4, 5].map((num) => ({
        label: `${num} ${num === 1 ? "Adult" : "Adults"}`,
        value: num
    }));

    const roomOptions = [1, 2, 3, 4, 5].map((num) => ({
        label: `${num} ${num === 1 ? "Room" : "Rooms"
            }`,
        value: num
    }));


    const [formData, setFormData] = useState({
        from: null,  // This will store the selected country
        city: null,
        to: 'Delhi',
        checkInDate: todayStr,
        checkOutDate: tomorrowStr,
        passengers: 1
    });
    const [cityError, setCityError] = useState(null);
    const [cityOptions, setCityOptions] = useState([]);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Variables to always hold the selected city and departure date
    const selectedCity = formData.city;

    const validateForm = () => {
        setSearchError(null);
        if (!formData.city) {
            setSearchError('Please select a valid city');
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSearching(true);
        handleHotelSearch();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    async function handleHotelSearch() {
        // console.log('Form Data:', formData);
        setHotelLoading(true);
        setHotelError('');
        setHotelResults(null);
        try {
            const data = await searchHotelsDelhi({
                checkInDate: formData.checkInDate,
                checkOutDate: formData.checkOutDate,
            });
            setHotelResults(data.data);
            setIsSearching(false);
        } catch (err) {
            setIsSearching(false);
            setHotelError(err.message || 'Failed to fetch hotels');
        } finally {
            setHotelLoading(false);
        }
    }

    // Calculate min for 'To' date (one day after 'From' or tomorrow)
    function getToMinDate(checkIn = formData.checkInDate) {
        const from = new Date(checkIn);
        from.setDate(from.getDate() + 1);
        return from.toISOString().split('T')[0];
    }


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

    const handleCheckInDateChange = (e) => {
        const value = e.target.value;
        const toMinDate = getToMinDate(value); // returns 1 day after check-in

        setFormData((prev) => ({
            ...prev,
            checkInDate: value,
            checkOutDate:
                !prev.checkOutDate || new Date(prev.checkOutDate) <= new Date(value)
                    ? toMinDate
                    : prev.checkOutDate
        }));
    };



    // useEffect(() => {
    //     console.log("Form Data Updated:", formData);
    // }, [formData]);


    const handleCheckOutDateChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            checkOutDate: value
        }));
        // selectedToDate will always reflect the latest date
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
                    <span className="text-3xl">🏨</span> Book Your Hotels
                </h1>
                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-1 text-sm font-semibold text-gray-900 mb-2">
                                <UserIcon className="h-5 w-5 text-blue-400" /> Select your country
                            </label>
                            <Select
                                isDisabled={true}
                                options={countries}
                                value={formData.from}
                                onChange={handleCountryChange}
                                styles={customStyles}
                                placeholder="India" // Default to India
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
                                value={formData.city || "DELHI"}
                                onChange={handleCityChange}
                                options={cityOptions}
                                styles={customStyles}
                                placeholder="Delhi" // Default to Delhi
                                // placeholder={formData.from ? (isLoadingCities ? 'Loading cities...' : 'Select city') : 'Select a country first'}
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
                                <CalendarDaysIcon className="h-5 w-5 text-blue-400" /> From Date
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
                                <CalendarDaysIcon className="h-5 w-5 text-blue-400" /> To Date
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
                                    Searching Hotels...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="text-3xl">🏨</span> Search Hotels
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Hotel Results Section */}
                {isSearching && (
                    <div className="mt-10 text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="mt-3 text-blue-700 font-medium">Searching for Hotels...</p>
                    </div>
                )}

                {!isSearching && hotelError && (
                    <div className="mt-10 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 font-semibold">{hotelError}</p>
                    </div>
                )}

                {!isSearching && !hotelError && !Array.isArray(hotelResults) && (
                    <div className="mt-10 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 font-semibold">
                            Unexpected response from the server. Please try again later.
                        </p>
                    </div>
                )}

                {!isSearching && Array.isArray(hotelResults) && hotelResults.length === 0 && (
                    <div className="mt-10 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <p className="text-yellow-700 font-semibold">No Hotels found for the selected criteria.</p>
                    </div>
                )}

                {!isSearching && Array.isArray(hotelResults) && hotelResults.length > 0 && (
                    <div className="mt-10">
                        <h2 className="text-2xl font-bold mb-6 text-blue-800">Available Hotels ({hotelResults.length})</h2>
                        <div className="space-y-6">
                            {hotelResults.map((hotelData, index) => (
                                <HotelDetails key={index} hotelData={hotelData} />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default HotelSearch;