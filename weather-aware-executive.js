#!/usr/bin/env node

/**
 * Weather-Aware Executive System
 * Real-world weather data integration for executive decision-making
 * Handles weather impacts on in-game maps, territories, and strategic planning
 */

import axios from 'axios';
import WebSocket from 'ws';
import EventEmitter from 'events';
import { createHash } from 'crypto';

export class WeatherAwareExecutive extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            weatherApiKey: process.env.WEATHER_API_KEY || 'demo_key',
            updateInterval: config.updateInterval || 300000, // 5 minutes
            cacheTimeout: config.cacheTimeout || 600000, // 10 minutes
            alertThresholds: config.alertThresholds || {
                temperature: { extreme_cold: -20, extreme_heat: 40 },
                wind: { high: 50, extreme: 80 },
                precipitation: { heavy: 10, extreme: 25 },
                visibility: { low: 1000, poor: 500 }
            },
            ...config
        };

        this.weatherCache = new Map();
        this.activeAlerts = new Map();
        this.subscribers = new Set();
        this.territoryWeather = new Map();
        this.weatherEvents = new Map();
        
        // Territory definitions with real-world coordinates
        this.territories = new Map([
            ['tech_valley', {
                name: 'Silicon Valley',
                coords: { lat: 37.3861, lon: -122.0839 },
                faction: 'tech',
                resources: ['computing', 'innovation', 'data'],
                weatherSensitivity: 0.6
            }],
            ['creative_district', {
                name: 'Creative Quarter',
                coords: { lat: 40.7589, lon: -73.9851 },
                faction: 'creative',
                resources: ['art', 'media', 'culture'],
                weatherSensitivity: 0.8
            }],
            ['corporate_towers', {
                name: 'Financial District',
                coords: { lat: 51.5074, lon: -0.1278 },
                faction: 'corporate',
                resources: ['finance', 'trade', 'infrastructure'],
                weatherSensitivity: 0.4
            }],
            ['traditional_lands', {
                name: 'Heritage Region',
                coords: { lat: 35.6762, lon: 139.6503 },
                faction: 'traditional',
                resources: ['culture', 'craftsmanship', 'wisdom'],
                weatherSensitivity: 0.7
            }],
            ['neutral_zone', {
                name: 'Free Territory',
                coords: { lat: 46.2044, lon: 6.1432 },
                faction: 'neutral',
                resources: ['diplomacy', 'trade', 'mediation'],
                weatherSensitivity: 0.5
            }]
        ]);

        this.weatherEffects = {
            resource_production: {
                sunny: { multiplier: 1.2, efficiency: 1.1 },
                cloudy: { multiplier: 1.0, efficiency: 1.0 },
                rainy: { multiplier: 0.9, efficiency: 0.95 },
                stormy: { multiplier: 0.7, efficiency: 0.8 },
                snow: { multiplier: 0.8, efficiency: 0.85 },
                fog: { multiplier: 0.85, efficiency: 0.9 }
            },
            faction_morale: {
                tech: { prefers: ['cloudy', 'rainy'], bonus: 0.1, penalty: 0.05 },
                creative: { prefers: ['sunny', 'cloudy'], bonus: 0.15, penalty: 0.1 },
                corporate: { prefers: ['sunny', 'clear'], bonus: 0.05, penalty: 0.02 },
                traditional: { prefers: ['snow', 'cloudy'], bonus: 0.12, penalty: 0.08 },
                neutral: { prefers: ['any'], bonus: 0.03, penalty: 0.01 }
            },
            strategic_events: {
                storm: ['supply_disruption', 'communication_loss', 'shelter_requirement'],
                extreme_heat: ['cooling_demand', 'productivity_drop', 'health_concerns'],
                extreme_cold: ['heating_demand', 'transport_issues', 'energy_surge'],
                heavy_rain: ['flooding_risk', 'transport_delays', 'indoor_activities'],
                high_winds: ['construction_halt', 'communication_issues', 'safety_protocols']
            }
        };

        this.initializeWeatherSystem();
    }

    async initializeWeatherSystem() {
        console.log('🌤️  Initializing Weather-Aware Executive System...');
        
        try {
            // Start weather monitoring for all territories
            await this.startTerritoryMonitoring();
            
            // Initialize weather event system
            this.initializeWeatherEvents();
            
            // Start WebSocket server for real-time weather updates
            this.startWeatherWebSocketServer();
            
            // Begin continuous weather monitoring
            this.startContinuousMonitoring();
            
            console.log('✅ Weather-Aware Executive System initialized successfully');
            this.emit('system_ready');
        } catch (error) {
            console.error('❌ Failed to initialize weather system:', error);
            this.emit('system_error', error);
        }
    }

    async startTerritoryMonitoring() {
        console.log('🗺️  Starting territory weather monitoring...');
        
        for (const [territoryId, territory] of this.territories) {
            try {
                const weather = await this.fetchWeatherData(territory.coords);
                this.territoryWeather.set(territoryId, {
                    ...weather,
                    territory: territory,
                    lastUpdate: Date.now(),
                    impacts: this.calculateWeatherImpacts(weather, territory)
                });
                
                console.log(`📍 ${territory.name}: ${weather.condition} (${weather.temperature}°C)`);
            } catch (error) {
                console.error(`❌ Failed to fetch weather for ${territory.name}:`, error);
            }
        }
    }

    async fetchWeatherData(coords) {
        const cacheKey = `${coords.lat},${coords.lon}`;
        const cached = this.weatherCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
            return cached.data;
        }

        try {
            // Using OpenWeatherMap API as example - replace with your preferred service
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
                params: {
                    lat: coords.lat,
                    lon: coords.lon,
                    appid: this.config.weatherApiKey,
                    units: 'metric'
                },
                timeout: 10000
            });

            const weatherData = {
                temperature: Math.round(response.data.main.temp),
                condition: response.data.weather[0].main.toLowerCase(),
                description: response.data.weather[0].description,
                humidity: response.data.main.humidity,
                pressure: response.data.main.pressure,
                windSpeed: response.data.wind?.speed || 0,
                windDirection: response.data.wind?.deg || 0,
                visibility: response.data.visibility || 10000,
                cloudCover: response.data.clouds?.all || 0,
                sunrise: new Date(response.data.sys.sunrise * 1000),
                sunset: new Date(response.data.sys.sunset * 1000),
                coordinates: coords,
                timestamp: Date.now()
            };

            // Cache the result
            this.weatherCache.set(cacheKey, {
                data: weatherData,
                timestamp: Date.now()
            });

            return weatherData;
        } catch (error) {
            console.error('Weather API error:', error.message);
            
            // Return mock data if API fails
            return this.generateMockWeatherData(coords);
        }
    }

    generateMockWeatherData(coords) {
        const conditions = ['sunny', 'cloudy', 'rainy', 'partly_cloudy'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        return {
            temperature: Math.round(15 + Math.random() * 20),
            condition: randomCondition,
            description: `mock ${randomCondition} conditions`,
            humidity: Math.round(40 + Math.random() * 40),
            pressure: Math.round(1000 + Math.random() * 50),
            windSpeed: Math.round(Math.random() * 20),
            windDirection: Math.round(Math.random() * 360),
            visibility: 10000,
            cloudCover: Math.round(Math.random() * 100),
            sunrise: new Date(),
            sunset: new Date(Date.now() + 12 * 60 * 60 * 1000),
            coordinates: coords,
            timestamp: Date.now(),
            mock: true
        };
    }

    calculateWeatherImpacts(weather, territory) {
        const impacts = {
            resourceProduction: 1.0,
            factionMorale: 1.0,
            strategicEvents: [],
            travelSafety: 1.0,
            energyDemand: 1.0,
            communicationReliability: 1.0
        };

        // Resource production effects
        const prodEffect = this.weatherEffects.resource_production[weather.condition] || 
                          this.weatherEffects.resource_production.cloudy;
        impacts.resourceProduction = prodEffect.multiplier * territory.weatherSensitivity;

        // Faction morale effects
        const factionPrefs = this.weatherEffects.faction_morale[territory.faction];
        if (factionPrefs.prefers.includes(weather.condition) || factionPrefs.prefers.includes('any')) {
            impacts.factionMorale = 1.0 + factionPrefs.bonus;
        } else {
            impacts.factionMorale = 1.0 - factionPrefs.penalty;
        }

        // Temperature extremes
        if (weather.temperature < this.config.alertThresholds.temperature.extreme_cold) {
            impacts.energyDemand = 1.5;
            impacts.strategicEvents.push('extreme_cold_event');
        } else if (weather.temperature > this.config.alertThresholds.temperature.extreme_heat) {
            impacts.energyDemand = 1.4;
            impacts.strategicEvents.push('extreme_heat_event');
        }

        // Wind effects
        if (weather.windSpeed > this.config.alertThresholds.wind.extreme) {
            impacts.travelSafety = 0.3;
            impacts.communicationReliability = 0.6;
            impacts.strategicEvents.push('extreme_wind_event');
        } else if (weather.windSpeed > this.config.alertThresholds.wind.high) {
            impacts.travelSafety = 0.7;
            impacts.communicationReliability = 0.8;
        }

        // Visibility effects
        if (weather.visibility < this.config.alertThresholds.visibility.poor) {
            impacts.travelSafety = 0.4;
            impacts.strategicEvents.push('low_visibility_event');
        } else if (weather.visibility < this.config.alertThresholds.visibility.low) {
            impacts.travelSafety = 0.7;
        }

        return impacts;
    }

    initializeWeatherEvents() {
        console.log('⚡ Initializing weather event system...');
        
        // Define weather-triggered events
        this.weatherEventTypes = {
            storm_surge: {
                trigger: (weather) => weather.condition === 'thunderstorm' && weather.windSpeed > 30,
                duration: 120, // minutes
                effects: {
                    supply_disruption: 0.6,
                    communication_loss: 0.8,
                    emergency_protocols: true
                },
                narrative: "A massive storm system has moved into the region, disrupting normal operations."
            },
            
            solar_flare_simulation: {
                trigger: (weather) => weather.condition === 'clear' && Math.random() < 0.05,
                duration: 60,
                effects: {
                    communication_disruption: 0.9,
                    tech_advantage_boost: 1.5,
                    satellite_interference: true
                },
                narrative: "Intense solar activity creates unique opportunities for tech-savvy factions."
            },
            
            fog_of_war: {
                trigger: (weather) => weather.visibility < 2000,
                duration: 180,
                effects: {
                    reconnaissance_difficulty: 0.3,
                    stealth_operations_boost: 1.4,
                    transport_delays: 0.7
                },
                narrative: "Dense fog blankets the territory, creating opportunities for covert operations."
            },
            
            harvest_moon: {
                trigger: (weather) => {
                    const hour = new Date().getHours();
                    return weather.condition === 'clear' && hour >= 18 && hour <= 6;
                },
                duration: 480, // 8 hours
                effects: {
                    traditional_faction_boost: 1.3,
                    cultural_resource_bonus: 1.2,
                    night_activity_increase: 1.1
                },
                narrative: "The full moon illuminates the night, inspiring traditional craftsmen and night workers."
            }
        };

        // Set up event monitoring
        setInterval(() => {
            this.checkForWeatherEvents();
        }, 60000); // Check every minute
    }

    checkForWeatherEvents() {
        for (const [territoryId, territoryData] of this.territoryWeather) {
            const weather = territoryData;
            
            for (const [eventType, eventConfig] of Object.entries(this.weatherEventTypes)) {
                if (eventConfig.trigger(weather) && !this.weatherEvents.has(`${territoryId}_${eventType}`)) {
                    this.triggerWeatherEvent(territoryId, eventType, eventConfig);
                }
            }
        }
    }

    triggerWeatherEvent(territoryId, eventType, eventConfig) {
        const eventId = `${territoryId}_${eventType}_${Date.now()}`;
        const territory = this.territories.get(territoryId);
        
        const event = {
            id: eventId,
            type: eventType,
            territory: territoryId,
            startTime: Date.now(),
            endTime: Date.now() + (eventConfig.duration * 60000),
            effects: eventConfig.effects,
            narrative: eventConfig.narrative,
            status: 'active'
        };

        this.weatherEvents.set(eventId, event);
        
        console.log(`🌪️  Weather Event Triggered: ${eventType} in ${territory.name}`);
        console.log(`📖 ${eventConfig.narrative}`);
        
        // Broadcast to all subscribers
        this.broadcastWeatherEvent(event);
        
        // Set timeout to end event
        setTimeout(() => {
            this.endWeatherEvent(eventId);
        }, eventConfig.duration * 60000);
        
        this.emit('weather_event', event);
    }

    endWeatherEvent(eventId) {
        const event = this.weatherEvents.get(eventId);
        if (event) {
            event.status = 'completed';
            event.endTime = Date.now();
            
            const territory = this.territories.get(event.territory);
            console.log(`✅ Weather Event Ended: ${event.type} in ${territory.name}`);
            
            this.broadcastWeatherEventEnd(event);
            this.emit('weather_event_end', event);
            
            // Remove from active events after 1 hour for historical tracking
            setTimeout(() => {
                this.weatherEvents.delete(eventId);
            }, 3600000);
        }
    }

    startWeatherWebSocketServer() {
        const port = 9003;
        this.wss = new WebSocket.Server({ port });
        
        console.log(`🌐 Weather WebSocket server started on port ${port}`);
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New weather client connected');
            this.subscribers.add(ws);
            
            // Send current weather data to new client
            ws.send(JSON.stringify({
                type: 'weather_snapshot',
                territories: Object.fromEntries(this.territoryWeather),
                activeEvents: Array.from(this.weatherEvents.values()),
                timestamp: Date.now()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWeatherWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 Weather client disconnected');
                this.subscribers.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('Weather WebSocket error:', error);
                this.subscribers.delete(ws);
            });
        });
    }

    handleWeatherWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'get_territory_weather':
                const territoryId = data.territory;
                const territoryWeather = this.territoryWeather.get(territoryId);
                if (territoryWeather) {
                    ws.send(JSON.stringify({
                        type: 'territory_weather',
                        territory: territoryId,
                        weather: territoryWeather,
                        timestamp: Date.now()
                    }));
                }
                break;
                
            case 'subscribe_alerts':
                ws.alertSubscriber = true;
                ws.send(JSON.stringify({
                    type: 'alert_subscription_confirmed',
                    timestamp: Date.now()
                }));
                break;
                
            case 'get_weather_forecast':
                this.generateWeatherForecast(data.territory).then(forecast => {
                    ws.send(JSON.stringify({
                        type: 'weather_forecast',
                        territory: data.territory,
                        forecast: forecast,
                        timestamp: Date.now()
                    }));
                });
                break;
        }
    }

    broadcastWeatherEvent(event) {
        const message = JSON.stringify({
            type: 'weather_event',
            event: event,
            timestamp: Date.now()
        });
        
        this.subscribers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    broadcastWeatherEventEnd(event) {
        const message = JSON.stringify({
            type: 'weather_event_end',
            event: event,
            timestamp: Date.now()
        });
        
        this.subscribers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    broadcastWeatherUpdate(territoryId, weather) {
        const message = JSON.stringify({
            type: 'weather_update',
            territory: territoryId,
            weather: weather,
            timestamp: Date.now()
        });
        
        this.subscribers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    startContinuousMonitoring() {
        console.log('🔄 Starting continuous weather monitoring...');
        
        setInterval(async () => {
            await this.updateAllTerritoryWeather();
        }, this.config.updateInterval);
        
        // Check for weather alerts every minute
        setInterval(() => {
            this.checkWeatherAlerts();
        }, 60000);
    }

    async updateAllTerritoryWeather() {
        const updatePromises = Array.from(this.territories.entries()).map(async ([territoryId, territory]) => {
            try {
                const weather = await this.fetchWeatherData(territory.coords);
                const impacts = this.calculateWeatherImpacts(weather, territory);
                
                const updatedData = {
                    ...weather,
                    territory: territory,
                    lastUpdate: Date.now(),
                    impacts: impacts
                };
                
                const previousData = this.territoryWeather.get(territoryId);
                this.territoryWeather.set(territoryId, updatedData);
                
                // Check for significant changes
                if (this.hasSignificantWeatherChange(previousData, updatedData)) {
                    console.log(`🌤️  Significant weather change in ${territory.name}: ${weather.condition}`);
                    this.broadcastWeatherUpdate(territoryId, updatedData);
                    this.emit('weather_change', { territoryId, weather: updatedData, previous: previousData });
                }
                
            } catch (error) {
                console.error(`Failed to update weather for ${territory.name}:`, error.message);
            }
        });
        
        await Promise.allSettled(updatePromises);
    }

    hasSignificantWeatherChange(previous, current) {
        if (!previous) return true;
        
        return (
            previous.condition !== current.condition ||
            Math.abs(previous.temperature - current.temperature) >= 5 ||
            Math.abs(previous.windSpeed - current.windSpeed) >= 15 ||
            Math.abs(previous.visibility - current.visibility) >= 2000
        );
    }

    checkWeatherAlerts() {
        for (const [territoryId, territoryData] of this.territoryWeather) {
            const alerts = this.generateWeatherAlerts(territoryId, territoryData);
            
            if (alerts.length > 0) {
                const alertKey = `${territoryId}_${Date.now()}`;
                this.activeAlerts.set(alertKey, {
                    territory: territoryId,
                    alerts: alerts,
                    timestamp: Date.now()
                });
                
                this.broadcastWeatherAlerts(territoryId, alerts);
                this.emit('weather_alerts', { territoryId, alerts });
                
                // Auto-expire alerts after 1 hour
                setTimeout(() => {
                    this.activeAlerts.delete(alertKey);
                }, 3600000);
            }
        }
    }

    generateWeatherAlerts(territoryId, territoryData) {
        const alerts = [];
        const weather = territoryData;
        const territory = territoryData.territory;
        
        // Temperature alerts
        if (weather.temperature <= this.config.alertThresholds.temperature.extreme_cold) {
            alerts.push({
                type: 'extreme_cold_warning',
                severity: 'high',
                message: `Extreme cold warning for ${territory.name}: ${weather.temperature}°C`,
                recommendations: ['Increase heating capacity', 'Monitor equipment for freezing', 'Check supply lines']
            });
        } else if (weather.temperature >= this.config.alertThresholds.temperature.extreme_heat) {
            alerts.push({
                type: 'extreme_heat_warning',
                severity: 'high',
                message: `Extreme heat warning for ${territory.name}: ${weather.temperature}°C`,
                recommendations: ['Increase cooling capacity', 'Monitor heat-sensitive equipment', 'Hydration protocols']
            });
        }
        
        // Wind alerts
        if (weather.windSpeed >= this.config.alertThresholds.wind.extreme) {
            alerts.push({
                type: 'extreme_wind_warning',
                severity: 'critical',
                message: `Extreme wind warning for ${territory.name}: ${weather.windSpeed} km/h`,
                recommendations: ['Halt outdoor operations', 'Secure loose equipment', 'Communication backup protocols']
            });
        } else if (weather.windSpeed >= this.config.alertThresholds.wind.high) {
            alerts.push({
                type: 'high_wind_advisory',
                severity: 'medium',
                message: `High wind advisory for ${territory.name}: ${weather.windSpeed} km/h`,
                recommendations: ['Exercise caution outdoors', 'Monitor communication systems']
            });
        }
        
        // Visibility alerts
        if (weather.visibility <= this.config.alertThresholds.visibility.poor) {
            alerts.push({
                type: 'poor_visibility_warning',
                severity: 'high',
                message: `Poor visibility warning for ${territory.name}: ${weather.visibility}m`,
                recommendations: ['Restrict travel', 'Enhanced navigation protocols', 'Emergency beacons active']
            });
        } else if (weather.visibility <= this.config.alertThresholds.visibility.low) {
            alerts.push({
                type: 'low_visibility_advisory',
                severity: 'medium',
                message: `Low visibility advisory for ${territory.name}: ${weather.visibility}m`,
                recommendations: ['Reduce travel speed', 'Use enhanced lighting']
            });
        }
        
        return alerts;
    }

    broadcastWeatherAlerts(territoryId, alerts) {
        const message = JSON.stringify({
            type: 'weather_alerts',
            territory: territoryId,
            alerts: alerts,
            timestamp: Date.now()
        });
        
        this.subscribers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN && ws.alertSubscriber) {
                ws.send(message);
            }
        });
    }

    async generateWeatherForecast(territoryId) {
        const territory = this.territories.get(territoryId);
        if (!territory) {
            throw new Error(`Territory ${territoryId} not found`);
        }

        // Generate 7-day forecast (mock implementation - replace with real forecast API)
        const forecast = [];
        const currentWeather = this.territoryWeather.get(territoryId);
        
        for (let i = 1; i <= 7; i++) {
            const futureDate = new Date(Date.now() + (i * 24 * 60 * 60 * 1000));
            
            // Simple forecast simulation
            const tempVariation = (Math.random() - 0.5) * 10;
            const conditionChance = Math.random();
            
            let condition;
            if (conditionChance < 0.3) condition = 'sunny';
            else if (conditionChance < 0.5) condition = 'cloudy';
            else if (conditionChance < 0.7) condition = 'partly_cloudy';
            else if (conditionChance < 0.85) condition = 'rainy';
            else condition = 'stormy';
            
            const forecastDay = {
                date: futureDate.toISOString().split('T')[0],
                condition: condition,
                temperatureHigh: Math.round((currentWeather?.temperature || 20) + tempVariation + 5),
                temperatureLow: Math.round((currentWeather?.temperature || 20) + tempVariation - 5),
                precipitationChance: condition === 'rainy' || condition === 'stormy' ? Math.round(60 + Math.random() * 30) : Math.round(Math.random() * 30),
                windSpeed: Math.round(5 + Math.random() * 25),
                impacts: this.calculateWeatherImpacts({
                    condition: condition,
                    temperature: (currentWeather?.temperature || 20) + tempVariation,
                    windSpeed: Math.round(5 + Math.random() * 25)
                }, territory)
            };
            
            forecast.push(forecastDay);
        }
        
        return forecast;
    }

    // Executive decision integration methods
    async getWeatherContext(territoryId = null) {
        if (territoryId) {
            const territoryWeather = this.territoryWeather.get(territoryId);
            return territoryWeather ? {
                territory: territoryId,
                weather: territoryWeather,
                activeEvents: Array.from(this.weatherEvents.values()).filter(e => e.territory === territoryId),
                alerts: Array.from(this.activeAlerts.values()).filter(a => a.territory === territoryId)
            } : null;
        }
        
        // Return all territory weather data
        return {
            territories: Object.fromEntries(this.territoryWeather),
            globalEvents: Array.from(this.weatherEvents.values()),
            globalAlerts: Array.from(this.activeAlerts.values()),
            summary: this.generateGlobalWeatherSummary()
        };
    }

    generateGlobalWeatherSummary() {
        const territories = Array.from(this.territoryWeather.values());
        
        if (territories.length === 0) {
            return { status: 'no_data' };
        }
        
        const avgTemp = territories.reduce((sum, t) => sum + t.temperature, 0) / territories.length;
        const conditions = territories.map(t => t.condition);
        const dominantCondition = conditions.sort((a, b) =>
            conditions.filter(c => c === a).length - conditions.filter(c => c === b).length
        ).pop();
        
        const activeEventsCount = this.weatherEvents.size;
        const activeAlertsCount = this.activeAlerts.size;
        
        return {
            averageTemperature: Math.round(avgTemp),
            dominantCondition: dominantCondition,
            activeEvents: activeEventsCount,
            activeAlerts: activeAlertsCount,
            overallImpact: this.calculateGlobalWeatherImpact(territories)
        };
    }

    calculateGlobalWeatherImpact(territories) {
        const impacts = territories.map(t => t.impacts);
        
        return {
            resourceProduction: impacts.reduce((sum, i) => sum + i.resourceProduction, 0) / impacts.length,
            factionMorale: impacts.reduce((sum, i) => sum + i.factionMorale, 0) / impacts.length,
            travelSafety: impacts.reduce((sum, i) => sum + i.travelSafety, 0) / impacts.length,
            energyDemand: impacts.reduce((sum, i) => sum + i.energyDemand, 0) / impacts.length,
            communicationReliability: impacts.reduce((sum, i) => sum + i.communicationReliability, 0) / impacts.length
        };
    }

    async influenceExecutiveDecision(decision, weatherContext = null) {
        if (!weatherContext) {
            weatherContext = await this.getWeatherContext();
        }
        
        const weatherInfluence = {
            originalScore: decision.score || 0,
            weatherModifiers: {},
            finalScore: decision.score || 0,
            weatherReasoning: []
        };
        
        // Apply weather-based modifications to decision scoring
        if (decision.territoryId) {
            const territoryWeather = this.territoryWeather.get(decision.territoryId);
            if (territoryWeather && territoryWeather.impacts) {
                const impacts = territoryWeather.impacts;
                
                // Modify score based on weather impacts
                if (decision.type === 'resource_allocation') {
                    const resourceModifier = (impacts.resourceProduction - 1.0) * 0.3;
                    weatherInfluence.finalScore += resourceModifier;
                    weatherInfluence.weatherModifiers.resource_production = resourceModifier;
                    weatherInfluence.weatherReasoning.push(
                        `Weather conditions (${territoryWeather.condition}) affecting resource production by ${Math.round(resourceModifier * 100)}%`
                    );
                }
                
                if (decision.type === 'travel_operation') {
                    const travelModifier = (impacts.travelSafety - 1.0) * 0.5;
                    weatherInfluence.finalScore += travelModifier;
                    weatherInfluence.weatherModifiers.travel_safety = travelModifier;
                    weatherInfluence.weatherReasoning.push(
                        `Travel safety ${impacts.travelSafety < 0.8 ? 'concerns' : 'favorable'} due to current weather`
                    );
                }
                
                if (decision.type === 'communication_operation') {
                    const commModifier = (impacts.communicationReliability - 1.0) * 0.4;
                    weatherInfluence.finalScore += commModifier;
                    weatherInfluence.weatherModifiers.communication = commModifier;
                    weatherInfluence.weatherReasoning.push(
                        `Communication reliability at ${Math.round(impacts.communicationReliability * 100)}% due to weather`
                    );
                }
            }
        }
        
        // Check for active weather events affecting the decision
        const relevantEvents = Array.from(this.weatherEvents.values()).filter(event => 
            !decision.territoryId || event.territory === decision.territoryId
        );
        
        for (const event of relevantEvents) {
            if (event.effects.emergency_protocols && decision.priority < 0.8) {
                weatherInfluence.finalScore -= 0.3;
                weatherInfluence.weatherReasoning.push(
                    `Active weather emergency (${event.type}) recommends postponing non-critical operations`
                );
            }
            
            if (event.effects.stealth_operations_boost && decision.type === 'covert_operation') {
                weatherInfluence.finalScore += 0.2;
                weatherInfluence.weatherReasoning.push(
                    `Weather event (${event.type}) provides advantage for covert operations`
                );
            }
        }
        
        decision.weatherInfluence = weatherInfluence;
        return decision;
    }

    // API endpoints for external integration
    getAPIEndpoints() {
        return {
            '/api/weather/territories': 'GET - List all territory weather',
            '/api/weather/territory/:id': 'GET - Get specific territory weather',
            '/api/weather/forecast/:id': 'GET - Get weather forecast for territory',
            '/api/weather/events': 'GET - List active weather events',
            '/api/weather/alerts': 'GET - Get active weather alerts',
            '/api/weather/context': 'GET - Get complete weather context for decisions',
            '/api/weather/influence': 'POST - Apply weather influence to a decision'
        };
    }

    async handleAPIRequest(method, path, params = {}, body = null) {
        try {
            switch (`${method} ${path}`) {
                case 'GET /api/weather/territories':
                    return Object.fromEntries(this.territoryWeather);
                
                case 'GET /api/weather/territory/:id':
                    const territoryWeather = this.territoryWeather.get(params.id);
                    if (!territoryWeather) {
                        throw new Error(`Territory ${params.id} not found`);
                    }
                    return territoryWeather;
                
                case 'GET /api/weather/forecast/:id':
                    return await this.generateWeatherForecast(params.id);
                
                case 'GET /api/weather/events':
                    return Array.from(this.weatherEvents.values());
                
                case 'GET /api/weather/alerts':
                    return Array.from(this.activeAlerts.values());
                
                case 'GET /api/weather/context':
                    return await this.getWeatherContext(params.territoryId);
                
                case 'POST /api/weather/influence':
                    if (!body || !body.decision) {
                        throw new Error('Decision object required in request body');
                    }
                    return await this.influenceExecutiveDecision(body.decision, body.weatherContext);
                
                default:
                    throw new Error(`Unknown endpoint: ${method} ${path}`);
            }
        } catch (error) {
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // Utility methods
    async shutdown() {
        console.log('🌪️  Shutting down Weather-Aware Executive System...');
        
        if (this.wss) {
            this.wss.close();
        }
        
        // Clear all intervals
        clearInterval(this.weatherUpdateInterval);
        clearInterval(this.alertCheckInterval);
        clearInterval(this.eventCheckInterval);
        
        this.emit('system_shutdown');
        console.log('✅ Weather system shutdown complete');
    }

    getSystemStatus() {
        return {
            territories: this.territories.size,
            activeWeatherData: this.territoryWeather.size,
            activeEvents: this.weatherEvents.size,
            activeAlerts: this.activeAlerts.size,
            connectedClients: this.subscribers.size,
            lastUpdate: Math.max(...Array.from(this.territoryWeather.values()).map(t => t.lastUpdate)),
            systemUptime: Date.now() - (this.startTime || Date.now())
        };
    }
}

// Example usage and testing
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🌤️  Starting Weather-Aware Executive System...');
    
    const weatherExecutive = new WeatherAwareExecutive({
        updateInterval: 300000, // 5 minutes
        weatherApiKey: process.env.WEATHER_API_KEY || 'demo_key'
    });
    
    weatherExecutive.on('system_ready', () => {
        console.log('✅ Weather Executive System ready for operations');
        
        // Example of weather-influenced decision
        setTimeout(async () => {
            const testDecision = {
                id: 'test_decision_001',
                type: 'resource_allocation',
                territoryId: 'tech_valley',
                description: 'Allocate computing resources for new project',
                score: 0.7,
                priority: 0.6
            };
            
            const influencedDecision = await weatherExecutive.influenceExecutiveDecision(testDecision);
            console.log('🧠 Weather-influenced decision:', influencedDecision.weatherInfluence);
        }, 5000);
    });
    
    weatherExecutive.on('weather_event', (event) => {
        console.log(`⚡ Weather Event: ${event.type} in territory ${event.territory}`);
    });
    
    weatherExecutive.on('weather_alerts', ({ territoryId, alerts }) => {
        console.log(`🚨 Weather Alerts for ${territoryId}:`, alerts.map(a => a.message));
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await weatherExecutive.shutdown();
        process.exit(0);
    });
}

export default WeatherAwareExecutive;