import axios from 'axios';

const API_BASE_URL = 'https://travel-9qtu.onrender.com';

export const fetchAirportsByCountry = async (country) => {
  try {
    // Pass country name directly to backend
    const response = await axios.get(`${API_BASE_URL}/api/airports`, {
      params: { country }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching airports:', error);
    throw error;
  }
};

export const searchFlights = async (params) => {
  try {
    // Validate required parameters
    if (!params.selectedCity || !params.selectedDepartureDate) {
      throw new Error('Missing required parameters: selectedCity and selectedDepartureDate are required');
    }

    console.log('Searching flights with params:', {
      selectedCity: params.selectedCity,
      departureDate: params.selectedDepartureDate,
      adults: params.adults || 1
    });

    const response = await axios.get(`${API_BASE_URL}/flights`, {
      params: {
        selectedCity: params.selectedCity,
        destinationLocationCode: 'DEL', // Default to Delhi
        selectedDepartureDate: params.selectedDepartureDate,
        adults: params.adults || 1,
        currencyCode: params.currencyCode || 'USD'
      }
    });

    if (!response.data) {
      throw new Error('No data received from the server');
    }

    return response.data;
  } catch (error) {
    console.error('Error searching flights:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Throw a user-friendly error message
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error('Failed to search flights. Please try again later.');
    }
  }
};
