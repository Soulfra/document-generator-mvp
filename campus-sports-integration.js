#!/usr/bin/env node

/**
 * 🏫 CAMPUS SPORTS INTEGRATION FRAMEWORK
 * 
 * Comprehensive campus integration system linking universities with sports teams
 * Enables academic subject integration through sports analogies and team affiliations
 * 
 * Features:
 * - University profile management with sports affiliations
 * - Student organization integration
 * - Academic calendar and event synchronization
 * - Campus facility booking for watch parties
 * - Study group formation based on team preferences
 * - Academic achievement tracking using sports metaphors
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CampusSportsIntegration extends EventEmitter {
    constructor() {
        super();
        
        // University database with comprehensive sports affiliations
        this.universities = {
            'harvard': {
                id: 'harvard',
                name: 'Harvard University',
                location: 'Cambridge, MA',
                enrollment: 23731,
                type: 'private_research',
                sportAffiliations: {
                    primary: ['bos'], // Boston Red Sox
                    secondary: ['nym'], // Many students from NY
                    reasoning: 'Geographic proximity and regional loyalty'
                },
                academicStrengths: ['medicine', 'law', 'business', 'research'],
                studentOrganizations: [
                    {
                        name: 'Harvard Pre-Medical Society',
                        members: 800,
                        sportPreference: 'bos',
                        meetingLocation: 'Science Center',
                        activities: ['study_groups', 'mcat_prep', 'research']
                    },
                    {
                        name: 'Harvard Computer Society',
                        members: 1200,
                        sportPreference: 'bos',
                        meetingLocation: 'Maxwell Dworkin',
                        activities: ['coding_competitions', 'tech_talks', 'hackathons']
                    }
                ],
                facilities: {
                    'Science Center': { capacity: 200, hasProjector: true, bookingRequired: true },
                    'Memorial Hall': { capacity: 1000, hasProjector: true, bookingRequired: true },
                    'Widener Library': { capacity: 50, hasProjector: false, bookingRequired: true }
                },
                academicCalendar: {
                    'fall_semester': { start: '2024-08-28', end: '2024-12-13' },
                    'spring_semester': { start: '2025-01-21', end: '2025-05-22' },
                    'exam_periods': ['2024-12-09', '2025-05-15']
                },
                campusEvents: [],
                studentProfiles: new Map()
            },
            
            'mit': {
                id: 'mit',
                name: 'Massachusetts Institute of Technology',
                location: 'Cambridge, MA',
                enrollment: 11934,
                type: 'private_research',
                sportAffiliations: {
                    primary: ['bos'],
                    secondary: ['nyy'],
                    reasoning: 'Strong Boston connection with NYC pipeline'
                },
                academicStrengths: ['engineering', 'computer_science', 'physics', 'ai'],
                studentOrganizations: [
                    {
                        name: 'MIT AI Society',
                        members: 600,
                        sportPreference: 'bos',
                        meetingLocation: 'Stata Center',
                        activities: ['ai_research', 'machine_learning', 'robotics']
                    }
                ],
                facilities: {
                    'Stata Center': { capacity: 300, hasProjector: true, bookingRequired: true },
                    '32-123': { capacity: 80, hasProjector: true, bookingRequired: false }
                },
                academicCalendar: {
                    'fall_semester': { start: '2024-09-04', end: '2024-12-20' },
                    'iap': { start: '2025-01-06', end: '2025-01-31' },
                    'spring_semester': { start: '2025-02-03', end: '2025-05-30' }
                },
                campusEvents: [],
                studentProfiles: new Map()
            },
            
            'uw_madison': {
                id: 'uw_madison',
                name: 'University of Wisconsin-Madison',
                location: 'Madison, WI',
                enrollment: 47932,
                type: 'public_research',
                sportAffiliations: {
                    primary: ['mil'], // Milwaukee Brewers - strong Wisconsin connection
                    secondary: ['chc', 'min'], // Geographic proximity
                    reasoning: 'Strong Wisconsin pride and regional loyalty'
                },
                academicStrengths: ['medicine', 'engineering', 'agriculture', 'research'],
                studentOrganizations: [
                    {
                        name: 'Badger Pre-Health Society',
                        members: 1500,
                        sportPreference: 'mil',
                        meetingLocation: 'Memorial Union',
                        activities: ['mcat_prep', 'medical_shadowing', 'research']
                    },
                    {
                        name: 'Wisconsin Engineers',
                        members: 2000,
                        sportPreference: 'mil',
                        meetingLocation: 'Engineering Hall',
                        activities: ['design_competitions', 'internship_prep']
                    }
                ],
                facilities: {
                    'Memorial Union': { capacity: 500, hasProjector: true, bookingRequired: true },
                    'Grainger Hall': { capacity: 200, hasProjector: true, bookingRequired: true },
                    'Van Vleck Hall': { capacity: 150, hasProjector: true, bookingRequired: false }
                },
                academicCalendar: {
                    'fall_semester': { start: '2024-09-04', end: '2024-12-20' },
                    'spring_semester': { start: '2025-01-22', end: '2025-05-16' }
                },
                campusEvents: [],
                studentProfiles: new Map()
            },
            
            'uw_milwaukee': {
                id: 'uw_milwaukee',
                name: 'University of Wisconsin-Milwaukee',
                location: 'Milwaukee, WI',
                enrollment: 25016,
                type: 'public_research',
                sportAffiliations: {
                    primary: ['mil'], // Direct Milwaukee connection
                    secondary: ['chc'],
                    reasoning: 'Direct city connection with Milwaukee Brewers'
                },
                academicStrengths: ['engineering', 'architecture', 'public_health', 'education'],
                studentOrganizations: [
                    {
                        name: 'UWM Pre-Health Professionals',
                        members: 800,
                        sportPreference: 'mil',
                        meetingLocation: 'Student Union',
                        activities: ['mcat_prep', 'health_career_exploration']
                    },
                    {
                        name: 'Panthers Engineering Society',
                        members: 1000,
                        sportPreference: 'mil',
                        meetingLocation: 'EMS Building',
                        activities: ['project_teams', 'career_development']
                    }
                ],
                facilities: {
                    'Student Union': { capacity: 400, hasProjector: true, bookingRequired: true },
                    'EMS Building': { capacity: 100, hasProjector: true, bookingRequired: false }
                },
                academicCalendar: {
                    'fall_semester': { start: '2024-09-03', end: '2024-12-20' },
                    'spring_semester': { start: '2025-01-21', end: '2025-05-15' }
                },
                campusEvents: [],
                studentProfiles: new Map()
            },
            
            'university_of_chicago': {
                id: 'university_of_chicago',
                name: 'University of Chicago',
                location: 'Chicago, IL',
                enrollment: 17834,
                type: 'private_research',
                sportAffiliations: {
                    primary: ['chc', 'cws'], // Both Chicago teams
                    secondary: ['mil'],
                    reasoning: 'Split loyalty between Cubs and White Sox based on neighborhood'
                },
                academicStrengths: ['economics', 'medicine', 'physics', 'business'],
                studentOrganizations: [
                    {
                        name: 'Pritzker Pre-Medical Society',
                        members: 600,
                        sportPreference: 'chc',
                        meetingLocation: 'Harper Center',
                        activities: ['research', 'mcat_prep', 'clinical_exposure']
                    }
                ],
                facilities: {
                    'Harper Center': { capacity: 200, hasProjector: true, bookingRequired: true },
                    'Cobb Hall': { capacity: 150, hasProjector: true, bookingRequired: true }
                },
                academicCalendar: {
                    'autumn_quarter': { start: '2024-09-30', end: '2024-12-13' },
                    'winter_quarter': { start: '2025-01-06', end: '2025-03-21' },
                    'spring_quarter': { start: '2025-03-31', end: '2025-06-13' }
                },
                campusEvents: [],
                studentProfiles: new Map()
            },
            
            'northwestern': {
                id: 'northwestern',
                name: 'Northwestern University',
                location: 'Evanston, IL',
                enrollment: 22603,
                type: 'private_research',
                sportAffiliations: {
                    primary: ['chc'], // Cubs preference in North Side/suburbs
                    secondary: ['cws', 'mil'],
                    reasoning: 'North Side Chicago area alignment with Cubs'
                },
                academicStrengths: ['journalism', 'engineering', 'medicine', 'business'],
                studentOrganizations: [
                    {
                        name: 'Northwestern Pre-Health Society',
                        members: 900,
                        sportPreference: 'chc',
                        meetingLocation: 'Norris Center',
                        activities: ['mcat_prep', 'medical_volunteering', 'research']
                    }
                ],
                facilities: {
                    'Norris Center': { capacity: 300, hasProjector: true, bookingRequired: true },
                    'Tech Institute': { capacity: 200, hasProjector: true, bookingRequired: true }
                },
                academicCalendar: {
                    'fall_quarter': { start: '2024-09-19', end: '2024-12-06' },
                    'winter_quarter': { start: '2025-01-06', end: '2025-03-21' },
                    'spring_quarter': { start: '2025-03-31', end: '2025-06-13' }
                },
                campusEvents: [],
                studentProfiles: new Map()
            },
            
            'stanford': {
                id: 'stanford',
                name: 'Stanford University',
                location: 'Stanford, CA',
                enrollment: 17249,
                type: 'private_research',
                sportAffiliations: {
                    primary: ['sf'], // San Francisco Giants
                    secondary: ['oak'], // Oakland Athletics
                    reasoning: 'Bay Area location with strong Giants following'
                },
                academicStrengths: ['computer_science', 'engineering', 'medicine', 'business'],
                studentOrganizations: [
                    {
                        name: 'Stanford Pre-Med Association',
                        members: 700,
                        sportPreference: 'sf',
                        meetingLocation: 'Medical School',
                        activities: ['mcat_prep', 'research', 'clinical_shadowing']
                    },
                    {
                        name: 'Stanford AI Society',
                        members: 1500,
                        sportPreference: 'sf',
                        meetingLocation: 'Gates Building',
                        activities: ['ai_research', 'tech_entrepreneurship']
                    }
                ],
                facilities: {
                    'Medical School': { capacity: 250, hasProjector: true, bookingRequired: true },
                    'Gates Building': { capacity: 400, hasProjector: true, bookingRequired: true }
                },
                academicCalendar: {
                    'autumn_quarter': { start: '2024-09-23', end: '2024-12-13' },
                    'winter_quarter': { start: '2025-01-06', end: '2025-03-21' },
                    'spring_quarter': { start: '2025-03-31', end: '2025-06-13' }
                },
                campusEvents: [],
                studentProfiles: new Map()
            }
        };
        
        // Academic subject integration framework
        this.academicSubjects = {
            'mcat_biology': {
                name: 'MCAT Biology',
                sportsAnalogies: {
                    'cellular_respiration': {
                        analogy: 'Like a baseball team\'s energy system - players (glucose) convert food into energy (ATP) to perform (cellular functions)',
                        team: 'any',
                        difficulty: 'intermediate'
                    },
                    'nervous_system': {
                        analogy: 'Like a baseball team\'s communication - brain (manager) sends signals through nerves (coaches) to muscles (players)',
                        team: 'any',
                        difficulty: 'advanced'
                    },
                    'muscle_contraction': {
                        analogy: 'Like a pitcher\'s throwing motion - actin and myosin work together like a perfectly coordinated windup and release',
                        team: 'any',
                        difficulty: 'intermediate'
                    }
                }
            },
            'mcat_chemistry': {
                name: 'MCAT Chemistry',
                sportsAnalogies: {
                    'chemical_bonds': {
                        analogy: 'Like team chemistry - ionic bonds are like trades (complete transfer), covalent bonds like partnerships (sharing)',
                        team: 'any',
                        difficulty: 'basic'
                    },
                    'thermodynamics': {
                        analogy: 'Like team energy - endothermic reactions need energy input (training), exothermic release energy (game performance)',
                        team: 'any',
                        difficulty: 'advanced'
                    }
                }
            },
            'mcat_physics': {
                name: 'MCAT Physics',
                sportsAnalogies: {
                    'momentum': {
                        analogy: 'Like a baseball\'s momentum when hit - mass times velocity determines how far it travels',
                        team: 'any',
                        difficulty: 'intermediate'
                    },
                    'waves': {
                        analogy: 'Like the wave fans do in stadiums - energy moves through the crowd without the people moving',
                        team: 'any',
                        difficulty: 'basic'
                    }
                }
            },
            'organic_chemistry': {
                name: 'Organic Chemistry',
                sportsAnalogies: {
                    'stereochemistry': {
                        analogy: 'Like left-handed vs right-handed batters - same structure but mirror images with different properties',
                        team: 'any',
                        difficulty: 'advanced'
                    }
                }
            }
        };
        
        // Campus event templates
        this.eventTemplates = {
            'watch_party': {
                name: 'Sports Watch Party',
                description: 'Watch live games while studying with team-themed content',
                duration: 180, // 3 hours
                maxParticipants: 50,
                requiredFacilities: ['projector', 'seating', 'wifi']
            },
            'study_group': {
                name: 'Team-Themed Study Group',
                description: 'Study academic subjects using sports analogies and team mascot tutoring',
                duration: 120, // 2 hours
                maxParticipants: 20,
                requiredFacilities: ['whiteboard', 'seating', 'wifi']
            },
            'mcat_bootcamp': {
                name: 'MCAT Sports Bootcamp',
                description: 'Intensive MCAT prep using sports metaphors and team competition',
                duration: 480, // 8 hours
                maxParticipants: 100,
                requiredFacilities: ['auditorium', 'projector', 'breakout_rooms']
            }
        };
        
        // Integration metrics
        this.integrationMetrics = {
            totalStudents: 0,
            activeStudyGroups: 0,
            campusEvents: 0,
            teamEngagement: new Map(),
            subjectAdoption: new Map()
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🏫 Initializing Campus Sports Integration Framework...');
        
        try {
            // Initialize university data
            this.initializeUniversityData();
            
            // Setup academic calendar integration
            this.setupAcademicCalendars();
            
            // Initialize student organization connections
            this.initializeStudentOrganizations();
            
            // Setup facility booking system
            this.setupFacilityBooking();
            
            // Initialize analytics tracking
            this.setupAnalytics();
            
            console.log('✅ Campus Sports Integration Framework ready!');
            console.log(`🏫 ${Object.keys(this.universities).length} universities integrated`);
            console.log(`📚 ${Object.keys(this.academicSubjects).length} academic subjects with sports analogies`);
            
        } catch (error) {
            console.error('❌ Failed to initialize campus integration:', error);
            throw error;
        }
    }
    
    // ===================== UNIVERSITY MANAGEMENT =====================
    
    getUniversity(universityId) {
        return this.universities[universityId];
    }
    
    getAllUniversities() {
        return Object.values(this.universities);
    }
    
    getUniversitiesByTeam(teamAbbreviation) {
        return Object.values(this.universities).filter(university => 
            university.sportAffiliations.primary.includes(teamAbbreviation) ||
            university.sportAffiliations.secondary.includes(teamAbbreviation)
        );
    }
    
    getUniversitiesByLocation(city, state) {
        return Object.values(this.universities).filter(university => 
            university.location.toLowerCase().includes(city.toLowerCase()) ||
            university.location.toLowerCase().includes(state.toLowerCase())
        );
    }
    
    // ===================== STUDENT ORGANIZATION INTEGRATION =====================
    
    getStudentOrganizations(universityId, filter = {}) {
        const university = this.getUniversity(universityId);
        if (!university) return [];
        
        let organizations = university.studentOrganizations;
        
        if (filter.sportPreference) {
            organizations = organizations.filter(org => 
                org.sportPreference === filter.sportPreference
            );
        }
        
        if (filter.minMembers) {
            organizations = organizations.filter(org => 
                org.members >= filter.minMembers
            );
        }
        
        if (filter.activity) {
            organizations = organizations.filter(org => 
                org.activities.includes(filter.activity)
            );
        }
        
        return organizations;
    }
    
    createStudentOrganizationEvent(universityId, organizationName, eventData) {
        const university = this.getUniversity(universityId);
        if (!university) throw new Error('University not found');
        
        const organization = university.studentOrganizations.find(org => 
            org.name === organizationName
        );
        if (!organization) throw new Error('Organization not found');
        
        const event = {
            id: crypto.randomUUID(),
            organizationName,
            universityId,
            ...eventData,
            createdAt: Date.now(),
            participants: [],
            status: 'scheduled'
        };
        
        university.campusEvents.push(event);
        
        this.emit('organization_event_created', {
            universityId,
            organizationName,
            event
        });
        
        return event;
    }
    
    // ===================== ACADEMIC INTEGRATION =====================
    
    getAcademicSubject(subjectId) {
        return this.academicSubjects[subjectId];
    }
    
    getSportsAnalogiesForSubject(subjectId, teamPreference = null) {
        const subject = this.getAcademicSubject(subjectId);
        if (!subject) return [];
        
        let analogies = Object.entries(subject.sportsAnalogies).map(([topic, data]) => ({
            topic,
            ...data
        }));
        
        if (teamPreference) {
            // Prioritize analogies that work well with the preferred team
            analogies = analogies.sort((a, b) => {
                if (a.team === teamPreference) return -1;
                if (b.team === teamPreference) return 1;
                return 0;
            });
        }
        
        return analogies;
    }
    
    createStudySession(universityId, sessionData) {
        const studySession = {
            id: crypto.randomUUID(),
            universityId,
            subject: sessionData.subject,
            topic: sessionData.topic,
            teamTheme: sessionData.teamTheme,
            facilitator: sessionData.facilitator,
            participants: [],
            startTime: sessionData.startTime,
            duration: sessionData.duration || 120, // 2 hours default
            location: sessionData.location,
            sportsAnalogies: this.getSportsAnalogiesForSubject(sessionData.subject, sessionData.teamTheme),
            materials: sessionData.materials || [],
            status: 'scheduled',
            createdAt: Date.now()
        };
        
        const university = this.getUniversity(universityId);
        if (university) {
            university.campusEvents.push(studySession);
        }
        
        this.emit('study_session_created', {
            universityId,
            studySession
        });
        
        return studySession;
    }
    
    joinStudySession(sessionId, studentProfile) {
        // Find the session across all universities
        let session = null;
        let university = null;
        
        for (const uni of Object.values(this.universities)) {
            session = uni.campusEvents.find(event => event.id === sessionId);
            if (session) {
                university = uni;
                break;
            }
        }
        
        if (!session) throw new Error('Study session not found');
        
        if (session.participants.length >= 20) { // Max capacity
            throw new Error('Study session is full');
        }
        
        session.participants.push({
            ...studentProfile,
            joinedAt: Date.now()
        });
        
        this.emit('student_joined_session', {
            sessionId,
            studentProfile,
            universityId: university.id
        });
        
        return session;
    }
    
    // ===================== FACILITY BOOKING SYSTEM =====================
    
    getFacilities(universityId) {
        const university = this.getUniversity(universityId);
        return university ? university.facilities : {};
    }
    
    checkFacilityAvailability(universityId, facilityName, startTime, duration) {
        const university = this.getUniversity(universityId);
        if (!university) return false;
        
        const facility = university.facilities[facilityName];
        if (!facility) return false;
        
        const endTime = startTime + duration;
        
        // Check for conflicts with existing events
        const conflicts = university.campusEvents.filter(event => {
            if (event.location !== facilityName) return false;
            
            const eventStart = new Date(event.startTime).getTime();
            const eventEnd = eventStart + (event.duration * 60 * 1000);
            
            return (startTime < eventEnd && endTime > eventStart);
        });
        
        return conflicts.length === 0;
    }
    
    bookFacility(universityId, facilityName, bookingData) {
        const university = this.getUniversity(universityId);
        if (!university) throw new Error('University not found');
        
        const facility = university.facilities[facilityName];
        if (!facility) throw new Error('Facility not found');
        
        const startTime = new Date(bookingData.startTime).getTime();
        const duration = bookingData.duration; // in minutes
        
        if (!this.checkFacilityAvailability(universityId, facilityName, startTime, duration)) {
            throw new Error('Facility not available at requested time');
        }
        
        const booking = {
            id: crypto.randomUUID(),
            facilityName,
            universityId,
            bookedBy: bookingData.bookedBy,
            purpose: bookingData.purpose,
            startTime: bookingData.startTime,
            duration: duration,
            teamTheme: bookingData.teamTheme,
            expectedAttendees: bookingData.expectedAttendees,
            equipment: bookingData.equipment || [],
            status: 'confirmed',
            createdAt: Date.now()
        };
        
        // Add to university events
        university.campusEvents.push({
            ...booking,
            type: 'facility_booking',
            location: facilityName
        });
        
        this.emit('facility_booked', {
            universityId,
            facilityName,
            booking
        });
        
        return booking;
    }
    
    // ===================== CAMPUS EVENT MANAGEMENT =====================
    
    createCampusEvent(universityId, eventType, eventData) {
        const university = this.getUniversity(universityId);
        if (!university) throw new Error('University not found');
        
        const template = this.eventTemplates[eventType];
        if (!template) throw new Error('Unknown event type');
        
        const event = {
            id: crypto.randomUUID(),
            type: eventType,
            name: eventData.name || template.name,
            description: eventData.description || template.description,
            universityId,
            organizer: eventData.organizer,
            startTime: eventData.startTime,
            duration: eventData.duration || template.duration,
            location: eventData.location,
            teamTheme: eventData.teamTheme,
            subject: eventData.subject,
            maxParticipants: eventData.maxParticipants || template.maxParticipants,
            participants: [],
            materials: eventData.materials || [],
            sportsAnalogies: eventData.subject ? this.getSportsAnalogiesForSubject(eventData.subject, eventData.teamTheme) : [],
            status: 'scheduled',
            createdAt: Date.now()
        };
        
        university.campusEvents.push(event);
        
        this.emit('campus_event_created', {
            universityId,
            eventType,
            event
        });
        
        return event;
    }
    
    getCampusEvents(universityId, filter = {}) {
        const university = this.getUniversity(universityId);
        if (!university) return [];
        
        let events = university.campusEvents;
        
        if (filter.type) {
            events = events.filter(event => event.type === filter.type);
        }
        
        if (filter.teamTheme) {
            events = events.filter(event => event.teamTheme === filter.teamTheme);
        }
        
        if (filter.subject) {
            events = events.filter(event => event.subject === filter.subject);
        }
        
        if (filter.upcoming) {
            const now = Date.now();
            events = events.filter(event => 
                new Date(event.startTime).getTime() > now
            );
        }
        
        return events.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
    }
    
    // ===================== STUDENT PROFILE MANAGEMENT =====================
    
    createStudentProfile(universityId, profileData) {
        const university = this.getUniversity(universityId);
        if (!university) throw new Error('University not found');
        
        const profile = {
            id: crypto.randomUUID(),
            universityId,
            name: profileData.name,
            email: profileData.email,
            year: profileData.year,
            major: profileData.major,
            teamPreferences: profileData.teamPreferences || [],
            academicInterests: profileData.academicInterests || [],
            studyGroups: [],
            eventsAttended: [],
            achievements: [],
            joinedAt: Date.now(),
            lastActive: Date.now()
        };
        
        university.studentProfiles.set(profile.id, profile);
        
        this.emit('student_profile_created', {
            universityId,
            profile
        });
        
        return profile;
    }
    
    getStudentProfile(universityId, profileId) {
        const university = this.getUniversity(universityId);
        if (!university) return null;
        
        return university.studentProfiles.get(profileId);
    }
    
    updateStudentProfile(universityId, profileId, updates) {
        const university = this.getUniversity(universityId);
        if (!university) throw new Error('University not found');
        
        const profile = university.studentProfiles.get(profileId);
        if (!profile) throw new Error('Student profile not found');
        
        Object.assign(profile, updates, { lastActive: Date.now() });
        
        this.emit('student_profile_updated', {
            universityId,
            profileId,
            profile
        });
        
        return profile;
    }
    
    // ===================== ANALYTICS AND METRICS =====================
    
    getUniversityAnalytics(universityId) {
        const university = this.getUniversity(universityId);
        if (!university) return null;
        
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        
        const recentEvents = university.campusEvents.filter(event => 
            event.createdAt > thirtyDaysAgo
        );
        
        const activeStudents = Array.from(university.studentProfiles.values()).filter(profile => 
            profile.lastActive > thirtyDaysAgo
        );
        
        const teamEngagement = {};
        university.sportAffiliations.primary.forEach(team => {
            teamEngagement[team] = recentEvents.filter(event => 
                event.teamTheme === team
            ).length;
        });
        
        return {
            universityId,
            totalStudents: university.studentProfiles.size,
            activeStudents: activeStudents.length,
            recentEvents: recentEvents.length,
            eventTypes: {
                study_groups: recentEvents.filter(e => e.type === 'study_group').length,
                watch_parties: recentEvents.filter(e => e.type === 'watch_party').length,
                bootcamps: recentEvents.filter(e => e.type === 'mcat_bootcamp').length
            },
            teamEngagement,
            topSubjects: this.getTopSubjects(recentEvents),
            facilityUtilization: this.getFacilityUtilization(university, thirtyDaysAgo)
        };
    }
    
    getTopSubjects(events) {
        const subjectCounts = {};
        events.forEach(event => {
            if (event.subject) {
                subjectCounts[event.subject] = (subjectCounts[event.subject] || 0) + 1;
            }
        });
        
        return Object.entries(subjectCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([subject, count]) => ({ subject, count }));
    }
    
    getFacilityUtilization(university, since) {
        const utilization = {};
        Object.keys(university.facilities).forEach(facilityName => {
            const bookings = university.campusEvents.filter(event => 
                event.location === facilityName && event.createdAt > since
            );
            utilization[facilityName] = bookings.length;
        });
        
        return utilization;
    }
    
    // ===================== INTEGRATION HELPERS =====================
    
    generateCampusIntegrationReport(universityId) {
        const university = this.getUniversity(universityId);
        if (!university) return null;
        
        const analytics = this.getUniversityAnalytics(universityId);
        const upcomingEvents = this.getCampusEvents(universityId, { upcoming: true });
        
        return {
            university: {
                name: university.name,
                location: university.location,
                enrollment: university.enrollment
            },
            sportAffiliations: university.sportAffiliations,
            analytics,
            upcomingEvents: upcomingEvents.slice(0, 10), // Next 10 events
            recommendations: this.generateRecommendations(university, analytics),
            integrationScore: this.calculateIntegrationScore(analytics)
        };
    }
    
    generateRecommendations(university, analytics) {
        const recommendations = [];
        
        if (analytics.activeStudents < university.enrollment * 0.05) {
            recommendations.push({
                type: 'engagement',
                message: 'Consider organizing more watch parties during prime time games to boost student engagement'
            });
        }
        
        if (analytics.eventTypes.study_groups === 0) {
            recommendations.push({
                type: 'academic',
                message: 'Start team-themed study groups for popular subjects like MCAT prep'
            });
        }
        
        const lowEngagementTeams = Object.entries(analytics.teamEngagement)
            .filter(([team, engagement]) => engagement === 0)
            .map(([team]) => team);
        
        if (lowEngagementTeams.length > 0) {
            recommendations.push({
                type: 'teams',
                message: `Create events featuring ${lowEngagementTeams.join(', ')} to diversify team engagement`
            });
        }
        
        return recommendations;
    }
    
    calculateIntegrationScore(analytics) {
        let score = 0;
        
        // Engagement metrics (0-40 points)
        score += Math.min(40, analytics.activeStudents / 10);
        
        // Event diversity (0-30 points)
        const eventTypes = Object.values(analytics.eventTypes);
        score += Math.min(30, eventTypes.reduce((sum, count) => sum + count, 0));
        
        // Team diversity (0-20 points)
        const engagedTeams = Object.values(analytics.teamEngagement).filter(count => count > 0).length;
        score += engagedTeams * 5;
        
        // Facility utilization (0-10 points)
        const totalUtilization = Object.values(analytics.facilityUtilization).reduce((sum, count) => sum + count, 0);
        score += Math.min(10, totalUtilization);
        
        return Math.min(100, score);
    }
    
    // ===================== INITIALIZATION HELPERS =====================
    
    initializeUniversityData() {
        // Add any additional initialization for university data
        Object.values(this.universities).forEach(university => {
            if (!university.campusEvents) university.campusEvents = [];
            if (!university.studentProfiles) university.studentProfiles = new Map();
        });
    }
    
    setupAcademicCalendars() {
        // Integrate with academic calendars for event scheduling
        this.emit('academic_calendars_loaded', {
            universities: Object.keys(this.universities).length
        });
    }
    
    initializeStudentOrganizations() {
        // Setup connections with student organizations
        let totalOrganizations = 0;
        Object.values(this.universities).forEach(university => {
            totalOrganizations += university.studentOrganizations.length;
        });
        
        this.emit('student_organizations_initialized', {
            totalOrganizations
        });
    }
    
    setupFacilityBooking() {
        // Initialize facility booking system
        this.emit('facility_booking_ready');
    }
    
    setupAnalytics() {
        // Setup analytics tracking
        setInterval(() => {
            this.updateIntegrationMetrics();
        }, 300000); // Every 5 minutes
    }
    
    updateIntegrationMetrics() {
        let totalStudents = 0;
        let totalEvents = 0;
        
        Object.values(this.universities).forEach(university => {
            totalStudents += university.studentProfiles.size;
            totalEvents += university.campusEvents.length;
        });
        
        this.integrationMetrics.totalStudents = totalStudents;
        this.integrationMetrics.campusEvents = totalEvents;
        
        this.emit('metrics_updated', this.integrationMetrics);
    }
}

// Export the campus integration framework
module.exports = CampusSportsIntegration;

// Auto-start if run directly
if (require.main === module) {
    (async () => {
        console.log('🚀 Starting Campus Sports Integration Framework...\n');
        
        try {
            const campusIntegration = new CampusSportsIntegration();
            
            // Demo: Show university integrations
            setTimeout(() => {
                console.log('\n🏫 UNIVERSITY INTEGRATIONS:');
                console.log('═'.repeat(80));
                
                const universities = campusIntegration.getAllUniversities();
                universities.forEach(university => {
                    console.log(`🎓 ${university.name} (${university.location})`);
                    console.log(`   📊 Enrollment: ${university.enrollment.toLocaleString()}`);
                    console.log(`   ⚾ Primary Teams: ${university.sportAffiliations.primary.join(', ')}`);
                    console.log(`   🏢 Organizations: ${university.studentOrganizations.length}`);
                    console.log(`   🏛️ Facilities: ${Object.keys(university.facilities).length}`);
                    console.log('');
                });
            }, 2000);
            
            // Demo: Create a sample study session
            setTimeout(() => {
                console.log('\n📚 CREATING SAMPLE STUDY SESSION:');
                console.log('═'.repeat(80));
                
                const studySession = campusIntegration.createStudySession('uw_madison', {
                    subject: 'mcat_biology',
                    topic: 'cellular_respiration',
                    teamTheme: 'mil', // Milwaukee Brewers theme
                    facilitator: 'Dr. Sarah Johnson',
                    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                    location: 'Memorial Union',
                    materials: ['textbook', 'practice_questions', 'team_analogies']
                });
                
                console.log(`✅ Created study session: ${studySession.subject}`);
                console.log(`📍 Location: ${studySession.location}`);
                console.log(`⚾ Team Theme: ${studySession.teamTheme}`);
                console.log(`🧬 Sports Analogies: ${studySession.sportsAnalogies.length} available`);
                
            }, 4000);
            
            // Demo: Show sports analogies
            setTimeout(() => {
                console.log('\n⚾ SPORTS ANALOGIES FOR LEARNING:');
                console.log('═'.repeat(80));
                
                const analogies = campusIntegration.getSportsAnalogiesForSubject('mcat_biology', 'mil');
                analogies.forEach(analogy => {
                    console.log(`🧬 ${analogy.topic} (${analogy.difficulty}):`);
                    console.log(`   ${analogy.analogy}`);
                    console.log('');
                });
            }, 6000);
            
            // Monitor events
            campusIntegration.on('study_session_created', (data) => {
                console.log(`📚 New study session created at ${data.universityId}`);
            });
            
            campusIntegration.on('campus_event_created', (data) => {
                console.log(`🎉 New campus event: ${data.event.name} at ${data.universityId}`);
            });
            
            campusIntegration.on('facility_booked', (data) => {
                console.log(`🏛️ Facility booked: ${data.facilityName} at ${data.universityId}`);
            });
            
            console.log('\n✅ Campus Sports Integration Framework running!');
            console.log('🏫 University partnerships ready');
            console.log('📚 Academic subject integration active');
            console.log('⚾ Sports analogies loaded for all subjects');
            console.log('🎯 Ready for campus rollout!');
            
        } catch (error) {
            console.error('❌ Failed to start campus integration:', error);
            process.exit(1);
        }
    })();
}