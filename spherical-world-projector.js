/**
 * 🌍 SPHERICAL WORLD PROJECTOR
 * 
 * Projects a spherical world onto various flat map projections
 * Supports multiple projection types for different use cases
 * Integrates with wave topography and financial systems
 */

class SphericalWorldProjector {
    constructor() {
        // Earth-like sphere parameters
        this.sphere = {
            radius: 6371, // km (Earth radius)
            circumference: 40075, // km at equator
            surfaceArea: 510072000, // km²
            flattening: 1/298.257223563 // WGS84 ellipsoid flattening
        };
        
        // Map bounds for flat projections
        this.bounds = {
            minLat: -90,
            maxLat: 90,
            minLon: -180,
            maxLon: 180,
            width: 2048, // pixels or units
            height: 1024
        };
        
        // Available projection types
        this.projectionTypes = {
            MERCATOR: 'mercator',
            EQUAL_AREA: 'equalArea',
            ROBINSON: 'robinson',
            WINKEL_TRIPEL: 'winkelTripel',
            ORTHOGRAPHIC: 'orthographic',
            STEREOGRAPHIC: 'stereographic'
        };
        
        // Financial mapping parameters
        this.financialZones = new Map();
        this.initializeFinancialZones();
        
        console.log('🌍 Spherical World Projector initialized');
    }
    
    /**
     * Initialize financial zones based on geography
     */
    initializeFinancialZones() {
        // Major financial centers as high-value zones
        this.financialZones.set('NYC', { lat: 40.7128, lon: -74.0060, value: 1000000 });
        this.financialZones.set('London', { lat: 51.5074, lon: -0.1278, value: 900000 });
        this.financialZones.set('Tokyo', { lat: 35.6762, lon: 139.6503, value: 850000 });
        this.financialZones.set('Singapore', { lat: 1.3521, lon: 103.8198, value: 800000 });
        this.financialZones.set('Zurich', { lat: 47.3769, lon: 8.5417, value: 750000 });
    }
    
    /**
     * Convert spherical coordinates to flat map
     */
    sphereToFlat(lat, lon, projectionType = 'mercator') {
        // Validate inputs
        lat = this.clamp(lat, -90, 90);
        lon = this.normalizelon(lon);
        
        switch (projectionType) {
            case this.projectionTypes.MERCATOR:
                return this.mercatorProjection(lat, lon);
            case this.projectionTypes.EQUAL_AREA:
                return this.lambertAzimuthalProjection(lat, lon);
            case this.projectionTypes.ROBINSON:
                return this.robinsonProjection(lat, lon);
            case this.projectionTypes.WINKEL_TRIPEL:
                return this.winkelTripelProjection(lat, lon);
            case this.projectionTypes.ORTHOGRAPHIC:
                return this.orthographicProjection(lat, lon);
            case this.projectionTypes.STEREOGRAPHIC:
                return this.stereographicProjection(lat, lon);
            default:
                return this.mercatorProjection(lat, lon);
        }
    }
    
    /**
     * Mercator projection - preserves angles, distorts area
     */
    mercatorProjection(lat, lon) {
        const latRad = lat * Math.PI / 180;
        const lonRad = lon * Math.PI / 180;
        
        const x = this.sphere.radius * lonRad;
        const y = this.sphere.radius * Math.log(Math.tan(Math.PI/4 + latRad/2));
        
        return this.normalizeCoordinates(x, y);
    }
    
    /**
     * Lambert Azimuthal Equal-Area projection - preserves area
     */
    lambertAzimuthalProjection(lat, lon, centerLat = 0, centerLon = 0) {
        const phi = lat * Math.PI / 180;
        const lambda = lon * Math.PI / 180;
        const phi0 = centerLat * Math.PI / 180;
        const lambda0 = centerLon * Math.PI / 180;
        
        const k = Math.sqrt(2 / (1 + Math.sin(phi0) * Math.sin(phi) + 
                            Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0)));
        
        const x = this.sphere.radius * k * Math.cos(phi) * Math.sin(lambda - lambda0);
        const y = this.sphere.radius * k * (Math.cos(phi0) * Math.sin(phi) - 
                  Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0));
        
        return this.normalizeCoordinates(x, y);
    }
    
    /**
     * Robinson projection - pseudocylindrical compromise projection
     */
    robinsonProjection(lat, lon) {
        // Robinson projection table values
        const robinsonTable = [
            [0, 1.0000, 0.0000],
            [5, 1.0000, 0.0620],
            [10, 0.9986, 0.1240],
            [15, 0.9954, 0.1860],
            [20, 0.9900, 0.2480],
            [25, 0.9822, 0.3100],
            [30, 0.9730, 0.3720],
            [35, 0.9600, 0.4340],
            [40, 0.9427, 0.4958],
            [45, 0.9216, 0.5571],
            [50, 0.8962, 0.6176],
            [55, 0.8679, 0.6769],
            [60, 0.8350, 0.7346],
            [65, 0.7986, 0.7903],
            [70, 0.7597, 0.8435],
            [75, 0.7186, 0.8936],
            [80, 0.6732, 0.9394],
            [85, 0.6213, 0.9761],
            [90, 0.5722, 1.0000]
        ];
        
        const absLat = Math.abs(lat);
        const sign = lat < 0 ? -1 : 1;
        
        // Interpolate from table
        let x = lon * this.interpolateRobinson(absLat, robinsonTable, 1);
        let y = sign * this.interpolateRobinson(absLat, robinsonTable, 2);
        
        x *= this.sphere.radius * Math.PI / 180;
        y *= this.sphere.radius;
        
        return this.normalizeCoordinates(x, y);
    }
    
    /**
     * Winkel Tripel projection - compromise between area and shape
     */
    winkelTripelProjection(lat, lon) {
        const phi = lat * Math.PI / 180;
        const lambda = lon * Math.PI / 180;
        const alpha = Math.acos(Math.cos(phi) * Math.cos(lambda / 2));
        
        // Aitoff projection component
        const x1 = 2 * Math.cos(phi) * Math.sin(lambda / 2) / sinc(alpha);
        const y1 = Math.sin(phi) / sinc(alpha);
        
        // Equirectangular component
        const x2 = lambda * 2 / Math.PI;
        const y2 = phi;
        
        // Average the two projections
        const x = this.sphere.radius * (x1 + x2) / 2;
        const y = this.sphere.radius * (y1 + y2) / 2;
        
        return this.normalizeCoordinates(x, y);
    }
    
    /**
     * Orthographic projection - view from space
     */
    orthographicProjection(lat, lon, viewLat = 0, viewLon = 0) {
        const phi = lat * Math.PI / 180;
        const lambda = lon * Math.PI / 180;
        const phi0 = viewLat * Math.PI / 180;
        const lambda0 = viewLon * Math.PI / 180;
        
        const cosc = Math.sin(phi0) * Math.sin(phi) + 
                     Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0);
        
        if (cosc < 0) {
            // Point is on the far side of the sphere
            return null;
        }
        
        const x = this.sphere.radius * Math.cos(phi) * Math.sin(lambda - lambda0);
        const y = this.sphere.radius * (Math.cos(phi0) * Math.sin(phi) - 
                  Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0));
        
        return this.normalizeCoordinates(x, y);
    }
    
    /**
     * Stereographic projection - conformal azimuthal
     */
    stereographicProjection(lat, lon, centerLat = 0, centerLon = 0) {
        const phi = lat * Math.PI / 180;
        const lambda = lon * Math.PI / 180;
        const phi0 = centerLat * Math.PI / 180;
        const lambda0 = centerLon * Math.PI / 180;
        
        const k = 2 / (1 + Math.sin(phi0) * Math.sin(phi) + 
                  Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0));
        
        const x = this.sphere.radius * k * Math.cos(phi) * Math.sin(lambda - lambda0);
        const y = this.sphere.radius * k * (Math.cos(phi0) * Math.sin(phi) - 
                  Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda - lambda0));
        
        return this.normalizeCoordinates(x, y);
    }
    
    /**
     * Inverse projection - convert flat coordinates back to sphere
     */
    flatToSphere(x, y, projectionType = 'mercator') {
        // Denormalize coordinates
        const coords = this.denormalizeCoordinates(x, y);
        
        switch (projectionType) {
            case this.projectionTypes.MERCATOR:
                return this.inverseMercator(coords.x, coords.y);
            case this.projectionTypes.EQUAL_AREA:
                return this.inverseLambertAzimuthal(coords.x, coords.y);
            // Add other inverse projections as needed
            default:
                return this.inverseMercator(coords.x, coords.y);
        }
    }
    
    /**
     * Inverse Mercator projection
     */
    inverseMercator(x, y) {
        const lon = (x / this.sphere.radius) * 180 / Math.PI;
        const lat = (2 * Math.atan(Math.exp(y / this.sphere.radius)) - Math.PI / 2) * 180 / Math.PI;
        
        return { lat, lon };
    }
    
    /**
     * Calculate financial value based on location
     */
    calculateFinancialValue(lat, lon) {
        let totalValue = 0;
        
        // Calculate proximity to financial centers
        this.financialZones.forEach((zone, name) => {
            const distance = this.haversineDistance(lat, lon, zone.lat, zone.lon);
            const influence = Math.max(0, 1 - distance / 10000); // 10000km influence radius
            totalValue += zone.value * influence;
        });
        
        // Add base value based on latitude (economic activity correlation)
        const latitudeFactor = Math.cos(lat * Math.PI / 180);
        totalValue += 10000 * latitudeFactor;
        
        return Math.floor(totalValue);
    }
    
    /**
     * Calculate great circle distance between two points
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = this.sphere.radius;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    /**
     * Normalize coordinates to pixel space
     */
    normalizeCoordinates(x, y) {
        // Scale to fit in bounds
        const maxDim = Math.max(this.bounds.width, this.bounds.height);
        const scale = maxDim / (2 * Math.PI * this.sphere.radius);
        
        return {
            x: x * scale + this.bounds.width / 2,
            y: -y * scale + this.bounds.height / 2 // Flip y-axis for screen coordinates
        };
    }
    
    /**
     * Denormalize from pixel space
     */
    denormalizeCoordinates(x, y) {
        const maxDim = Math.max(this.bounds.width, this.bounds.height);
        const scale = maxDim / (2 * Math.PI * this.sphere.radius);
        
        return {
            x: (x - this.bounds.width / 2) / scale,
            y: -(y - this.bounds.height / 2) / scale
        };
    }
    
    /**
     * Interpolate Robinson projection values
     */
    interpolateRobinson(lat, table, column) {
        for (let i = 0; i < table.length - 1; i++) {
            if (lat >= table[i][0] && lat <= table[i + 1][0]) {
                const t = (lat - table[i][0]) / (table[i + 1][0] - table[i][0]);
                return table[i][column] * (1 - t) + table[i + 1][column] * t;
            }
        }
        return table[table.length - 1][column];
    }
    
    /**
     * Utility functions
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    normalizelon(lon) {
        while (lon > 180) lon -= 360;
        while (lon < -180) lon += 360;
        return lon;
    }
    
    // sinc function for projections
    sinc(x) {
        return x === 0 ? 1 : Math.sin(x) / x;
    }
}

// Helper function
function sinc(x) {
    return x === 0 ? 1 : Math.sin(x) / x;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SphericalWorldProjector;
}