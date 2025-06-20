const axios = require('axios');
const qs = require('querystring');

class AmadeusService {
    constructor() {
        // Move environment variable access to a method that's called after dotenv is configured
        this.initializeCredentials();
        this.accessToken = null;
        this.tokenExpiration = null;
    }

    initializeCredentials() {
        this.baseURL = process.env.AMADEUS_API_URL;
        this.clientId = process.env.AMADEUS_CLIENT_ID;
        this.clientSecret = process.env.AMADEUS_CLIENT_SECRET;

        if (!this.baseURL || !this.clientId || !this.clientSecret) {
            throw new Error('Missing required Amadeus API credentials in environment variables');
        }
    }

    async getAccessToken() {
        try {
            const response = await axios.post(
                `${this.baseURL}/v1/security/oauth2/token`,
                qs.stringify({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            this.accessToken = response.data.access_token;
            // Set token expiration (usually 30 minutes, but we'll check every time to be safe)
            this.tokenExpiration = new Date(Date.now() + (response.data.expires_in * 1000));
            return this.accessToken;
        } catch (error) {
            console.error('Error getting Amadeus access token:', error.message);
            throw new Error('Failed to authenticate with Amadeus API');
        }
    }

    async ensureValidToken() {
        // If we don't have a token or it's expired/about to expire, get a new one
        if (!this.accessToken || !this.tokenExpiration || this.tokenExpiration <= new Date()) {
            await this.getAccessToken();
        }
        return this.accessToken;
    }    async searchFlights(params) {
        try {
            console.log('Searching flights with params:', params);
            const token = await this.ensureValidToken();
            
            // Validate required parameters
            if (!params.selectedCity || !params.selectedDepartureDate) {
                throw new Error('Missing required parameters: selectedCity and selectedDepartureDate are required');
            }

            // Format the date to YYYY-MM-DD
            const formattedDate = new Date(params.selectedDepartureDate).toISOString().split('T')[0];

            const searchParams = {
                originLocationCode: params.selectedCity,
                destinationLocationCode: params.destinationLocationCode || 'DEL',
                departureDate: formattedDate,
                adults: params.adults || 1,
                currencyCode: params.currencyCode || 'USD',
                max: 5
            };

            console.log('Making request to Amadeus API with params:', searchParams);

            const response = await axios.get(
                `${this.baseURL}/v2/shopping/flight-offers`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    params: searchParams
                }
            );

            if (!response.data || !response.data.data) {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response from Amadeus API');
            }

            const flights = response.data.data.slice(0, 5);
            console.log(`Successfully retrieved ${flights.length} flights`);
            return flights;

        } catch (error) {
            console.error('Detailed error in searchFlights:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                config: {
                    url: error.config?.url,
                    params: error.config?.params,
                    headers: error.config?.headers
                }
            });

            // Throw a more informative error
            if (error.response?.data?.errors?.[0]?.detail) {
                throw new Error(`Amadeus API Error: ${error.response.data.errors[0].detail}`);
            } else if (error.response?.status === 401) {
                throw new Error('Authentication failed with Amadeus API');
            } else if (error.response?.status === 400) {
                throw new Error('Invalid request parameters');
            } else {
                throw new Error(`Failed to search flights: ${error.message}`);
            }
        }
    }
}

module.exports = new AmadeusService();
