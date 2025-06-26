// amadeusAuth.js
// Handles OAuth2 authentication for Amadeus API
import axios from 'axios';

// Use environment variables for Amadeus credentials
const AMADEUS_CLIENT_ID = import.meta.env.VITE_AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = import.meta.env.VITE_AMADEUS_CLIENT_SECRET;
const AMADEUS_AUTH_URL = 'https://test.api.amadeus.com/v1/security/oauth2/token';

export async function getAmadeusAccessToken() {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', AMADEUS_CLIENT_ID);
    params.append('client_secret', AMADEUS_CLIENT_SECRET);

    const response = await axios.post(AMADEUS_AUTH_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data.access_token;
  } catch (error) {
    throw new Error('Failed to get Amadeus access token');
  }
}
