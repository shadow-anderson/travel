const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Configure dotenv with explicit path to .env file
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

const amadeusService = require('./services/amadeusService');

// Debug: Log environment variables
console.log('Environment Variables Check:');
console.log('AMADEUS_API_URL:', process.env.AMADEUS_API_URL);
console.log('AMADEUS_CLIENT_ID:', process.env.AMADEUS_CLIENT_ID ? '✓ Present' : '✗ Missing');
console.log('AMADEUS_CLIENT_SECRET:', process.env.AMADEUS_CLIENT_SECRET ? '✓ Present' : '✗ Missing');

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running successfully!' });
});

// Add request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Remove obsolete cities endpoint since we're using airports endpoint with Amadeus API

// Flight search endpoint
app.get('/api/flights', async (req, res) => {
    try {
        const { selectedCity, destinationLocationCode, selectedDepartureDate, adults, currencyCode } = req.query;

        // Validate required parameters
        if (!selectedCity || !selectedDepartureDate) {
            return res.status(400).json({
                error: 'Missing required parameters. Please provide selectedCity and selectedDepartureDate'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(selectedDepartureDate)) {
            return res.status(400).json({
                error: 'Invalid date format. Please use YYYY-MM-DD format'
            });
        }

        const flights = await amadeusService.searchFlights({
            selectedCity,
            destinationLocationCode,
            selectedDepartureDate,
            adults: parseInt(adults) || 1,
            currencyCode: currencyCode || 'USD'
        });

        res.json(flights);
    } catch (error) {
        console.error('Error in /api/flights:', error);
        res.status(500).json({
            error: error.message || 'Internal server error'
        });
    }
});

// Endpoint to fetch airports by country
app.get('/api/airports', async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) {
            return res.status(400).json({ error: 'Country parameter is required' });
        }

        // Get airports using Amadeus API
        const airports = await amadeusService.searchAirports(country);
        res.json(airports);
    } catch (error) {
        console.error('Error fetching airports:', error.message);
        res.status(500).json({ error: 'Failed to fetch airports' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
