// hotelSearchDelhi.js
// Fetches hotel offers in Delhi using Amadeus API
import axios from 'axios';
import { getAmadeusAccessToken } from './amadeusAuth';

const AMADEUS_HOTEL_SEARCH_URL = 'https://test.api.amadeus.com/v3/shopping/hotel-offers';

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get hotel IDs for Delhi
async function getDelhiHotelIds(accessToken) {
  const url = 'https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city';
  const params = { cityCode: 'DEL' };
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params,
  });
  // Return up to 20 hotel IDs (API limit)
  return response.data.data.map(hotel => hotel.hotelId).slice(0, 20);
}

export async function searchHotelsDelhi({ checkInDate, checkOutDate }) {
  try {
    const accessToken = await getAmadeusAccessToken();
    // Step 1: Get hotel IDs for Delhi
    const hotelIds = await getDelhiHotelIds(accessToken);
    if (!hotelIds.length) throw new Error('No hotels found for Delhi');
    // Step 2: Search hotel offers using hotelIds
    const params = {
      hotelIds: hotelIds.join(','),
      checkInDate: formatDate(checkInDate),
      checkOutDate: formatDate(checkOutDate),
      adults: 1,
      roomQuantity: 1,
    };
    const response = await axios.get(AMADEUS_HOTEL_SEARCH_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.errors?.[0]?.detail || 'Failed to fetch hotel offers'
    );
  }
}
