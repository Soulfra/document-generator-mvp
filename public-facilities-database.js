#!/usr/bin/env node

/**
 * 🏟️ PUBLIC FACILITIES DATABASE
 * Tennis courts, pickleball courts, parks, and recreational facilities
 * Integration: Weather service, AR gaming, QR tracking, geographic targeting
 * Data Sources: Open data APIs, municipal databases, Google Places
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();

// Configuration
const CONFIG = {
    port: process.env.FACILITIES_PORT || 3012,
    host: process.env.FACILITIES_HOST || 'localhost',
    weatherService: process.env.WEATHER_SERVICE || 'http://localhost:3011',
    dataSources: {
        googlePlaces: {
            apiKey: process.env.GOOGLE_PLACES_API_KEY,
            baseUrl: 'https://maps.googleapis.com/maps/api/place',
            rateLimit: 2000, // 2 seconds between requests
            queries: [
                'tennis court',
                'pickleball court', 
                'public park',
                'recreation center',
                'sports complex',
                'community center'
            ]
        },
        openStreetMap: {
            baseUrl: 'https://overpass-api.de/api/interpreter',
            rateLimit: 1000,
            queries: {
                tennis: '[sport=tennis]',
                pickleball: '[sport=pickleball]',
                parks: '[leisure=park]',
                recreation: '[leisure=recreation_ground]'
            }
        },
        municipal: {
            // City-specific APIs
            nyc: 'https://data.cityofnewyork.us/resource/uwu5-7zx3.json',
            sf: 'https://data.sfgov.org/resource/gv2p-z7kd.json',
            la: 'https://data.lacity.org/resource/ax6p-jbp5.json',
            chicago: 'https://data.cityofchicago.org/resource/y7qa-tvqx.json'
        }
    },
    cache: {
        facilities: 86400, // 24 hours
        search: 3600, // 1 hour
        weather: 600 // 10 minutes
    }
};

// Middleware
app.use(cors());
app.use(express.json());

// Facilities Cache Manager
class FacilitiesCacheManager {
    constructor() {
        this.cache = new Map();
        this.lastRequests = new Map();
    }
    
    generateKey(type, params) {
        const paramString = JSON.stringify(params);
        const hash = crypto.createHash('md5').update(`${type}:${paramString}`).digest('hex');
        return hash;
    }
    
    get(type, params) {
        const key = this.generateKey(type, params);
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        
        return null;
    }
    
    set(type, params, data, ttl = 3600000) {
        const key = this.generateKey(type, params);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    
    canMakeRequest(service) {
        const lastRequest = this.lastRequests.get(service);
        const rateLimit = CONFIG.dataSources[service]?.rateLimit || 1000;
        
        if (!lastRequest || Date.now() - lastRequest >= rateLimit) {
            this.lastRequests.set(service, Date.now());
            return true;
        }
        
        return false;
    }
}

const facilitiesCache = new FacilitiesCacheManager();

// Base Facility Data Model
class Facility {
    constructor(data) {
        this.id = data.id || this.generateId(data);
        this.name = data.name;
        this.type = data.type; // tennis, pickleball, park, recreation
        this.coordinates = {
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lng)
        };
        this.address = data.address;
        this.city = data.city;
        this.state = data.state;
        this.zip = data.zip;
        this.areaCode = data.areaCode;
        this.amenities = data.amenities || [];
        this.accessibility = data.accessibility || {};
        this.hours = data.hours || {};
        this.contact = data.contact || {};
        this.fees = data.fees || {};
        this.surfaces = data.surfaces || [];
        this.lighting = data.lighting || false;
        this.covered = data.covered || false;
        this.restrooms = data.restrooms || false;
        this.parking = data.parking || false;
        this.source = data.source;
        this.lastUpdated = new Date().toISOString();
        this.verified = data.verified || false;
        this.rating = data.rating || null;
        this.reviews = data.reviews || [];
        this.photos = data.photos || [];
        this.qrCode = data.qrCode || null;
        this.arMarkers = data.arMarkers || [];
    }
    
    generateId(data) {
        const hash = crypto.createHash('md5')
            .update(`${data.name}:${data.lat}:${data.lng}:${data.type}`)
            .digest('hex');
        return hash.substring(0, 12);
    }
    
    calculatePlayabilityScore(weather) {
        let score = 100;
        let factors = [];
        
        if (!weather) return { score: 50, factors: ['No weather data'], level: 'unknown' };
        
        // Weather factors
        if (weather.temperature < 40) {
            score -= 40;
            factors.push('Very cold');
        } else if (weather.temperature < 50) {
            score -= 20;
            factors.push('Cold');
        } else if (weather.temperature > 95) {
            score -= 30;
            factors.push('Very hot');
        } else if (weather.temperature > 85) {
            score -= 15;
            factors.push('Hot');
        }
        
        // Wind factors
        if (weather.windSpeed > 20) {
            score -= 25;
            factors.push('Very windy');
        } else if (weather.windSpeed > 10) {
            score -= 10;
            factors.push('Windy');
        }
        
        // Precipitation
        if (weather.description && weather.description.toLowerCase().includes('rain')) {
            if (this.covered) {
                score -= 10;
                factors.push('Rain (covered facility)');
            } else {
                score -= 60;
                factors.push('Rain (outdoor)');
            }
        }
        
        // Snow
        if (weather.description && weather.description.toLowerCase().includes('snow')) {
            score -= 70;
            factors.push('Snow');
        }
        
        // Facility-specific adjustments
        if (this.lighting) {
            score += 10;
            factors.push('Lighted facility');
        }
        
        if (this.covered) {
            score += 20;
            factors.push('Covered courts');
        }
        
        if (this.type === 'tennis' && weather.windSpeed > 15) {
            score -= 10; // Tennis more affected by wind
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
    
    generateQRCode() {
        // Generate QR code data for facility check-in
        const qrData = {
            facilityId: this.id,
            name: this.name,
            type: this.type,
            coordinates: this.coordinates,
            checkInUrl: `https://soulfra.ai/facilities/checkin/${this.id}`,
            timestamp: Date.now()
        };
        
        this.qrCode = {
            data: JSON.stringify(qrData),
            url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`,
            generated: new Date().toISOString()
        };
        
        return this.qrCode;
    }
    
    generateARMarkers() {
        // Generate AR anchor points for the facility
        this.arMarkers = [
            {
                id: `${this.id}-entrance`,
                type: 'entrance',
                coordinates: this.coordinates,
                title: `${this.name} Entrance`,
                description: `Welcome to ${this.name}`,
                icon: '🏟️'
            },
            {
                id: `${this.id}-info`,
                type: 'info',
                coordinates: {
                    lat: this.coordinates.lat + 0.0001,
                    lng: this.coordinates.lng + 0.0001
                },
                title: 'Facility Information',
                description: `Type: ${this.type}\nAmenities: ${this.amenities.join(', ')}`,
                icon: 'ℹ️'
            }
        ];
        
        return this.arMarkers;
    }
}

// Google Places API Client
class GooglePlacesClient {
    constructor() {
        this.apiKey = CONFIG.dataSources.googlePlaces.apiKey;
        this.baseUrl = CONFIG.dataSources.googlePlaces.baseUrl;
    }
    
    async searchNearby(lat, lng, radius = 5000, type = 'tennis court') {
        if (!this.apiKey) {
            console.warn('Google Places API key not configured');
            return [];
        }
        
        try {
            const params = new URLSearchParams({
                location: `${lat},${lng}`,
                radius: radius,
                keyword: type,
                key: this.apiKey
            });
            
            const response = await fetch(`${this.baseUrl}/nearbysearch/json?${params}`);
            const data = await response.json();
            
            if (data.status !== 'OK') {
                console.error('Google Places API error:', data.status);
                return [];
            }
            
            return this.formatResults(data.results, type);
        } catch (error) {
            console.error('Google Places search error:', error);
            return [];
        }
    }
    
    async getPlaceDetails(placeId) {
        if (!this.apiKey) return null;
        
        try {
            const params = new URLSearchParams({
                place_id: placeId,
                fields: 'name,formatted_address,geometry,formatted_phone_number,opening_hours,rating,reviews,photos',
                key: this.apiKey
            });
            
            const response = await fetch(`${this.baseUrl}/details/json?${params}`);
            const data = await response.json();
            
            return data.result;
        } catch (error) {
            console.error('Google Places details error:', error);
            return null;
        }
    }
    
    formatResults(results, searchType) {
        return results.map(place => ({
            name: place.name,
            type: this.mapSearchTypeToFacilityType(searchType),
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.vicinity,
            rating: place.rating,
            placeId: place.place_id,
            source: 'google_places',
            amenities: this.extractAmenities(place.types),
            verified: false
        }));
    }
    
    mapSearchTypeToFacilityType(searchType) {
        const mapping = {
            'tennis court': 'tennis',
            'pickleball court': 'pickleball',
            'public park': 'park',
            'recreation center': 'recreation',
            'sports complex': 'recreation',
            'community center': 'recreation'
        };
        
        return mapping[searchType] || 'recreation';
    }
    
    extractAmenities(types) {
        const amenityMapping = {
            'parking': 'parking',
            'restroom': 'restrooms',
            'food': 'concessions',
            'lodging': 'lodging'
        };
        
        return types.filter(type => amenityMapping[type])
                   .map(type => amenityMapping[type]);
    }
}

// OpenStreetMap Overpass API Client
class OpenStreetMapClient {
    constructor() {
        this.baseUrl = CONFIG.dataSources.openStreetMap.baseUrl;
    }
    
    async searchFacilities(lat, lng, radius = 5000, facilityType = 'tennis') {
        try {
            const query = this.buildOverpassQuery(lat, lng, radius, facilityType);
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: query
            });
            
            const data = await response.json();
            return this.formatOSMResults(data.elements, facilityType);
        } catch (error) {
            console.error('OpenStreetMap search error:', error);
            return [];
        }
    }
    
    buildOverpassQuery(lat, lng, radius, type) {
        const queries = CONFIG.dataSources.openStreetMap.queries;
        const sportFilter = queries[type] || '[leisure=park]';
        
        return `
            [out:json][timeout:25];
            (
                node${sportFilter}(around:${radius},${lat},${lng});
                way${sportFilter}(around:${radius},${lat},${lng});
                relation${sportFilter}(around:${radius},${lat},${lng});
            );
            out center meta;
        `;
    }
    
    formatOSMResults(elements, facilityType) {
        return elements.map(element => {
            const tags = element.tags || {};
            const coords = element.center || { lat: element.lat, lon: element.lon };
            
            return {
                name: tags.name || `${facilityType} facility`,
                type: facilityType,
                lat: coords.lat,
                lng: coords.lon,
                address: this.buildAddress(tags),
                amenities: this.extractOSMAmenities(tags),
                lighting: tags.lit === 'yes',
                surfaces: tags.surface ? [tags.surface] : [],
                source: 'openstreetmap',
                verified: false
            };
        }).filter(facility => facility.lat && facility.lng);
    }
    
    buildAddress(tags) {
        const parts = [];
        if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
        if (tags['addr:street']) parts.push(tags['addr:street']);
        if (tags['addr:city']) parts.push(tags['addr:city']);
        if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
        
        return parts.join(' ') || 'Address not available';
    }
    
    extractOSMAmenities(tags) {
        const amenities = [];
        
        if (tags.toilets === 'yes') amenities.push('restrooms');
        if (tags.parking) amenities.push('parking');
        if (tags.drinking_water === 'yes') amenities.push('water_fountain');
        if (tags.wheelchair === 'yes') amenities.push('wheelchair_accessible');
        if (tags.fee === 'yes') amenities.push('fee_required');
        
        return amenities;
    }
}

// Municipal Data Client
class MunicipalDataClient {
    constructor() {
        this.dataSources = CONFIG.dataSources.municipal;
    }
    
    async getFacilitiesByCity(city) {
        const cityCode = city.toLowerCase().replace(/\s+/g, '');
        const apiUrl = this.dataSources[cityCode];
        
        if (!apiUrl) {
            console.warn(`No municipal data source for city: ${city}`);
            return [];
        }
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            return this.formatMunicipalData(data, city);
        } catch (error) {
            console.error(`Municipal data error for ${city}:`, error);
            return [];
        }
    }
    
    formatMunicipalData(data, city) {
        // Format varies by city, implement specific parsers
        return data.map(item => {
            // Generic formatter - customize per city
            return {
                name: item.name || item.facility_name || item.site_name,
                type: this.mapMunicipalType(item.type || item.facility_type),
                lat: parseFloat(item.latitude || item.lat),
                lng: parseFloat(item.longitude || item.lng || item.lon),
                address: item.address || item.location,
                city: city,
                amenities: this.extractMunicipalAmenities(item),
                source: `municipal_${city.toLowerCase()}`,
                verified: true // Municipal data is typically more reliable
            };
        }).filter(facility => facility.lat && facility.lng && facility.name);
    }
    
    mapMunicipalType(type) {
        if (!type) return 'recreation';
        
        const typeStr = type.toLowerCase();
        if (typeStr.includes('tennis')) return 'tennis';
        if (typeStr.includes('pickleball')) return 'pickleball';
        if (typeStr.includes('park')) return 'park';
        
        return 'recreation';
    }
    
    extractMunicipalAmenities(item) {
        const amenities = [];
        
        // Check various municipal field names
        if (item.restrooms || item.bathrooms) amenities.push('restrooms');
        if (item.parking) amenities.push('parking');
        if (item.lighting || item.lights) amenities.push('lighting');
        if (item.fee || item.fees) amenities.push('fee_required');
        
        return amenities;
    }
}

// Area Code Integration
class AreaCodeIntegration {
    constructor() {
        this.areaCodeDatabase = null;
        this.loadAreaCodeDatabase();
    }
    
    async loadAreaCodeDatabase() {
        try {
            // Load area code mapper if available
            const { AreaCodeMapper } = require('./area-code-mapper.js');
            this.areaCodeDatabase = new AreaCodeMapper();
        } catch (error) {
            console.warn('Area code database not available:', error.message);
        }
    }
    
    addAreaCodeToFacility(facility) {
        if (!this.areaCodeDatabase) return facility;
        
        try {
            const areaCode = this.areaCodeDatabase.getAreaCodeByCoordinates(
                facility.coordinates.lat, 
                facility.coordinates.lng
            );
            
            if (areaCode) {
                facility.areaCode = areaCode;
                const areaInfo = this.areaCodeDatabase.getAreaCodeInfo(areaCode);
                
                if (!facility.city && areaInfo.city) facility.city = areaInfo.city;
                if (!facility.state && areaInfo.state) facility.state = areaInfo.state;
            }
        } catch (error) {
            console.error('Area code integration error:', error);
        }
        
        return facility;
    }
}

// Public Facilities Database Service
class PublicFacilitiesDatabase {
    constructor() {
        this.googlePlaces = new GooglePlacesClient();
        this.openStreetMap = new OpenStreetMapClient();
        this.municipalData = new MunicipalDataClient();
        this.areaCodeIntegration = new AreaCodeIntegration();
        this.facilities = new Map();
        
        this.loadStoredFacilities();
    }
    
    async loadStoredFacilities() {
        try {
            const dataPath = path.join(process.cwd(), 'facilities-data', 'facilities.json');
            const data = await fs.readFile(dataPath, 'utf8');
            const facilities = JSON.parse(data);
            
            facilities.forEach(facilityData => {
                const facility = new Facility(facilityData);
                this.facilities.set(facility.id, facility);
            });
            
            console.log(`📋 Loaded ${this.facilities.size} facilities from storage`);
        } catch (error) {
            console.log('📋 No stored facilities found, starting fresh');
        }
    }
    
    async saveFacilities() {
        try {
            const dataDir = path.join(process.cwd(), 'facilities-data');
            await fs.mkdir(dataDir, { recursive: true });
            
            const facilities = Array.from(this.facilities.values());
            const dataPath = path.join(dataDir, 'facilities.json');
            
            await fs.writeFile(dataPath, JSON.stringify(facilities, null, 2));
            console.log(`💾 Saved ${facilities.length} facilities to storage`);
        } catch (error) {
            console.error('Failed to save facilities:', error);
        }
    }
    
    async searchFacilities(lat, lng, radius = 5000, options = {}) {
        const cacheKey = { lat, lng, radius, ...options };
        const cached = facilitiesCache.get('search', cacheKey);
        
        if (cached && !options.force) {
            return cached;
        }
        
        const results = [];
        const facilityTypes = options.types || ['tennis', 'pickleball', 'park', 'recreation'];
        
        // Search Google Places
        if (facilitiesCache.canMakeRequest('googlePlaces')) {
            for (const type of facilityTypes) {
                try {
                    const googleQuery = this.mapTypeToGoogleQuery(type);
                    const googleResults = await this.googlePlaces.searchNearby(lat, lng, radius, googleQuery);
                    results.push(...googleResults);
                } catch (error) {
                    console.error(`Google Places search error for ${type}:`, error);
                }
            }
        }
        
        // Search OpenStreetMap
        if (facilitiesCache.canMakeRequest('openStreetMap')) {
            for (const type of facilityTypes) {
                try {
                    const osmResults = await this.openStreetMap.searchFacilities(lat, lng, radius, type);
                    results.push(...osmResults);
                } catch (error) {
                    console.error(`OpenStreetMap search error for ${type}:`, error);
                }
            }
        }
        
        // Process and deduplicate results
        const facilities = this.processSearchResults(results);
        
        // Cache results
        facilitiesCache.set('search', cacheKey, facilities, CONFIG.cache.search * 1000);
        
        return facilities;
    }
    
    processSearchResults(results) {
        const facilitiesMap = new Map();
        
        results.forEach(result => {
            const facility = new Facility(result);
            
            // Add area code information
            this.areaCodeIntegration.addAreaCodeToFacility(facility);
            
            // Generate QR code and AR markers
            facility.generateQRCode();
            facility.generateARMarkers();
            
            // Check for duplicates (within 100 meters)
            const existingId = this.findNearbyFacility(facility, Array.from(facilitiesMap.values()));
            
            if (existingId) {
                // Merge with existing facility
                const existing = facilitiesMap.get(existingId);
                this.mergeFacilities(existing, facility);
            } else {
                facilitiesMap.set(facility.id, facility);
                this.facilities.set(facility.id, facility);
            }
        });
        
        return Array.from(facilitiesMap.values());
    }
    
    findNearbyFacility(facility, existingFacilities) {
        const threshold = 0.001; // ~100 meters
        
        for (const existing of existingFacilities) {
            const distance = this.calculateDistance(
                facility.coordinates.lat, facility.coordinates.lng,
                existing.coordinates.lat, existing.coordinates.lng
            );
            
            if (distance < threshold) {
                return existing.id;
            }
        }
        
        return null;
    }
    
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    mergeFacilities(existing, newFacility) {
        // Merge amenities
        const allAmenities = [...new Set([...existing.amenities, ...newFacility.amenities])];
        existing.amenities = allAmenities;
        
        // Update fields if new data is more complete
        if (!existing.address && newFacility.address) existing.address = newFacility.address;
        if (!existing.rating && newFacility.rating) existing.rating = newFacility.rating;
        if (!existing.verified && newFacility.verified) existing.verified = newFacility.verified;
        
        // Add source if different
        if (existing.source !== newFacility.source) {
            existing.sources = existing.sources || [existing.source];
            if (!existing.sources.includes(newFacility.source)) {
                existing.sources.push(newFacility.source);
            }
        }
        
        existing.lastUpdated = new Date().toISOString();
    }
    
    mapTypeToGoogleQuery(type) {
        const mapping = {
            'tennis': 'tennis court',
            'pickleball': 'pickleball court',
            'park': 'public park',
            'recreation': 'recreation center'
        };
        
        return mapping[type] || 'recreation center';
    }
    
    async getFacilitiesWithWeather(lat, lng, radius = 5000, options = {}) {
        const facilities = await this.searchFacilities(lat, lng, radius, options);
        
        // Get weather for each facility
        const facilitiesWithWeather = await Promise.all(
            facilities.map(async (facility) => {
                try {
                    const weather = await this.getWeatherForFacility(facility);
                    const playability = facility.calculatePlayabilityScore(weather);
                    
                    return {
                        ...facility,
                        weather,
                        playability,
                        recommendations: this.generateFacilityRecommendations(facility, weather, playability)
                    };
                } catch (error) {
                    console.error(`Weather error for facility ${facility.id}:`, error);
                    return facility;
                }
            })
        );
        
        // Sort by playability score
        return facilitiesWithWeather.sort((a, b) => {
            const scoreA = a.playability?.score || 0;
            const scoreB = b.playability?.score || 0;
            return scoreB - scoreA;
        });
    }
    
    async getWeatherForFacility(facility) {
        try {
            const response = await fetch(
                `${CONFIG.weatherService}/api/weather/current/${facility.coordinates.lat}/${facility.coordinates.lng}`
            );
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Weather service error:', error);
        }
        
        return null;
    }
    
    generateFacilityRecommendations(facility, weather, playability) {
        const recommendations = [];
        
        if (playability.score >= 80) {
            recommendations.push('Perfect conditions for outdoor activity!');
        }
        
        if (weather && weather.temperature > 85) {
            recommendations.push('Bring plenty of water and take breaks');
        }
        
        if (weather && weather.description?.toLowerCase().includes('rain') && facility.covered) {
            recommendations.push('Great choice - covered facility available during rain');
        }
        
        if (facility.lighting) {
            recommendations.push('Lighted courts available for evening play');
        }
        
        if (facility.restrooms) {
            recommendations.push('Restroom facilities available');
        }
        
        if (facility.parking) {
            recommendations.push('Parking available on-site');
        }
        
        return recommendations;
    }
    
    async getFacilitiesByAreaCode(areaCode) {
        const cached = facilitiesCache.get('area_code', { areaCode });
        
        if (cached) {
            return cached;
        }
        
        const areaFacilities = Array.from(this.facilities.values())
            .filter(facility => facility.areaCode === areaCode);
        
        facilitiesCache.set('area_code', { areaCode }, areaFacilities, CONFIG.cache.facilities * 1000);
        
        return areaFacilities;
    }
    
    getFacilityById(id) {
        return this.facilities.get(id) || null;
    }
    
    async addCustomFacility(facilityData) {
        const facility = new Facility(facilityData);
        
        // Add area code information
        this.areaCodeIntegration.addAreaCodeToFacility(facility);
        
        // Generate QR code and AR markers
        facility.generateQRCode();
        facility.generateARMarkers();
        
        facility.verified = true; // Custom additions are considered verified
        
        this.facilities.set(facility.id, facility);
        await this.saveFacilities();
        
        return facility;
    }
    
    async updateFacility(id, updates) {
        const facility = this.facilities.get(id);
        if (!facility) return null;
        
        Object.assign(facility, updates);
        facility.lastUpdated = new Date().toISOString();
        
        await this.saveFacilities();
        return facility;
    }
    
    getStatistics() {
        const facilities = Array.from(this.facilities.values());
        
        const stats = {
            total: facilities.length,
            byType: {},
            bySource: {},
            verified: facilities.filter(f => f.verified).length,
            withAmenities: {
                lighting: facilities.filter(f => f.lighting).length,
                covered: facilities.filter(f => f.covered).length,
                restrooms: facilities.filter(f => f.restrooms).length,
                parking: facilities.filter(f => f.parking).length
            },
            coverage: {
                cities: [...new Set(facilities.map(f => f.city).filter(Boolean))].length,
                states: [...new Set(facilities.map(f => f.state).filter(Boolean))].length,
                areaCodes: [...new Set(facilities.map(f => f.areaCode).filter(Boolean))].length
            }
        };
        
        // Count by type
        facilities.forEach(f => {
            stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
        });
        
        // Count by source
        facilities.forEach(f => {
            stats.bySource[f.source] = (stats.bySource[f.source] || 0) + 1;
        });
        
        return stats;
    }
}

const facilitiesDB = new PublicFacilitiesDatabase();

// API Endpoints

// Health check
app.get('/health', (req, res) => {
    res.json({
        service: 'public-facilities-database',
        status: 'operational',
        facilities: facilitiesDB.facilities.size,
        dataSources: Object.keys(CONFIG.dataSources),
        weatherIntegration: !!CONFIG.weatherService,
        uptime: process.uptime()
    });
});

// Search facilities
app.get('/api/facilities/search/:lat/:lng', async (req, res) => {
    const { lat, lng } = req.params;
    const { 
        radius = 5000, 
        types, 
        weather = false, 
        force = false 
    } = req.query;
    
    try {
        const options = {
            types: types ? types.split(',') : undefined,
            force: force === 'true'
        };
        
        let facilities;
        if (weather === 'true') {
            facilities = await facilitiesDB.getFacilitiesWithWeather(
                parseFloat(lat), 
                parseFloat(lng), 
                parseInt(radius), 
                options
            );
        } else {
            facilities = await facilitiesDB.searchFacilities(
                parseFloat(lat), 
                parseFloat(lng), 
                parseInt(radius), 
                options
            );
        }
        
        res.json({
            facilities,
            count: facilities.length,
            searchArea: {
                center: { lat: parseFloat(lat), lng: parseFloat(lng) },
                radius: parseInt(radius)
            },
            includesWeather: weather === 'true'
        });
    } catch (error) {
        console.error('Facilities search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get facilities by area code
app.get('/api/facilities/area-code/:areaCode', async (req, res) => {
    const { areaCode } = req.params;
    const { weather = false } = req.query;
    
    try {
        let facilities = await facilitiesDB.getFacilitiesByAreaCode(areaCode);
        
        if (weather === 'true' && facilities.length > 0) {
            // Get weather for each facility
            facilities = await Promise.all(
                facilities.map(async (facility) => {
                    const weatherData = await facilitiesDB.getWeatherForFacility(facility);
                    const playability = facility.calculatePlayabilityScore(weatherData);
                    
                    return {
                        ...facility,
                        weather: weatherData,
                        playability
                    };
                })
            );
            
            // Sort by playability
            facilities.sort((a, b) => (b.playability?.score || 0) - (a.playability?.score || 0));
        }
        
        res.json({
            areaCode,
            facilities,
            count: facilities.length,
            includesWeather: weather === 'true'
        });
    } catch (error) {
        console.error('Area code facilities error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get specific facility
app.get('/api/facilities/:id', async (req, res) => {
    const { id } = req.params;
    const { weather = false } = req.query;
    
    try {
        let facility = facilitiesDB.getFacilityById(id);
        
        if (!facility) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        
        if (weather === 'true') {
            const weatherData = await facilitiesDB.getWeatherForFacility(facility);
            const playability = facility.calculatePlayabilityScore(weatherData);
            
            facility = {
                ...facility,
                weather: weatherData,
                playability,
                recommendations: facilitiesDB.generateFacilityRecommendations(facility, weatherData, playability)
            };
        }
        
        res.json(facility);
    } catch (error) {
        console.error('Facility details error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add custom facility
app.post('/api/facilities', async (req, res) => {
    try {
        const facility = await facilitiesDB.addCustomFacility(req.body);
        res.status(201).json(facility);
    } catch (error) {
        console.error('Add facility error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update facility
app.put('/api/facilities/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const facility = await facilitiesDB.updateFacility(id, req.body);
        
        if (!facility) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        
        res.json(facility);
    } catch (error) {
        console.error('Update facility error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get database statistics
app.get('/api/facilities/stats', (req, res) => {
    try {
        const stats = facilitiesDB.getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check-in to facility (for QR code functionality)
app.post('/api/facilities/:id/checkin', async (req, res) => {
    const { id } = req.params;
    const { userId, userInfo } = req.body;
    
    try {
        const facility = facilitiesDB.getFacilityById(id);
        
        if (!facility) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        
        // Log check-in (would be stored in proper database)
        const checkIn = {
            facilityId: id,
            userId,
            userInfo,
            timestamp: new Date().toISOString(),
            facility: {
                name: facility.name,
                type: facility.type,
                coordinates: facility.coordinates
            }
        };
        
        console.log('Facility check-in:', checkIn);
        
        res.json({
            success: true,
            checkIn,
            facility: {
                name: facility.name,
                type: facility.type,
                amenities: facility.amenities,
                qrCode: facility.qrCode
            }
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cache management
app.delete('/api/cache', (req, res) => {
    facilitiesCache.cache.clear();
    res.json({ message: 'Cache cleared' });
});

// Save facilities to storage
app.post('/api/facilities/save', async (req, res) => {
    try {
        await facilitiesDB.saveFacilities();
        res.json({ message: 'Facilities saved to storage' });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(CONFIG.port, CONFIG.host, async () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🏟️ PUBLIC FACILITIES DATABASE                  ║
║                                                              ║
║  Tennis, Pickleball, Parks & Recreation Facilities          ║
║                                                              ║
║  🌐 Server: http://${CONFIG.host}:${CONFIG.port}                             ║
║  🏟️ Sources: Google Places, OpenStreetMap, Municipal        ║
║  🌦️ Weather: Integrated playability scoring                 ║
║  📍 Location: Area code geographic targeting               ║
║                                                              ║
║  Features:                                                   ║
║  • Multi-source facility aggregation                        ║
║  • Real-time weather integration                            ║
║  • Playability scoring for outdoor activities               ║
║  • QR code check-in generation                             ║
║  • AR marker generation for gaming                          ║
║  • Geographic targeting by area code                        ║
║                                                              ║
║  Data Sources:                                               ║
║  • Google Places API (tennis, pickleball, parks)            ║
║  • OpenStreetMap Overpass API (open data)                   ║
║  • Municipal databases (NYC, SF, LA, Chicago)               ║
║  • User-submitted facilities                                ║
║                                                              ║
║  AR Gaming Integration:                                      ║
║  • Weather-responsive spawn mechanics                       ║
║  • QR code-based facility check-ins                        ║
║  • Location-based AR anchor points                          ║
║  • Parent-child tracking support                            ║
║                                                              ║
║  API Endpoints:                                              ║
║  • GET /api/facilities/search/:lat/:lng                     ║
║  • GET /api/facilities/area-code/:areaCode                  ║
║  • GET /api/facilities/:id                                  ║
║  • POST /api/facilities (add custom)                        ║
║  • POST /api/facilities/:id/checkin                         ║
║                                                              ║
║  Status: Public facilities database operational             ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Create storage directory
    const dataDir = path.join(process.cwd(), 'facilities-data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Auto-save facilities every 10 minutes
    setInterval(async () => {
        try {
            await facilitiesDB.saveFacilities();
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }, 600000); // 10 minutes
});

module.exports = { 
    app, 
    facilitiesDB, 
    PublicFacilitiesDatabase, 
    Facility, 
    CONFIG 
};