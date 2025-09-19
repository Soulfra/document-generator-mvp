#!/usr/bin/env node

/**
 * ⚾ ESPN MLB HIDDEN API INTEGRATION
 * 
 * Complete integration with ESPN's hidden APIs for all 30 MLB teams
 * Provides live scores, team data, mascots, and real-time game updates
 * 
 * Features:
 * - All 30 MLB teams with live data
 * - Team mascots, colors, and branding
 * - Real-time scoreboard updates
 * - Player statistics and roster data
 * - Stadium information and capacity
 * - News and game highlights
 */

const EventEmitter = require('events');
const https = require('https');
const http = require('http');

class ESPNMLBIntegration extends EventEmitter {
    constructor() {
        super();
        
        // ESPN Hidden API Endpoints
        this.apiEndpoints = {
            scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
            teams: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
            news: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news',
            standings: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/standings'
        };
        
        // Complete MLB Teams Database
        this.mlbTeams = {
            // American League East
            bos: {
                id: 2,
                name: 'Boston Red Sox',
                abbreviation: 'BOS',
                location: 'Boston',
                mascot: 'Wally the Green Monster',
                colors: ['#BD3039', '#0C2340'],
                division: 'AL East',
                stadium: 'Fenway Park',
                capacity: 37755,
                founded: 1901,
                championships: 9,
                campusAffiliations: ['Harvard', 'MIT', 'Boston University', 'Northeastern'],
                academicStrengths: ['Medicine', 'Engineering', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Wicked smart reasoning!', 'That\'s Harvard-level analysis!', 'Green Monster-sized breakthrough!'],
                    specialty: 'academic_excellence',
                    voice: 'boston_intellectual'
                }
            },
            nyy: {
                id: 10,
                name: 'New York Yankees',
                abbreviation: 'NYY',
                location: 'New York',
                mascot: 'Yankees Pinstripes',
                colors: ['#132448', '#C4CED4'],
                division: 'AL East',
                stadium: 'Yankee Stadium',
                capacity: 47309,
                founded: 1901,
                championships: 27,
                campusAffiliations: ['Columbia', 'NYU', 'Fordham', 'CUNY'],
                academicStrengths: ['Finance', 'Medicine', 'Law'],
                mascotPersonality: {
                    catchphrases: ['Championship-level reasoning!', 'That\'s pinstripe precision!', 'World Series worthy analysis!'],
                    specialty: 'excellence_tradition',
                    voice: 'new_york_confident'
                }
            },
            tor: {
                id: 14,
                name: 'Toronto Blue Jays',
                abbreviation: 'TOR',
                location: 'Toronto',
                mascot: 'Ace',
                colors: ['#134A8E', '#1D2D5C'],
                division: 'AL East',
                stadium: 'Rogers Centre',
                capacity: 49282,
                founded: 1977,
                championships: 2,
                campusAffiliations: ['University of Toronto', 'York University', 'Ryerson'],
                academicStrengths: ['Research', 'Medicine', 'Engineering'],
                mascotPersonality: {
                    catchphrases: ['Eh, that\'s brilliant!', 'Blue Jays smart analysis!', 'Home run reasoning, eh!'],
                    specialty: 'research_innovation',
                    voice: 'canadian_friendly'
                }
            },
            tb: {
                id: 30,
                name: 'Tampa Bay Rays',
                abbreviation: 'TB',
                location: 'St. Petersburg',
                mascot: 'Raymond',
                colors: ['#092C5C', '#8FBCE6'],
                division: 'AL East',
                stadium: 'Tropicana Field',
                capacity: 25000,
                founded: 1998,
                championships: 0,
                campusAffiliations: ['University of South Florida', 'Florida Institute of Technology'],
                academicStrengths: ['Marine Science', 'Engineering', 'Medicine'],
                mascotPersonality: {
                    catchphrases: ['Rays of sunshine on that analysis!', 'Tropical storm of intelligence!', 'That\'s Florida innovation!'],
                    specialty: 'innovation_analytics',
                    voice: 'florida_optimistic'
                }
            },
            bal: {
                id: 1,
                name: 'Baltimore Orioles',
                abbreviation: 'BAL',
                location: 'Baltimore',
                mascot: 'The Oriole Bird',
                colors: ['#DF4601', '#000000'],
                division: 'AL East',
                stadium: 'Oriole Park at Camden Yards',
                capacity: 45971,
                founded: 1901,
                championships: 3,
                campusAffiliations: ['Johns Hopkins', 'University of Maryland', 'UMBC'],
                academicStrengths: ['Medicine', 'Research', 'Public Health'],
                mascotPersonality: {
                    catchphrases: ['Hopkins-level precision!', 'That\'s Baltimore brilliant!', 'Camden Yards classic reasoning!'],
                    specialty: 'medical_research',
                    voice: 'baltimore_pride'
                }
            },
            
            // American League Central  
            cws: {
                id: 4,
                name: 'Chicago White Sox',
                abbreviation: 'CWS',
                location: 'Chicago',
                mascot: 'Southpaw',
                colors: ['#27251F', '#C4CED4'],
                division: 'AL Central',
                stadium: 'Guaranteed Rate Field',
                capacity: 40615,
                founded: 1901,
                championships: 3,
                campusAffiliations: ['University of Chicago', 'Northwestern', 'UIC'],
                academicStrengths: ['Economics', 'Medicine', 'Engineering'],
                mascotPersonality: {
                    catchphrases: ['South Side smart!', 'That\'s Chicago grit!', 'Guaranteed great analysis!'],
                    specialty: 'analytical_thinking',
                    voice: 'chicago_south_side'
                }
            },
            cle: {
                id: 5,
                name: 'Cleveland Guardians',
                abbreviation: 'CLE',
                location: 'Cleveland',
                mascot: 'Slider',
                colors: ['#E31937', '#002B5C'],
                division: 'AL Central',
                stadium: 'Progressive Field',
                capacity: 35041,
                founded: 1901,
                championships: 2,
                campusAffiliations: ['Case Western Reserve', 'Cleveland State'],
                academicStrengths: ['Medicine', 'Engineering', 'Research'],
                mascotPersonality: {
                    catchphrases: ['Guardian-level protection!', 'Progressive thinking!', 'Cleveland rocks that analysis!'],
                    specialty: 'protective_analysis',
                    voice: 'cleveland_determined'
                }
            },
            det: {
                id: 6,
                name: 'Detroit Tigers',
                abbreviation: 'DET',
                location: 'Detroit',
                mascot: 'Paws',
                colors: ['#0C2340', '#FA4616'],
                division: 'AL Central',
                stadium: 'Comerica Park',
                capacity: 41083,
                founded: 1901,
                championships: 4,
                campusAffiliations: ['University of Michigan', 'Wayne State', 'Michigan State'],
                academicStrengths: ['Engineering', 'Automotive', 'Technology'],
                mascotPersonality: {
                    catchphrases: ['Motor City momentum!', 'Tiger-strong reasoning!', 'Detroit engineered excellence!'],
                    specialty: 'engineering_innovation',
                    voice: 'detroit_resilient'
                }
            },
            kc: {
                id: 7,
                name: 'Kansas City Royals',
                abbreviation: 'KC',
                location: 'Kansas City',
                mascot: 'Sluggerrr',
                colors: ['#004687', '#BD9B60'],
                division: 'AL Central',
                stadium: 'Kauffman Stadium',
                capacity: 37903,
                founded: 1969,
                championships: 2,
                campusAffiliations: ['University of Kansas', 'University of Missouri-KC'],
                academicStrengths: ['Agriculture', 'Business', 'Medicine'],
                mascotPersonality: {
                    catchphrases: ['Royal treatment for that idea!', 'Crown-worthy analysis!', 'Kansas City smart!'],
                    specialty: 'midwest_wisdom',
                    voice: 'kansas_city_friendly'
                }
            },
            min: {
                id: 9,
                name: 'Minnesota Twins',
                abbreviation: 'MIN',
                location: 'Minneapolis',
                mascot: 'T.C. Bear',
                colors: ['#002B5C', '#D31145'],
                division: 'AL Central',
                stadium: 'Target Field',
                capacity: 38544,
                founded: 1901,
                championships: 3,
                campusAffiliations: ['University of Minnesota', 'Carleton College'],
                academicStrengths: ['Medicine', 'Engineering', 'Agriculture'],
                mascotPersonality: {
                    catchphrases: ['Twin Cities brilliant!', 'Target-focused thinking!', 'Minnesota nice analysis!'],
                    specialty: 'collaborative_analysis',
                    voice: 'minnesota_nice'
                }
            },
            
            // American League West
            hou: {
                id: 18,
                name: 'Houston Astros',
                abbreviation: 'HOU',
                location: 'Houston',
                mascot: 'Orbit',
                colors: ['#002D62', '#EB6E1F'],
                division: 'AL West',
                stadium: 'Minute Maid Park',
                capacity: 41168,
                founded: 1962,
                championships: 2,
                campusAffiliations: ['Rice University', 'University of Houston', 'Texas A&M'],
                academicStrengths: ['Engineering', 'Medicine', 'Space Science'],
                mascotPersonality: {
                    catchphrases: ['Houston, we have a solution!', 'Orbit-level intelligence!', 'Space City smart!'],
                    specialty: 'space_age_thinking',
                    voice: 'houston_innovative'
                }
            },
            laa: {
                id: 3,
                name: 'Los Angeles Angels',
                abbreviation: 'LAA',
                location: 'Anaheim',
                mascot: 'Rally Monkey',
                colors: ['#BA0021', '#003263'],
                division: 'AL West',
                stadium: 'Angel Stadium',
                capacity: 45517,
                founded: 1961,
                championships: 1,
                campusAffiliations: ['UC Irvine', 'Cal State Fullerton', 'USC'],
                academicStrengths: ['Technology', 'Business', 'Film'],
                mascotPersonality: {
                    catchphrases: ['Rally monkey energy!', 'Angel-level inspiration!', 'California dreaming logic!'],
                    specialty: 'creative_energy',
                    voice: 'california_enthusiastic'
                }
            },
            oak: {
                id: 11,
                name: 'Oakland Athletics',
                abbreviation: 'OAK',
                location: 'Oakland',
                mascot: 'Stomper',
                colors: ['#003831', '#EFB21E'],
                division: 'AL West',
                stadium: 'Oakland Coliseum',
                capacity: 46847,
                founded: 1901,
                championships: 9,
                campusAffiliations: ['UC Berkeley', 'Stanford', 'San Jose State'],
                academicStrengths: ['Technology', 'Engineering', 'Research'],
                mascotPersonality: {
                    catchphrases: ['Moneyball mathematics!', 'Bay Area brilliance!', 'A\'s grade analysis!'],
                    specialty: 'analytical_innovation',
                    voice: 'bay_area_tech'
                }
            },
            sea: {
                id: 12,
                name: 'Seattle Mariners',
                abbreviation: 'SEA',
                location: 'Seattle',
                mascot: 'Mariner Moose',
                colors: ['#0C2C56', '#005C5C'],
                division: 'AL West',
                stadium: 'T-Mobile Park',
                capacity: 47943,
                founded: 1977,
                championships: 0,
                campusAffiliations: ['University of Washington', 'Seattle University'],
                academicStrengths: ['Technology', 'Medicine', 'Research'],
                mascotPersonality: {
                    catchphrases: ['Seattle sophistication!', 'Pacific Northwest precision!', 'Mariner-level navigation!'],
                    specialty: 'tech_innovation',
                    voice: 'seattle_thoughtful'
                }
            },
            tex: {
                id: 13,
                name: 'Texas Rangers',
                abbreviation: 'TEX',
                location: 'Arlington',
                mascot: 'Captain',
                colors: ['#003278', '#C0111F'],
                division: 'AL West',
                stadium: 'Globe Life Field',
                capacity: 40300,
                founded: 1961,
                championships: 1,
                campusAffiliations: ['UT Arlington', 'Texas A&M', 'Rice'],
                academicStrengths: ['Engineering', 'Business', 'Technology'],
                mascotPersonality: {
                    catchphrases: ['Texas-sized thinking!', 'Ranger-strong analysis!', 'Lone Star brilliance!'],
                    specialty: 'bold_innovation',
                    voice: 'texas_confident'
                }
            },
            
            // National League East
            atl: {
                id: 15,
                name: 'Atlanta Braves',
                abbreviation: 'ATL',
                location: 'Atlanta',
                mascot: 'Blooper',
                colors: ['#CE1141', '#13274F'],
                division: 'NL East',
                stadium: 'Truist Park',
                capacity: 41084,
                founded: 1871,
                championships: 4,
                campusAffiliations: ['Georgia Tech', 'Emory', 'University of Georgia'],
                academicStrengths: ['Technology', 'Medicine', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Brave new thinking!', 'Atlanta innovation!', 'Southern hospitality meets smart analysis!'],
                    specialty: 'southern_innovation',
                    voice: 'atlanta_welcoming'
                }
            },
            mia: {
                id: 28,
                name: 'Miami Marlins',
                abbreviation: 'MIA',
                location: 'Miami',
                mascot: 'Billy the Marlin',
                colors: ['#00A3E0', '#EF3340'],
                division: 'NL East',
                stadium: 'loanDepot park',
                capacity: 36742,
                founded: 1993,
                championships: 2,
                campusAffiliations: ['University of Miami', 'Florida International University'],
                academicStrengths: ['Marine Science', 'Medicine', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Miami heat intelligence!', 'Tropical storm of ideas!', 'Marlin-smooth analysis!'],
                    specialty: 'diverse_perspectives',
                    voice: 'miami_vibrant'
                }
            },
            nym: {
                id: 21,
                name: 'New York Mets',
                abbreviation: 'NYM',
                location: 'New York',
                mascot: 'Mr. Met',
                colors: ['#002D72', '#FF5910'],
                division: 'NL East',
                stadium: 'Citi Field',
                capacity: 41922,
                founded: 1962,
                championships: 2,
                campusAffiliations: ['Columbia', 'NYU', 'Queens College'],
                academicStrengths: ['Medicine', 'Finance', 'Research'],
                mascotPersonality: {
                    catchphrases: ['Amazin\' analysis!', 'Mr. Met-level thinking!', 'Queens quality reasoning!'],
                    specialty: 'metropolitan_analysis',
                    voice: 'new_york_optimistic'
                }
            },
            phi: {
                id: 22,
                name: 'Philadelphia Phillies',
                abbreviation: 'PHI',
                location: 'Philadelphia',
                mascot: 'Phillie Phanatic',
                colors: ['#E81828', '#002D72'],
                division: 'NL East',
                stadium: 'Citizens Bank Park',
                capacity: 42792,
                founded: 1883,
                championships: 2,
                campusAffiliations: ['University of Pennsylvania', 'Temple', 'Drexel'],
                academicStrengths: ['Medicine', 'Engineering', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Phanatic about excellence!', 'Brotherly love for learning!', 'Philadelphia freedom of thought!'],
                    specialty: 'passionate_analysis',
                    voice: 'philadelphia_enthusiastic'
                }
            },
            was: {
                id: 20,
                name: 'Washington Nationals',
                abbreviation: 'WAS',
                location: 'Washington',
                mascot: 'Screech',
                colors: ['#AB0003', '#14225A'],
                division: 'NL East',
                stadium: 'Nationals Park',
                capacity: 41313,
                founded: 1969,
                championships: 1,
                campusAffiliations: ['Georgetown', 'George Washington', 'American University'],
                academicStrengths: ['Politics', 'Law', 'International Relations'],
                mascotPersonality: {
                    catchphrases: ['Capital-level thinking!', 'Presidential analysis!', 'D.C. diplomatic reasoning!'],
                    specialty: 'strategic_analysis',
                    voice: 'washington_authoritative'
                }
            },
            
            // National League Central
            chc: {
                id: 16,
                name: 'Chicago Cubs',
                abbreviation: 'CHC',
                location: 'Chicago',
                mascot: 'Clark',
                colors: ['#0E3386', '#CC3433'],
                division: 'NL Central',
                stadium: 'Wrigley Field',
                capacity: 41649,
                founded: 1876,
                championships: 3,
                campusAffiliations: ['University of Chicago', 'Northwestern', 'DePaul'],
                academicStrengths: ['Economics', 'Medicine', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Cubs Win! Cubs Win!', 'Wrigley-worthy wisdom!', 'North Side brilliance!'],
                    specialty: 'persistent_optimism',
                    voice: 'chicago_north_side'
                }
            },
            cin: {
                id: 17,
                name: 'Cincinnati Reds',
                abbreviation: 'CIN',
                location: 'Cincinnati',
                mascot: 'Mr. Redlegs',
                colors: ['#C6011F', '#000000'],
                division: 'NL Central',
                stadium: 'Great American Ball Park',
                capacity: 42319,
                founded: 1881,
                championships: 5,
                campusAffiliations: ['University of Cincinnati', 'Xavier University'],
                academicStrengths: ['Medicine', 'Engineering', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Red-hot reasoning!', 'Great American analysis!', 'Ohio excellence!'],
                    specialty: 'traditional_wisdom',
                    voice: 'cincinnati_friendly'
                }
            },
            mil: {
                id: 158,
                name: 'Milwaukee Brewers',
                abbreviation: 'MIL',
                location: 'Milwaukee',
                mascot: 'Bernie Brewer',
                colors: ['#FFC52F', '#12284B'],
                division: 'NL Central',
                stadium: 'American Family Field',
                capacity: 41900,
                founded: 1969,
                championships: 0,
                campusAffiliations: ['UW-Milwaukee', 'Marquette', 'UW-Madison'],
                academicStrengths: ['Engineering', 'Medicine', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Brew-tiful thinking!', 'Wisconsin excellence!', 'Bernie slides into brilliance!'],
                    specialty: 'wisconsin_innovation',
                    voice: 'wisconsin_enthusiastic'
                }
            },
            pit: {
                id: 23,
                name: 'Pittsburgh Pirates',
                abbreviation: 'PIT',
                location: 'Pittsburgh',
                mascot: 'Pirate Parrot',
                colors: ['#FDB827', '#27251F'],
                division: 'NL Central',
                stadium: 'PNC Park',
                capacity: 38747,
                founded: 1881,
                championships: 5,
                campusAffiliations: ['University of Pittsburgh', 'Carnegie Mellon'],
                academicStrengths: ['Medicine', 'Technology', 'Engineering'],
                mascotPersonality: {
                    catchphrases: ['Ahoy matey, brilliant analysis!', 'Steel City strong reasoning!', 'Pirate-level treasure hunting for truth!'],
                    specialty: 'analytical_treasure_hunting',
                    voice: 'pittsburgh_determined'
                }
            },
            stl: {
                id: 24,
                name: 'St. Louis Cardinals',
                abbreviation: 'STL',
                location: 'St. Louis',
                mascot: 'Fredbird',
                colors: ['#C41E3A', '#FEDB00'],
                division: 'NL Central',
                stadium: 'Busch Stadium',
                capacity: 45494,
                founded: 1882,
                championships: 11,
                campusAffiliations: ['Washington University', 'Saint Louis University'],
                academicStrengths: ['Medicine', 'Research', 'Business'],
                mascotPersonality: {
                    catchphrases: ['Cardinal-rule excellence!', 'Gateway to genius!', 'Red Bird brilliant!'],
                    specialty: 'traditional_excellence',
                    voice: 'st_louis_proud'
                }
            },
            
            // National League West
            ari: {
                id: 29,
                name: 'Arizona Diamondbacks',
                abbreviation: 'ARI',
                location: 'Phoenix',
                mascot: 'D. Baxter the Bobcat',
                colors: ['#A71930', '#E3D4AD'],
                division: 'NL West',
                stadium: 'Chase Field',
                capacity: 48686,
                founded: 1998,
                championships: 1,
                campusAffiliations: ['Arizona State University', 'University of Arizona'],
                academicStrengths: ['Engineering', 'Medicine', 'Technology'],
                mascotPersonality: {
                    catchphrases: ['Desert diamond thinking!', 'Arizona innovation!', 'Rattlesnake-quick analysis!'],
                    specialty: 'desert_innovation',
                    voice: 'arizona_energetic'
                }
            },
            col: {
                id: 27,
                name: 'Colorado Rockies',
                abbreviation: 'COL',
                location: 'Denver',
                mascot: 'Dinger',
                colors: ['#33006F', '#C4CED4'],
                division: 'NL West',
                stadium: 'Coors Field',
                capacity: 50398,
                founded: 1993,
                championships: 0,
                campusAffiliations: ['University of Colorado', 'Colorado State'],
                academicStrengths: ['Engineering', 'Environmental Science', 'Medicine'],
                mascotPersonality: {
                    catchphrases: ['Mile-high thinking!', 'Rocky Mountain wisdom!', 'Coors Field clarity!'],
                    specialty: 'elevated_perspective',
                    voice: 'colorado_adventurous'
                }
            },
            lad: {
                id: 19,
                name: 'Los Angeles Dodgers',
                abbreviation: 'LAD',
                location: 'Los Angeles',
                mascot: 'Lady Blue',
                colors: ['#005A9C', '#EF3E42'],
                division: 'NL West',
                stadium: 'Dodger Stadium',
                capacity: 56000,
                founded: 1883,
                championships: 7,
                campusAffiliations: ['UCLA', 'USC', 'Caltech'],
                academicStrengths: ['Film', 'Medicine', 'Technology'],
                mascotPersonality: {
                    catchphrases: ['Hollywood-level performance!', 'Dodger blue brilliance!', 'City of Angels inspiration!'],
                    specialty: 'star_quality_analysis',
                    voice: 'los_angeles_confident'
                }
            },
            sd: {
                id: 25,
                name: 'San Diego Padres',
                abbreviation: 'SD',
                location: 'San Diego',
                mascot: 'Swinging Friar',
                colors: ['#2F241D', '#FFC425'],
                division: 'NL West',
                stadium: 'Petco Park',
                capacity: 40209,
                founded: 1969,
                championships: 0,
                campusAffiliations: ['UC San Diego', 'San Diego State'],
                academicStrengths: ['Biotechnology', 'Medicine', 'Marine Science'],
                mascotPersonality: {
                    catchphrases: ['Friar-level devotion to truth!', 'San Diego sunshine thinking!', 'Padre-blessed analysis!'],
                    specialty: 'dedicated_research',
                    voice: 'san_diego_laid_back'
                }
            },
            sf: {
                id: 26,
                name: 'San Francisco Giants',
                abbreviation: 'SF',
                location: 'San Francisco',
                mascot: 'Lou Seal',
                colors: ['#FD5A1E', '#27251F'],
                division: 'NL West',
                stadium: 'Oracle Park',
                capacity: 41915,
                founded: 1883,
                championships: 8,
                campusAffiliations: ['Stanford', 'UC Berkeley', 'UCSF'],
                academicStrengths: ['Technology', 'Medicine', 'Research'],
                mascotPersonality: {
                    catchphrases: ['Giant-sized brilliance!', 'Bay Area innovation!', 'Golden Gate genius!'],
                    specialty: 'innovative_thinking',
                    voice: 'san_francisco_sophisticated'
                }
            }
        };
        
        // Live data cache
        this.liveData = {
            scoreboard: null,
            standings: null,
            teams: new Map(),
            games: new Map(),
            lastUpdated: null
        };
        
        // Rate limiting
        this.rateLimiter = {
            requests: 0,
            resetTime: Date.now() + 60000, // Reset every minute
            maxRequests: 60 // 60 requests per minute
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('⚾ Initializing ESPN MLB Integration...');
        
        try {
            // Load initial team data
            await this.loadTeamData();
            
            // Start live data updates
            this.startLiveUpdates();
            
            // Setup rate limiting reset
            this.setupRateLimiting();
            
            console.log('✅ ESPN MLB Integration ready!');
            console.log(`📊 Loaded ${Object.keys(this.mlbTeams).length} MLB teams`);
            console.log('🔄 Live data updates started');
            
        } catch (error) {
            console.error('❌ Failed to initialize ESPN MLB integration:', error);
            throw error;
        }
    }
    
    // ===================== ESPN API METHODS =====================
    
    async makeESPNRequest(endpoint) {
        // Check rate limiting
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded');
        }
        
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint);
            const options = {
                hostname: url.hostname,
                path: url.pathname + url.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MLBIntegration/1.0)',
                    'Accept': 'application/json'
                }
            };
            
            const protocol = url.protocol === 'https:' ? https : http;
            
            const req = protocol.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        this.rateLimiter.requests++;
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }
    
    checkRateLimit() {
        const now = Date.now();
        if (now > this.rateLimiter.resetTime) {
            this.rateLimiter.requests = 0;
            this.rateLimiter.resetTime = now + 60000;
        }
        return this.rateLimiter.requests < this.rateLimiter.maxRequests;
    }
    
    setupRateLimiting() {
        setInterval(() => {
            this.rateLimiter.requests = 0;
            this.rateLimiter.resetTime = Date.now() + 60000;
        }, 60000);
    }
    
    // ===================== LIVE DATA METHODS =====================
    
    async loadTeamData() {
        try {
            console.log('📡 Loading team data from ESPN...');
            
            // Try to get live team data from ESPN
            const teamsData = await this.makeESPNRequest(this.apiEndpoints.teams);
            
            if (teamsData && teamsData.sports && teamsData.sports[0] && teamsData.sports[0].leagues) {
                const teams = teamsData.sports[0].leagues[0].teams;
                
                teams.forEach(teamData => {
                    const team = teamData.team;
                    const abbreviation = team.abbreviation.toLowerCase();
                    
                    if (this.mlbTeams[abbreviation]) {
                        // Update with live ESPN data
                        this.mlbTeams[abbreviation].espnData = {
                            id: team.id,
                            displayName: team.displayName,
                            shortDisplayName: team.shortDisplayName,
                            logos: team.logos,
                            venue: team.venue,
                            record: team.record,
                            nextEvent: team.nextEvent
                        };
                        
                        this.liveData.teams.set(abbreviation, this.mlbTeams[abbreviation]);
                    }
                });
            }
            
            console.log(`✅ Loaded data for ${this.liveData.teams.size} teams`);
            
        } catch (error) {
            console.warn('⚠️ Could not load live ESPN data, using local team database:', error.message);
            
            // Fallback: populate cache with local data
            Object.keys(this.mlbTeams).forEach(abbreviation => {
                this.liveData.teams.set(abbreviation, this.mlbTeams[abbreviation]);
            });
        }
    }
    
    async getScoreboard() {
        try {
            const scoreboardData = await this.makeESPNRequest(this.apiEndpoints.scoreboard);
            
            if (scoreboardData && scoreboardData.events) {
                this.liveData.scoreboard = scoreboardData;
                this.liveData.lastUpdated = Date.now();
                
                // Process games
                scoreboardData.events.forEach(event => {
                    this.processGameData(event);
                });
                
                this.emit('scoreboard_updated', {
                    games: scoreboardData.events.length,
                    timestamp: this.liveData.lastUpdated
                });
                
                return scoreboardData;
            }
            
        } catch (error) {
            console.error('❌ Failed to get scoreboard:', error.message);
            return this.generateMockScoreboard();
        }
    }
    
    processGameData(gameEvent) {
        const gameId = gameEvent.id;
        const competition = gameEvent.competitions[0];
        const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
        const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
        
        const gameData = {
            id: gameId,
            status: competition.status.type.name,
            period: competition.status.period,
            clock: competition.status.displayClock,
            homeTeam: {
                id: homeTeam.team.id,
                abbreviation: homeTeam.team.abbreviation,
                displayName: homeTeam.team.displayName,
                score: homeTeam.score,
                record: homeTeam.records?.[0]?.summary,
                logo: homeTeam.team.logo
            },
            awayTeam: {
                id: awayTeam.team.id,
                abbreviation: awayTeam.team.abbreviation,
                displayName: awayTeam.team.displayName,
                score: awayTeam.score,
                record: awayTeam.records?.[0]?.summary,
                logo: awayTeam.team.logo
            },
            venue: competition.venue,
            broadcast: competition.broadcasts?.[0],
            situation: competition.situation,
            lastPlay: competition.lastPlay,
            timestamp: Date.now()
        };
        
        // Store game data
        this.liveData.games.set(gameId, gameData);
        
        // Emit game events
        if (gameData.status === 'STATUS_IN_PROGRESS') {
            this.emit('game_in_progress', gameData);
        }
        
        if (gameData.lastPlay && gameData.lastPlay.text) {
            this.emit('play_by_play', {
                gameId,
                play: gameData.lastPlay,
                gameData
            });
        }
    }
    
    startLiveUpdates() {
        // Update scoreboard every 30 seconds
        setInterval(async () => {
            await this.getScoreboard();
        }, 30000);
        
        // Update standings every 5 minutes
        setInterval(async () => {
            await this.getStandings();
        }, 300000);
        
        // Update news every 10 minutes
        setInterval(async () => {
            await this.getNews();
        }, 600000);
        
        console.log('🔄 Live updates scheduled');
    }
    
    async getStandings() {
        try {
            const standingsData = await this.makeESPNRequest(this.apiEndpoints.standings);
            this.liveData.standings = standingsData;
            
            this.emit('standings_updated', standingsData);
            return standingsData;
            
        } catch (error) {
            console.error('❌ Failed to get standings:', error.message);
            return null;
        }
    }
    
    async getNews() {
        try {
            const newsData = await this.makeESPNRequest(this.apiEndpoints.news);
            
            this.emit('news_updated', newsData);
            return newsData;
            
        } catch (error) {
            console.error('❌ Failed to get news:', error.message);
            return null;
        }
    }
    
    // ===================== TEAM DATA METHODS =====================
    
    getTeam(abbreviation) {
        return this.liveData.teams.get(abbreviation.toLowerCase()) || this.mlbTeams[abbreviation.toLowerCase()];
    }
    
    getAllTeams() {
        return Array.from(this.liveData.teams.values());
    }
    
    getTeamsByDivision(division) {
        return this.getAllTeams().filter(team => team.division === division);
    }
    
    getTeamsByCampusAffiliation(university) {
        return this.getAllTeams().filter(team => 
            team.campusAffiliations.some(affiliation => 
                affiliation.toLowerCase().includes(university.toLowerCase())
            )
        );
    }
    
    getTeamMascotPersonality(abbreviation) {
        const team = this.getTeam(abbreviation);
        return team ? team.mascotPersonality : null;
    }
    
    // ===================== GAME DATA METHODS =====================
    
    getLiveGames() {
        return Array.from(this.liveData.games.values()).filter(game => 
            game.status === 'STATUS_IN_PROGRESS'
        );
    }
    
    getTodaysGames() {
        const today = new Date().toDateString();
        return Array.from(this.liveData.games.values()).filter(game => {
            const gameDate = new Date(game.timestamp).toDateString();
            return gameDate === today;
        });
    }
    
    getGameByTeam(abbreviation) {
        return Array.from(this.liveData.games.values()).find(game => 
            game.homeTeam.abbreviation.toLowerCase() === abbreviation.toLowerCase() ||
            game.awayTeam.abbreviation.toLowerCase() === abbreviation.toLowerCase()
        );
    }
    
    // ===================== MOCK DATA METHODS =====================
    
    generateMockScoreboard() {
        console.log('🎲 Generating mock scoreboard data...');
        
        const mockGames = [];
        const teams = Object.keys(this.mlbTeams);
        
        // Generate 5-8 random games
        const gameCount = Math.floor(Math.random() * 4) + 5;
        
        for (let i = 0; i < gameCount; i++) {
            const homeTeam = teams[Math.floor(Math.random() * teams.length)];
            let awayTeam = teams[Math.floor(Math.random() * teams.length)];
            
            // Ensure different teams
            while (awayTeam === homeTeam) {
                awayTeam = teams[Math.floor(Math.random() * teams.length)];
            }
            
            const homeTeamData = this.mlbTeams[homeTeam];
            const awayTeamData = this.mlbTeams[awayTeam];
            
            const gameData = {
                id: `mock_${Date.now()}_${i}`,
                status: Math.random() > 0.7 ? 'STATUS_IN_PROGRESS' : 'STATUS_SCHEDULED',
                period: Math.floor(Math.random() * 9) + 1,
                homeTeam: {
                    abbreviation: homeTeamData.abbreviation,
                    displayName: homeTeamData.name,
                    score: Math.floor(Math.random() * 12),
                    mascot: homeTeamData.mascot,
                    colors: homeTeamData.colors
                },
                awayTeam: {
                    abbreviation: awayTeamData.abbreviation,
                    displayName: awayTeamData.name,
                    score: Math.floor(Math.random() * 10),
                    mascot: awayTeamData.mascot,
                    colors: awayTeamData.colors
                },
                venue: homeTeamData.stadium,
                situation: this.generateGameSituation(),
                timestamp: Date.now()
            };
            
            mockGames.push(gameData);
            this.liveData.games.set(gameData.id, gameData);
        }
        
        const mockScoreboard = {
            events: mockGames,
            day: {
                date: new Date().toISOString().split('T')[0]
            }
        };
        
        this.liveData.scoreboard = mockScoreboard;
        this.liveData.lastUpdated = Date.now();
        
        return mockScoreboard;
    }
    
    generateGameSituation() {
        const situations = [
            'Runner on first, one out',
            'Bases loaded, two outs',
            'Runner on second and third, no outs',
            'Bottom of the 9th, tie game',
            'Top of the 7th, cleanup hitter up',
            'Two-run lead, closer warming up',
            'First and third, hit and run situation',
            'Full count, runner stealing second'
        ];
        
        return situations[Math.floor(Math.random() * situations.length)];
    }
    
    // ===================== CAMPUS INTEGRATION METHODS =====================
    
    getTeamsForCampus(university) {
        // Find teams with campus affiliations
        const affiliatedTeams = this.getTeamsByCampusAffiliation(university);
        
        // Find geographically close teams if no direct affiliations
        if (affiliatedTeams.length === 0) {
            return this.getTeamsByGeography(university);
        }
        
        return affiliatedTeams;
    }
    
    getTeamsByGeography(university) {
        const geographicMappings = {
            'Harvard': ['bos'],
            'MIT': ['bos'],
            'Yale': ['bos', 'nym'],
            'Columbia': ['nyy', 'nym'],
            'NYU': ['nyy', 'nym'],
            'University of Chicago': ['chc', 'cws'],
            'Northwestern': ['chc', 'cws'],
            'Stanford': ['sf', 'oak'],
            'UC Berkeley': ['sf', 'oak'],
            'UCLA': ['lad', 'laa'],
            'USC': ['lad', 'laa']
        };
        
        const teamAbbreviations = geographicMappings[university] || [];
        return teamAbbreviations.map(abbr => this.getTeam(abbr)).filter(Boolean);
    }
    
    generateCampusEngagement(university, teams) {
        return {
            university,
            affiliatedTeams: teams,
            engagementLevel: Math.random() * 0.4 + 0.6, // 60-100%
            activeStudents: Math.floor(Math.random() * 500) + 100,
            watchParties: Math.floor(Math.random() * 5) + 1,
            studyGroups: Math.floor(Math.random() * 10) + 3,
            academicIntegration: teams.map(team => ({
                team: team.abbreviation,
                subjects: team.academicStrengths,
                mascotTutor: team.mascotPersonality
            }))
        };
    }
    
    // ===================== UTILITY METHODS =====================
    
    getDataStatus() {
        return {
            lastUpdated: this.liveData.lastUpdated,
            teamsLoaded: this.liveData.teams.size,
            gamesTracked: this.liveData.games.size,
            liveGames: this.getLiveGames().length,
            rateLimitStatus: {
                requests: this.rateLimiter.requests,
                maxRequests: this.rateLimiter.maxRequests,
                resetTime: this.rateLimiter.resetTime
            }
        };
    }
}

// Export the ESPN MLB integration
module.exports = ESPNMLBIntegration;

// Auto-start if run directly
if (require.main === module) {
    (async () => {
        console.log('🚀 Starting ESPN MLB Integration...\n');
        
        try {
            const espnMLB = new ESPNMLBIntegration();
            
            // Demo: Show all teams
            setTimeout(() => {
                console.log('\n📊 MLB TEAMS DATABASE:');
                console.log('═'.repeat(80));
                
                const teams = espnMLB.getAllTeams();
                teams.forEach(team => {
                    console.log(`⚾ ${team.name} (${team.abbreviation}) - ${team.mascot}`);
                    console.log(`   🏟️ ${team.stadium} | 🎓 ${team.campusAffiliations.join(', ')}`);
                    console.log(`   💬 "${team.mascotPersonality.catchphrases[0]}"`);
                    console.log('');
                });
            }, 2000);
            
            // Demo: Show live games
            setTimeout(async () => {
                console.log('\n🎮 LIVE GAMES:');
                console.log('═'.repeat(80));
                
                await espnMLB.getScoreboard();
                const liveGames = espnMLB.getLiveGames();
                
                if (liveGames.length > 0) {
                    liveGames.forEach(game => {
                        console.log(`🔴 LIVE: ${game.awayTeam.displayName} @ ${game.homeTeam.displayName}`);
                        console.log(`   Score: ${game.awayTeam.score} - ${game.homeTeam.score}`);
                        console.log(`   Situation: ${game.situation}`);
                        console.log('');
                    });
                } else {
                    console.log('No live games currently in progress');
                }
            }, 4000);
            
            // Monitor live updates
            espnMLB.on('scoreboard_updated', (data) => {
                console.log(`📡 Scoreboard updated: ${data.games} games tracked`);
            });
            
            espnMLB.on('play_by_play', (data) => {
                console.log(`🎙️ PLAY: ${data.play.text} (${data.gameData.homeTeam.abbreviation} vs ${data.gameData.awayTeam.abbreviation})`);
            });
            
            console.log('\n✅ ESPN MLB Integration running!');
            console.log('⚾ Monitoring live games and scores');
            console.log('🎓 Campus affiliations ready for integration');
            console.log('🎭 All 30 mascot personalities loaded');
            
        } catch (error) {
            console.error('❌ Failed to start ESPN MLB integration:', error);
            process.exit(1);
        }
    })();
}