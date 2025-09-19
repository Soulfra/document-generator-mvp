#!/usr/bin/env node

/**
 * 🌦️ WEATHER SERVICE AGGREGATOR
 * Multi-API weather service for location-based AR gaming
 * Integration: Virtual phone interface, area code mapping, gaming mechanics
 * APIs: Weather.gov, Open-Meteo, OpenWeatherMap, WeatherAPI
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();

// Configuration
const CONFIG = {
    port: process.env.WEATHER_PORT || 3011,
    host: process.env.WEATHER_HOST || 'localhost',
    apis: {
        weatherGov: {
            baseUrl: 'https://api.weather.gov',
            rateLimit: 5000, // 5 seconds between requests
            regions: ['US'],
            features: ['current', 'forecast', 'alerts', 'radar']
        },
        openMeteo: {
            baseUrl: 'https://api.open-meteo.com/v1',
            rateLimit: 1000, // 1 second between requests
            regions: ['global'],
            features: ['current', 'forecast', 'historical', 'air_quality']
        },
        openWeatherMap: {
            baseUrl: 'https://api.openweathermap.org/data/2.5',
            apiKey: process.env.OPENWEATHER_API_KEY,
            rateLimit: 1000,
            regions: ['global'],
            features: ['current', 'forecast', 'historical', 'air_quality', 'uv']
        },
        weatherAPI: {
            baseUrl: 'https://api.weatherapi.com/v1',
            apiKey: process.env.WEATHERAPI_KEY,
            rateLimit: 1000,
            regions: ['global'],
            features: ['current', 'forecast', 'alerts', 'sports']
        }
    },
    cache: {
        current: 600, // 10 minutes
        forecast: 3600, // 1 hour
        alerts: 300, // 5 minutes
        historical: 86400 // 24 hours
    }
};

// Middleware
app.use(cors());
app.use(express.json());

// Weather Cache Manager
class WeatherCacheManager {
    constructor() {
        this.cache = new Map();
        this.lastRequests = new Map();
    }
    
    generateKey(service, endpoint, params) {
        const paramString = JSON.stringify(params);
        const hash = crypto.createHash('md5').update(`${service}:${endpoint}:${paramString}`).digest('hex');
        return hash;
    }
    
    get(service, endpoint, params) {
        const key = this.generateKey(service, endpoint, params);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        
        return null;
    }
    
    set(service, endpoint, params, data, ttl = 600000) {
        const key = this.generateKey(service, endpoint, params);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    
    canMakeRequest(service) {
        const lastRequest = this.lastRequests.get(service);
        const rateLimit = CONFIG.apis[service]?.rateLimit || 1000;
        
        if (!lastRequest || Date.now() - lastRequest >= rateLimit) {
            this.lastRequests.set(service, Date.now());
            return true;
        }
        
        return false;
    }
    
    clearExpired() {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp >= cached.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

const weatherCache = new WeatherCacheManager();

// Weather API Clients
class WeatherGovClient {
    constructor() {
        this.baseUrl = CONFIG.apis.weatherGov.baseUrl;
    }
    
    async getCurrentWeather(lat, lng) {
        try {
            // Get grid point for coordinates
            const gridResponse = await fetch(`${this.baseUrl}/points/${lat},${lng}`);
            const gridData = await gridResponse.json();
            
            if (!gridData.properties) {
                throw new Error('Invalid grid response');
            }
            
            // Get current observations
            const observationUrl = gridData.properties.observationStations;
            const stationsResponse = await fetch(observationUrl);
            const stationsData = await stationsResponse.json();
            
            if (stationsData.features && stationsData.features.length > 0) {
                const stationId = stationsData.features[0].properties.stationIdentifier;
                const obsResponse = await fetch(`${this.baseUrl}/stations/${stationId}/observations/latest`);
                const obsData = await obsResponse.json();
                
                return this.formatCurrentWeather(obsData.properties);
            }
            
            throw new Error('No observation stations found');
        } catch (error) {
            console.error('Weather.gov current weather error:', error);
            return null;
        }
    }
    
    async getForecast(lat, lng) {
        try {
            const gridResponse = await fetch(`${this.baseUrl}/points/${lat},${lng}`);
            const gridData = await gridResponse.json();
            
            const forecastUrl = gridData.properties.forecast;
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            return this.formatForecast(forecastData.properties.periods);
        } catch (error) {
            console.error('Weather.gov forecast error:', error);
            return null;
        }
    }
    
    async getAlerts(lat, lng) {
        try {
            const alertsResponse = await fetch(`${this.baseUrl}/alerts/active?point=${lat},${lng}`);
            const alertsData = await alertsResponse.json();
            
            return this.formatAlerts(alertsData.features || []);
        } catch (error) {
            console.error('Weather.gov alerts error:', error);
            return [];
        }
    }
    
    formatCurrentWeather(data) {
        return {
            source: 'weather.gov',
            temperature: this.celsiusToFahrenheit(data.temperature?.value),
            humidity: data.relativeHumidity?.value,
            windSpeed: this.mpsToMph(data.windSpeed?.value),
            windDirection: data.windDirection?.value,
            pressure: data.barometricPressure?.value,
            visibility: data.visibility?.value,
            description: data.textDescription,
            timestamp: data.timestamp,
            dewPoint: this.celsiusToFahrenheit(data.dewpoint?.value)
        };
    }
    
    formatForecast(periods) {
        return periods.slice(0, 14).map(period => ({
            name: period.name,
            temperature: period.temperature,
            temperatureUnit: period.temperatureUnit,
            windSpeed: period.windSpeed,
            windDirection: period.windDirection,
            shortForecast: period.shortForecast,
            detailedForecast: period.detailedForecast,
            startTime: period.startTime,
            endTime: period.endTime,
            isDaytime: period.isDaytime
        }));
    }
    
    formatAlerts(features) {
        return features.map(alert => ({
            id: alert.properties.id,
            title: alert.properties.headline,
            description: alert.properties.description,
            severity: alert.properties.severity,
            urgency: alert.properties.urgency,
            certainty: alert.properties.certainty,
            event: alert.properties.event,
            areaDesc: alert.properties.areaDesc,
            effective: alert.properties.effective,
            expires: alert.properties.expires
        }));
    }
    
    celsiusToFahrenheit(celsius) {
        if (celsius === null || celsius === undefined) return null;
        return Math.round((celsius * 9/5) + 32);
    }
    
    mpsToMph(mps) {
        if (mps === null || mps === undefined) return null;
        return Math.round(mps * 2.237);
    }
}

class OpenMeteoClient {
    constructor() {
        this.baseUrl = CONFIG.apis.openMeteo.baseUrl;
    }
    
    async getCurrentWeather(lat, lng) {
        try {
            const params = new URLSearchParams({
                latitude: lat,
                longitude: lng,
                current_weather: 'true',
                hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
                timezone: 'auto'
            });
            
            const response = await fetch(`${this.baseUrl}/forecast?${params}`);
            const data = await response.json();
            
            return this.formatCurrentWeather(data.current_weather, data.hourly);
        } catch (error) {
            console.error('Open-Meteo current weather error:', error);
            return null;
        }
    }
    
    async getForecast(lat, lng, days = 7) {
        try {
            const params = new URLSearchParams({
                latitude: lat,
                longitude: lng,
                daily: 'temperature_2m_max,temperature_2m_min,weathercode,wind_speed_10m_max,wind_direction_10m_dominant',
                timezone: 'auto',
                forecast_days: days
            });
            
            const response = await fetch(`${this.baseUrl}/forecast?${params}`);
            const data = await response.json();
            
            return this.formatForecast(data.daily);
        } catch (error) {
            console.error('Open-Meteo forecast error:', error);
            return null;
        }
    }
    
    async getAirQuality(lat, lng) {
        try {
            const params = new URLSearchParams({
                latitude: lat,
                longitude: lng,
                current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,dust',
                timezone: 'auto'
            });
            
            const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
            const data = await response.json();
            
            return this.formatAirQuality(data.current);
        } catch (error) {
            console.error('Open-Meteo air quality error:', error);
            return null;
        }
    }
    
    formatCurrentWeather(current, hourly) {
        return {
            source: 'open-meteo',
            temperature: Math.round((current.temperature * 9/5) + 32), // Convert to Fahrenheit
            windSpeed: Math.round(current.windspeed * 0.621371), // Convert to mph
            windDirection: current.winddirection,
            weatherCode: current.weathercode,
            description: this.getWeatherDescription(current.weathercode),
            timestamp: current.time,
            humidity: hourly?.relative_humidity_2m?.[0] || null
        };
    }
    
    formatForecast(daily) {
        return daily.time.map((time, index) => ({
            date: time,
            temperatureMax: Math.round((daily.temperature_2m_max[index] * 9/5) + 32),
            temperatureMin: Math.round((daily.temperature_2m_min[index] * 9/5) + 32),
            weatherCode: daily.weathercode[index],
            description: this.getWeatherDescription(daily.weathercode[index]),
            windSpeed: Math.round(daily.wind_speed_10m_max[index] * 0.621371),
            windDirection: daily.wind_direction_10m_dominant[index]
        }));
    }
    
    formatAirQuality(current) {
        return {
            pm10: current.pm10,
            pm2_5: current.pm2_5,
            carbonMonoxide: current.carbon_monoxide,
            nitrogenDioxide: current.nitrogen_dioxide,
            ozone: current.ozone,
            dust: current.dust,
            aqi: this.calculateAQI(current)
        };
    }
    
    getWeatherDescription(weatherCode) {
        const codes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            95: 'Thunderstorm',
            96: 'Thunderstorm with hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return codes[weatherCode] || 'Unknown';
    }
    
    calculateAQI(airQuality) {
        // Simplified AQI calculation based on PM2.5
        const pm25 = airQuality.pm2_5;
        if (pm25 <= 12) return { value: Math.round(pm25 * 4.17), category: 'Good' };
        if (pm25 <= 35.4) return { value: Math.round(50 + (pm25 - 12) * 1.98), category: 'Moderate' };
        if (pm25 <= 55.4) return { value: Math.round(100 + (pm25 - 35.4) * 2.5), category: 'Unhealthy for Sensitive' };
        if (pm25 <= 150.4) return { value: Math.round(150 + (pm25 - 55.4) * 0.84), category: 'Unhealthy' };
        return { value: 300, category: 'Very Unhealthy' };
    }
}

class OpenWeatherMapClient {
    constructor() {
        this.baseUrl = CONFIG.apis.openWeatherMap.baseUrl;
        this.apiKey = CONFIG.apis.openWeatherMap.apiKey;
    }
    
    async getCurrentWeather(lat, lng) {
        if (!this.apiKey) {
            console.warn('OpenWeatherMap API key not configured');
            return null;
        }
        
        try {
            const params = new URLSearchParams({
                lat,
                lon: lng,
                appid: this.apiKey,
                units: 'imperial'
            });
            
            const response = await fetch(`${this.baseUrl}/weather?${params}`);
            const data = await response.json();
            
            return this.formatCurrentWeather(data);
        } catch (error) {
            console.error('OpenWeatherMap current weather error:', error);
            return null;
        }
    }
    
    async getForecast(lat, lng) {
        if (!this.apiKey) return null;
        
        try {
            const params = new URLSearchParams({
                lat,
                lon: lng,
                appid: this.apiKey,
                units: 'imperial'
            });
            
            const response = await fetch(`${this.baseUrl}/forecast?${params}`);
            const data = await response.json();
            
            return this.formatForecast(data.list);
        } catch (error) {
            console.error('OpenWeatherMap forecast error:', error);
            return null;
        }
    }
    
    async getUVIndex(lat, lng) {
        if (!this.apiKey) return null;
        
        try {
            const params = new URLSearchParams({
                lat,
                lon: lng,
                appid: this.apiKey
            });
            
            const response = await fetch(`${this.baseUrl}/uvi?${params}`);
            const data = await response.json();
            
            return {
                uvIndex: data.value,
                risk: this.getUVRiskLevel(data.value),
                timestamp: new Date(data.date * 1000).toISOString()
            };
        } catch (error) {
            console.error('OpenWeatherMap UV index error:', error);
            return null;
        }
    }
    
    formatCurrentWeather(data) {
        return {
            source: 'openweathermap',
            temperature: Math.round(data.main.temp),
            feelsLike: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: Math.round(data.wind.speed),
            windDirection: data.wind.deg,
            visibility: data.visibility,
            description: data.weather[0].description,
            main: data.weather[0].main,
            icon: data.weather[0].icon,
            clouds: data.clouds.all,
            timestamp: new Date(data.dt * 1000).toISOString(),
            sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
            sunset: new Date(data.sys.sunset * 1000).toISOString()
        };
    }
    
    formatForecast(list) {
        return list.slice(0, 40).map(item => ({
            datetime: new Date(item.dt * 1000).toISOString(),
            temperature: Math.round(item.main.temp),
            feelsLike: Math.round(item.main.feels_like),
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            windSpeed: Math.round(item.wind.speed),
            windDirection: item.wind.deg,
            description: item.weather[0].description,
            main: item.weather[0].main,
            icon: item.weather[0].icon,
            clouds: item.clouds.all,
            pop: item.pop // Probability of precipitation
        }));
    }
    
    getUVRiskLevel(uvIndex) {
        if (uvIndex <= 2) return 'Low';
        if (uvIndex <= 5) return 'Moderate';
        if (uvIndex <= 7) return 'High';
        if (uvIndex <= 10) return 'Very High';
        return 'Extreme';
    }
}

// Weather Service Aggregator
class WeatherServiceAggregator {
    constructor() {
        this.clients = {
            weatherGov: new WeatherGovClient(),
            openMeteo: new OpenMeteoClient(),
            openWeatherMap: new OpenWeatherMapClient()
        };
        
        this.preferences = {
            current: ['openMeteo', 'weatherGov', 'openWeatherMap'],
            forecast: ['weatherGov', 'openMeteo', 'openWeatherMap'],
            alerts: ['weatherGov'],
            airQuality: ['openMeteo'],
            uv: ['openWeatherMap']
        };
    }
    
    async getCurrentWeather(lat, lng, options = {}) {
        const cacheKey = `current:${lat}:${lng}`;
        const cached = weatherCache.get('aggregated', 'current', { lat, lng });
        
        if (cached && !options.force) {
            return cached;
        }
        
        const results = [];
        const clients = options.clients || this.preferences.current;
        
        for (const clientName of clients) {
            if (!weatherCache.canMakeRequest(clientName)) {
                console.log(`Rate limited: ${clientName}`);
                continue;
            }
            
            try {
                const client = this.clients[clientName];
                if (client && client.getCurrentWeather) {
                    const result = await client.getCurrentWeather(lat, lng);
                    if (result) {
                        results.push(result);
                    }
                }
            } catch (error) {
                console.error(`Error from ${clientName}:`, error);
            }
        }
        
        const aggregated = this.aggregateCurrentWeather(results);
        
        if (aggregated) {
            weatherCache.set('aggregated', 'current', { lat, lng }, aggregated, CONFIG.cache.current * 1000);
        }
        
        return aggregated;
    }
    
    async getForecast(lat, lng, options = {}) {
        const cached = weatherCache.get('aggregated', 'forecast', { lat, lng });
        
        if (cached && !options.force) {
            return cached;
        }
        
        const results = [];
        const clients = options.clients || this.preferences.forecast;
        
        for (const clientName of clients) {
            if (!weatherCache.canMakeRequest(clientName)) continue;
            
            try {
                const client = this.clients[clientName];
                if (client && client.getForecast) {
                    const result = await client.getForecast(lat, lng);
                    if (result && result.length > 0) {
                        results.push({ source: clientName, data: result });
                    }
                }
            } catch (error) {
                console.error(`Forecast error from ${clientName}:`, error);
            }
        }
        
        const aggregated = this.aggregateForecast(results);
        
        if (aggregated) {
            weatherCache.set('aggregated', 'forecast', { lat, lng }, aggregated, CONFIG.cache.forecast * 1000);
        }
        
        return aggregated;
    }
    
    async getAlerts(lat, lng, options = {}) {
        try {
            if (weatherCache.canMakeRequest('weatherGov')) {
                const alerts = await this.clients.weatherGov.getAlerts(lat, lng);
                weatherCache.set('aggregated', 'alerts', { lat, lng }, alerts, CONFIG.cache.alerts * 1000);
                return alerts;
            }
        } catch (error) {
            console.error('Alerts error:', error);
        }
        
        return [];
    }
    
    async getGameRelevantWeather(lat, lng, activity = 'tennis') {
        const current = await this.getCurrentWeather(lat, lng);
        const forecast = await this.getForecast(lat, lng);
        const alerts = await this.getAlerts(lat, lng);
        
        const airQuality = await this.clients.openMeteo.getAirQuality(lat, lng);
        const uvIndex = await this.clients.openWeatherMap.getUVIndex(lat, lng);
        
        return {
            current,
            forecast,
            alerts,
            airQuality,
            uvIndex,
            playability: this.calculatePlayability(current, alerts, activity),
            recommendations: this.generateRecommendations(current, forecast, alerts, activity)
        };
    }
    
    aggregateCurrentWeather(results) {
        if (results.length === 0) return null;
        
        // Use the first successful result as base, merge additional data
        const base = results[0];
        
        // Average temperature if multiple sources
        if (results.length > 1) {
            const temps = results.filter(r => r.temperature).map(r => r.temperature);
            if (temps.length > 1) {
                base.temperature = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
                base.sources = results.map(r => r.source);
            }
        }
        
        base.aggregated = true;
        base.timestamp = new Date().toISOString();
        
        return base;
    }
    
    aggregateForecast(results) {
        if (results.length === 0) return null;
        
        // Prefer Weather.gov for US locations, Open-Meteo for others
        const preferred = results.find(r => r.source === 'weatherGov') || results[0];
        
        return {
            source: preferred.source,
            data: preferred.data,
            sources: results.map(r => r.source),
            aggregated: true,
            timestamp: new Date().toISOString()
        };
    }
    
    calculatePlayability(weather, alerts, activity) {
        let score = 100;
        let factors = [];
        
        if (!weather) return { score: 0, factors: ['No weather data'], level: 'unplayable' };
        
        // Temperature factors
        if (weather.temperature < 40) {
            score -= 30;
            factors.push('Very cold');
        } else if (weather.temperature < 50) {
            score -= 15;
            factors.push('Cold');
        } else if (weather.temperature > 95) {
            score -= 25;
            factors.push('Very hot');
        } else if (weather.temperature > 85) {
            score -= 10;
            factors.push('Hot');
        }
        
        // Wind factors
        if (weather.windSpeed > 25) {
            score -= 30;
            factors.push('Very windy');
        } else if (weather.windSpeed > 15) {
            score -= 15;
            factors.push('Windy');
        }
        
        // Precipitation factors
        if (weather.description && weather.description.toLowerCase().includes('rain')) {
            score -= 50;
            factors.push('Rain');
        }
        
        if (weather.description && weather.description.toLowerCase().includes('snow')) {
            score -= 60;
            factors.push('Snow');
        }
        
        // Severe weather alerts
        if (alerts && alerts.length > 0) {
            const severeAlerts = alerts.filter(a => ['Severe', 'Extreme'].includes(a.severity));
            if (severeAlerts.length > 0) {
                score -= 80;
                factors.push('Severe weather alert');
            }
        }
        
        // Activity-specific adjustments
        if (activity === 'tennis' || activity === 'pickleball') {
            if (weather.humidity > 80) {
                score -= 10;
                factors.push('High humidity');
            }
        }
        
        score = Math.max(0, Math.min(100, score));
        
        let level;
        if (score >= 80) level = 'excellent';
        else if (score >= 60) level = 'good';
        else if (score >= 40) level = 'fair';
        else if (score >= 20) level = 'poor';
        else level = 'unplayable';
        
        return { score, factors, level };
    }
    
    generateRecommendations(current, forecast, alerts, activity) {
        const recommendations = [];
        
        if (!current) return ['Weather data unavailable'];
        
        // Current conditions
        if (current.temperature >= 70 && current.temperature <= 80 && current.windSpeed < 10) {
            recommendations.push('Perfect conditions for outdoor activity!');
        }
        
        if (current.temperature > 85) {
            recommendations.push('Stay hydrated and take breaks in shade');
        }
        
        if (current.windSpeed > 15) {
            recommendations.push('Consider indoor courts due to wind');
        }
        
        // Forecast-based recommendations
        if (forecast && forecast.data) {
            const next3Hours = forecast.data.slice(0, 3);
            const hasRain = next3Hours.some(f => f.description?.toLowerCase().includes('rain'));
            
            if (hasRain) {
                recommendations.push('Rain expected in next 3 hours - plan accordingly');
            }
        }
        
        // UV recommendations
        recommendations.push('Apply sunscreen and wear a hat');
        
        return recommendations;
    }
}

const weatherService = new WeatherServiceAggregator();

// API Endpoints

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'weather-service-aggregator',
        status: 'operational',
        apis: Object.keys(CONFIG.apis),
        cacheSize: weatherCache.cache.size,
        uptime: process.uptime()
    });
});

// Current weather
app.get('/api/weather/current/:lat/:lng', async (req, res) => {
    const { lat, lng } = req.params;
    const { force = false, clients } = req.query;
    
    try {
        const weather = await weatherService.getCurrentWeather(
            parseFloat(lat), 
            parseFloat(lng), 
            { force: force === 'true', clients: clients?.split(',') }
        );
        
        if (!weather) {
            return res.status(404).json({ error: 'Weather data not available' });
        }
        
        res.json(weather);
    } catch (error) {
        console.error('Current weather error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Forecast
app.get('/api/weather/forecast/:lat/:lng', async (req, res) => {
    const { lat, lng } = req.params;
    const { force = false } = req.query;
    
    try {
        const forecast = await weatherService.getForecast(
            parseFloat(lat), 
            parseFloat(lng), 
            { force: force === 'true' }
        );
        
        if (!forecast) {
            return res.status(404).json({ error: 'Forecast data not available' });
        }
        
        res.json(forecast);
    } catch (error) {
        console.error('Forecast error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Weather alerts
app.get('/api/weather/alerts/:lat/:lng', async (req, res) => {
    const { lat, lng } = req.params;
    
    try {
        const alerts = await weatherService.getAlerts(parseFloat(lat), parseFloat(lng));
        res.json({ alerts, count: alerts.length });
    } catch (error) {
        console.error('Alerts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Game-relevant weather (combines all data for gaming decisions)
app.get('/api/weather/gaming/:lat/:lng', async (req, res) => {
    const { lat, lng } = req.params;
    const { activity = 'tennis' } = req.query;
    
    try {
        const gameWeather = await weatherService.getGameRelevantWeather(
            parseFloat(lat), 
            parseFloat(lng), 
            activity
        );
        
        res.json(gameWeather);
    } catch (error) {
        console.error('Game weather error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Weather for area code
app.get('/api/weather/area-code/:areaCode', async (req, res) => {
    const { areaCode } = req.params;
    const { activity = 'tennis' } = req.query;
    
    try {
        // Load area code mapper to get coordinates
        const { AreaCodeMapper } = require('./area-code-mapper.js');
        const mapper = new AreaCodeMapper();
        const areaInfo = mapper.getAreaCodeInfo(areaCode);
        
        if (!areaInfo.lat || !areaInfo.lng) {
            return res.status(404).json({ error: 'Area code not found' });
        }
        
        const gameWeather = await weatherService.getGameRelevantWeather(
            areaInfo.lat, 
            areaInfo.lng, 
            activity
        );
        
        res.json({
            areaCode,
            location: {
                city: areaInfo.city,
                state: areaInfo.state,
                lat: areaInfo.lat,
                lng: areaInfo.lng
            },
            weather: gameWeather
        });
    } catch (error) {
        console.error('Area code weather error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cache management
app.delete('/api/cache', (req, res) => {
    weatherCache.cache.clear();
    res.json({ message: 'Cache cleared' });
});

app.get('/api/cache/stats', (req, res) => {
    weatherCache.clearExpired();
    res.json({
        size: weatherCache.cache.size,
        entries: Array.from(weatherCache.cache.keys())
    });
});

// Start cache cleanup interval
setInterval(() => {
    weatherCache.clearExpired();
}, 300000); // 5 minutes

// Start server
app.listen(CONFIG.port, CONFIG.host, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🌦️ WEATHER SERVICE AGGREGATOR                  ║
║                                                              ║
║  Multi-API Weather Service for AR Gaming                     ║
║                                                              ║
║  🌐 Server: http://${CONFIG.host}:${CONFIG.port}                             ║
║  📡 APIs: Weather.gov, Open-Meteo, OpenWeatherMap           ║
║  🎮 Gaming: Playability scoring for outdoor activities      ║
║  📍 Location: Area code integration                         ║
║                                                              ║
║  Features:                                                   ║
║  • Multi-source weather aggregation                         ║
║  • Intelligent caching and rate limiting                    ║
║  • Activity-specific playability scoring                    ║
║  • Severe weather alerts integration                        ║
║  • Air quality and UV index data                           ║
║  • Area code to weather mapping                            ║
║                                                              ║
║  Gaming Integration:                                         ║
║  • Tennis/Pickleball court conditions                       ║
║  • Weather-based spawn mechanics                            ║
║  • Safety alerts for outdoor activities                     ║
║  • Optimal play time recommendations                        ║
║                                                              ║
║  API Endpoints:                                              ║
║  • GET /api/weather/current/:lat/:lng                       ║
║  • GET /api/weather/forecast/:lat/:lng                      ║
║  • GET /api/weather/alerts/:lat/:lng                        ║
║  • GET /api/weather/gaming/:lat/:lng                        ║
║  • GET /api/weather/area-code/:areaCode                     ║
║                                                              ║
║  Status: Weather aggregation service operational            ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, weatherService, WeatherServiceAggregator, CONFIG };