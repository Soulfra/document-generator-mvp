#!/usr/bin/env node

/**
 * AGENT CALENDAR SCHEDULER
 * Excel-like booking interface for AI agent rental
 * Integrates with Google Calendar, Calendly-style booking
 * 
 * Features:
 * 1. Simple spreadsheet-like interface
 * 2. Real-time availability checking
 * 3. Automated conflict resolution
 * 4. Payment processing integration
 * 5. Calendar sync (Google, Outlook, iCal)
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs').promises;

class AgentCalendarScheduler {
    constructor() {
        this.port = 42011;
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Booking storage
        this.bookings = new Map();
        this.availability = new Map();
        this.conflicts = new Map();
        
        // Time slot configuration
        this.timeSlotConfig = {
            slotDuration: 60, // minutes
            workingHours: {
                start: 9,  // 9 AM
                end: 17    // 5 PM
            },
            timezone: 'UTC',
            bufferTime: 15 // minutes between bookings
        };
        
        // Excel-like grid structure
        this.calendarGrid = {
            columns: ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            rows: this.generateTimeSlots()
        };
        
        console.log('📅🤖 Agent Calendar Scheduler initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.setupStorage();
            await this.loadExistingBookings();
            await this.setupEndpoints();
            await this.createWebInterface();
            await this.startServer();
            console.log('✅ Agent Calendar Scheduler ready');
            console.log(`📅 Scheduler Service: http://localhost:${this.port}`);
        } catch (error) {
            console.error('❌ Scheduler initialization failed:', error);
        }
    }
    
    async setupStorage() {
        const dirs = [
            './calendar-data',
            './calendar-data/bookings',
            './calendar-data/availability',
            './calendar-data/payments',
            './public'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async loadExistingBookings() {
        try {
            const bookingsDir = './calendar-data/bookings';
            const files = await fs.readdir(bookingsDir);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const data = await fs.readFile(`${bookingsDir}/${file}`, 'utf8');
                    const booking = JSON.parse(data);
                    this.bookings.set(booking.bookingId, booking);
                }
            }
            
            console.log(`   📋 Loaded ${this.bookings.size} existing bookings`);
        } catch (error) {
            console.log('   📋 No existing bookings found');
        }
    }
    
    generateTimeSlots() {
        const slots = [];
        const { start, end } = this.timeSlotConfig.workingHours;
        
        for (let hour = start; hour < end; hour++) {
            slots.push({
                time: `${hour.toString().padStart(2, '0')}:00`,
                hour: hour,
                slots: {}
            });
        }
        
        return slots;
    }
    
    setupEndpoints() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'agent-calendar-scheduler',
                activeBookings: this.bookings.size,
                timezone: this.timeSlotConfig.timezone
            });
        });
        
        // Get calendar grid
        this.app.get('/calendar/grid/:agentId', async (req, res) => {
            await this.handleGetCalendarGrid(req, res);
        });
        
        // Check availability
        this.app.post('/availability/check', async (req, res) => {
            await this.handleCheckAvailability(req, res);
        });
        
        // Create booking
        this.app.post('/booking/create', async (req, res) => {
            await this.handleCreateBooking(req, res);
        });
        
        // Update booking
        this.app.put('/booking/:bookingId', async (req, res) => {
            await this.handleUpdateBooking(req, res);
        });
        
        // Cancel booking
        this.app.delete('/booking/:bookingId', async (req, res) => {
            await this.handleCancelBooking(req, res);
        });
        
        // Get agent schedule
        this.app.get('/schedule/:agentId', async (req, res) => {
            await this.handleGetSchedule(req, res);
        });
        
        // Sync with external calendar
        this.app.post('/calendar/sync', async (req, res) => {
            await this.handleCalendarSync(req, res);
        });
        
        // Export to Excel/CSV
        this.app.get('/export/:agentId', async (req, res) => {
            await this.handleExportSchedule(req, res);
        });
        
        // Process payment
        this.app.post('/payment/process', async (req, res) => {
            await this.handlePaymentProcessing(req, res);
        });
    }
    
    async createWebInterface() {
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Agent Calendar Scheduler</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .controls {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        label {
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
        }
        
        select, input {
            padding: 8px 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        select:focus, input:focus {
            outline: none;
            border-color: #3498db;
        }
        
        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        button:hover {
            background: #2980b9;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .calendar-container {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .calendar-header {
            background: #34495e;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .week-navigation {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .week-navigation button {
            background: #2c3e50;
            padding: 8px 15px;
            font-size: 13px;
        }
        
        .current-week {
            font-weight: 600;
            margin: 0 10px;
        }
        
        .calendar-grid {
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 800px;
        }
        
        th {
            background: #ecf0f1;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #2c3e50;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        td {
            padding: 10px;
            border: 1px solid #ecf0f1;
            vertical-align: top;
            height: 60px;
            position: relative;
        }
        
        .time-slot {
            font-weight: 600;
            color: #666;
            background: #f8f9fa;
            text-align: center;
        }
        
        .slot-available {
            background: #e8f8f5;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .slot-available:hover {
            background: #d0f4ea;
            transform: scale(1.02);
        }
        
        .slot-booked {
            background: #fadbd8;
            cursor: not-allowed;
            opacity: 0.8;
        }
        
        .slot-processing {
            background: #fef9e7;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; }
            100% { opacity: 0.8; }
        }
        
        .booking-info {
            font-size: 12px;
            line-height: 1.4;
        }
        
        .booking-client {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .booking-task {
            color: #666;
            margin-top: 2px;
        }
        
        .booking-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .booking-modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .modal-header h2 {
            font-size: 24px;
            color: #2c3e50;
        }
        
        .close-button {
            background: none;
            border: none;
            font-size: 24px;
            color: #666;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
        }
        
        .close-button:hover {
            color: #333;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .price-display {
            background: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        
        .price-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .price-amount {
            font-size: 28px;
            font-weight: 700;
            color: #27ae60;
        }
        
        .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        
        .btn-secondary {
            background: #95a5a6;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        
        .legend {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 3px;
        }
        
        .stats-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #3498db;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .calendar-container {
                overflow-x: scroll;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📅 AI Agent Calendar Scheduler</h1>
            <p class="subtitle">Book AI agent time like scheduling a meeting - Simple, Fast, Efficient</p>
        </header>
        
        <div class="controls">
            <div class="control-group">
                <label>Select Agent</label>
                <select id="agentSelect">
                    <option value="">Loading agents...</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>View Type</label>
                <select id="viewType">
                    <option value="week">Week View</option>
                    <option value="day">Day View</option>
                    <option value="month">Month View</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>Timezone</label>
                <select id="timezone">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                </select>
            </div>
            
            <button onclick="exportSchedule()">📊 Export to Excel</button>
            <button onclick="syncCalendar()">🔄 Sync Calendar</button>
        </div>
        
        <div class="calendar-container">
            <div class="calendar-header">
                <h3 id="calendarTitle">Select an agent to view schedule</h3>
                <div class="week-navigation">
                    <button onclick="navigateWeek(-1)">← Previous</button>
                    <span class="current-week" id="currentWeek">Week of Jan 1</span>
                    <button onclick="navigateWeek(1)">Next →</button>
                </div>
            </div>
            
            <div class="calendar-grid">
                <table id="calendarTable">
                    <thead>
                        <tr>
                            <th width="100">Time</th>
                            <th>Monday</th>
                            <th>Tuesday</th>
                            <th>Wednesday</th>
                            <th>Thursday</th>
                            <th>Friday</th>
                            <th>Saturday</th>
                            <th>Sunday</th>
                        </tr>
                    </thead>
                    <tbody id="calendarBody">
                        <!-- Calendar slots will be generated here -->
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color" style="background: #e8f8f5;"></div>
                <span>Available</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #fadbd8;"></div>
                <span>Booked</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: #fef9e7;"></div>
                <span>Processing</span>
            </div>
        </div>
        
        <div class="stats-container">
            <div class="stat-card">
                <div class="stat-value" id="totalBookings">0</div>
                <div class="stat-label">Total Bookings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="weeklyHours">0</div>
                <div class="stat-label">Hours This Week</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="revenue">$0</div>
                <div class="stat-label">Weekly Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="utilization">0%</div>
                <div class="stat-label">Utilization Rate</div>
            </div>
        </div>
    </div>
    
    <!-- Booking Modal -->
    <div class="booking-modal" id="bookingModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Book AI Agent Time</h2>
                <button class="close-button" onclick="closeModal()">&times;</button>
            </div>
            
            <form id="bookingForm">
                <div class="form-group">
                    <label>Your Name</label>
                    <input type="text" id="clientName" required>
                </div>
                
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="clientEmail" required>
                </div>
                
                <div class="form-group">
                    <label>Task Description</label>
                    <textarea id="taskDescription" placeholder="What would you like the AI agent to help with?" required></textarea>
                </div>
                
                <div class="form-group">
                    <label>Duration (hours)</label>
                    <select id="duration">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="4">4 hours</option>
                        <option value="8">8 hours (full day)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Required Skills</label>
                    <select id="skills" multiple>
                        <option value="code_generation">Code Generation</option>
                        <option value="debugging">Debugging</option>
                        <option value="architecture">Architecture Design</option>
                        <option value="data_processing">Data Processing</option>
                        <option value="content_writing">Content Writing</option>
                    </select>
                </div>
                
                <div class="price-display">
                    <div class="price-label">Total Cost</div>
                    <div class="price-amount" id="totalPrice">$0</div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit">Confirm Booking</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let currentAgent = null;
        let currentWeekOffset = 0;
        let selectedSlot = null;
        let agents = [];
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadAgents();
            updateCalendar();
            
            document.getElementById('agentSelect').addEventListener('change', (e) => {
                currentAgent = e.target.value;
                updateCalendar();
            });
            
            document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmit);
            document.getElementById('duration').addEventListener('change', updatePrice);
        });
        
        async function loadAgents() {
            try {
                // In production, this would fetch from the NIL registry
                agents = [
                    { id: 'AGENT_001', name: 'QuantumStrategist', hourlyRate: 150 },
                    { id: 'AGENT_002', name: 'CodeMaster Pro', hourlyRate: 200 },
                    { id: 'AGENT_003', name: 'Data Wizard', hourlyRate: 175 }
                ];
                
                const select = document.getElementById('agentSelect');
                select.innerHTML = '<option value="">Select an agent...</option>';
                
                agents.forEach(agent => {
                    const option = document.createElement('option');
                    option.value = agent.id;
                    option.textContent = \`\${agent.name} ($\${agent.hourlyRate}/hr)\`;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading agents:', error);
            }
        }
        
        async function updateCalendar() {
            if (!currentAgent) {
                document.getElementById('calendarTitle').textContent = 'Select an agent to view schedule';
                document.getElementById('calendarBody').innerHTML = '';
                return;
            }
            
            const agent = agents.find(a => a.id === currentAgent);
            if (!agent) return;
            
            document.getElementById('calendarTitle').textContent = \`\${agent.name}'s Schedule\`;
            
            // Get calendar grid data
            try {
                const response = await fetch(\`/calendar/grid/\${currentAgent}?weekOffset=\${currentWeekOffset}\`);
                const data = await response.json();
                
                renderCalendar(data);
                updateStats(data.stats);
                updateWeekDisplay();
            } catch (error) {
                console.error('Error updating calendar:', error);
            }
        }
        
        function renderCalendar(data) {
            const tbody = document.getElementById('calendarBody');
            tbody.innerHTML = '';
            
            // Generate time slots
            for (let hour = 9; hour < 17; hour++) {
                const row = document.createElement('tr');
                
                // Time column
                const timeCell = document.createElement('td');
                timeCell.className = 'time-slot';
                timeCell.textContent = \`\${hour.toString().padStart(2, '0')}:00\`;
                row.appendChild(timeCell);
                
                // Day columns
                for (let day = 0; day < 7; day++) {
                    const cell = document.createElement('td');
                    const slotKey = \`day\${day}_hour\${hour}\`;
                    
                    if (data.bookings && data.bookings[slotKey]) {
                        // Slot is booked
                        cell.className = 'slot-booked';
                        const booking = data.bookings[slotKey];
                        cell.innerHTML = \`
                            <div class="booking-info">
                                <div class="booking-client">\${booking.clientName}</div>
                                <div class="booking-task">\${booking.taskPreview}</div>
                            </div>
                        \`;
                    } else {
                        // Slot is available
                        cell.className = 'slot-available';
                        cell.onclick = () => openBookingModal(day, hour);
                    }
                    
                    row.appendChild(cell);
                }
                
                tbody.appendChild(row);
            }
        }
        
        function openBookingModal(day, hour) {
            selectedSlot = { day, hour };
            const modal = document.getElementById('bookingModal');
            modal.classList.add('active');
            updatePrice();
        }
        
        function closeModal() {
            const modal = document.getElementById('bookingModal');
            modal.classList.remove('active');
            selectedSlot = null;
            document.getElementById('bookingForm').reset();
        }
        
        function updatePrice() {
            if (!currentAgent) return;
            
            const agent = agents.find(a => a.id === currentAgent);
            const duration = parseInt(document.getElementById('duration').value);
            const total = agent.hourlyRate * duration;
            
            document.getElementById('totalPrice').textContent = \`$\${total}\`;
        }
        
        async function handleBookingSubmit(e) {
            e.preventDefault();
            
            if (!selectedSlot || !currentAgent) return;
            
            const agent = agents.find(a => a.id === currentAgent);
            const formData = {
                agentId: currentAgent,
                clientName: document.getElementById('clientName').value,
                clientEmail: document.getElementById('clientEmail').value,
                taskDescription: document.getElementById('taskDescription').value,
                duration: parseInt(document.getElementById('duration').value),
                skills: Array.from(document.getElementById('skills').selectedOptions).map(o => o.value),
                startTime: calculateStartTime(selectedSlot),
                hourlyRate: agent.hourlyRate
            };
            
            try {
                const response = await fetch('/booking/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(\`Booking confirmed! Booking ID: \${result.booking.bookingId}\`);
                    closeModal();
                    updateCalendar();
                } else {
                    alert(\`Booking failed: \${result.error}\`);
                }
            } catch (error) {
                alert('Error creating booking: ' + error.message);
            }
        }
        
        function calculateStartTime(slot) {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + (currentWeekOffset * 7));
            
            const startTime = new Date(weekStart);
            startTime.setDate(weekStart.getDate() + slot.day + 1); // +1 because Monday is day 0
            startTime.setHours(slot.hour, 0, 0, 0);
            
            return startTime.toISOString();
        }
        
        function navigateWeek(direction) {
            currentWeekOffset += direction;
            updateCalendar();
        }
        
        function updateWeekDisplay() {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + (currentWeekOffset * 7));
            
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const weekText = \`Week of \${monthNames[weekStart.getMonth()]} \${weekStart.getDate()}\`;
            
            document.getElementById('currentWeek').textContent = weekText;
        }
        
        function updateStats(stats) {
            if (!stats) return;
            
            document.getElementById('totalBookings').textContent = stats.totalBookings || '0';
            document.getElementById('weeklyHours').textContent = stats.weeklyHours || '0';
            document.getElementById('revenue').textContent = \`$\${stats.weeklyRevenue || 0}\`;
            document.getElementById('utilization').textContent = \`\${stats.utilizationRate || 0}%\`;
        }
        
        async function exportSchedule() {
            if (!currentAgent) {
                alert('Please select an agent first');
                return;
            }
            
            window.open(\`/export/\${currentAgent}?format=excel\`, '_blank');
        }
        
        async function syncCalendar() {
            if (!currentAgent) {
                alert('Please select an agent first');
                return;
            }
            
            try {
                const response = await fetch('/calendar/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId: currentAgent })
                });
                
                const result = await response.json();
                alert(result.message || 'Calendar synced successfully');
            } catch (error) {
                alert('Error syncing calendar: ' + error.message);
            }
        }
    </script>
</body>
</html>`;

        await fs.writeFile('./public/index.html', htmlContent);
        console.log('   📄 Web interface created');
    }
    
    async handleGetCalendarGrid(req, res) {
        const { agentId } = req.params;
        const { weekOffset = 0 } = req.query;
        
        // Calculate week dates
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (parseInt(weekOffset) * 7));
        
        // Get bookings for this week
        const weekBookings = {};
        let totalBookings = 0;
        let weeklyHours = 0;
        let weeklyRevenue = 0;
        
        for (const [bookingId, booking] of this.bookings) {
            const bookingDate = new Date(booking.startTime);
            
            // Check if booking is in this week
            if (bookingDate >= weekStart && bookingDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                if (booking.agentId === agentId) {
                    const day = bookingDate.getDay() === 0 ? 6 : bookingDate.getDay() - 1; // Adjust for Monday start
                    const hour = bookingDate.getHours();
                    const slotKey = `day${day}_hour${hour}`;
                    
                    weekBookings[slotKey] = {
                        bookingId: booking.bookingId,
                        clientName: booking.clientName,
                        taskPreview: booking.taskDescription.substring(0, 50) + '...',
                        duration: booking.duration
                    };
                    
                    totalBookings++;
                    weeklyHours += booking.duration;
                    weeklyRevenue += booking.totalCost;
                }
            }
        }
        
        // Calculate utilization
        const totalSlots = 8 * 7; // 8 hours * 7 days
        const bookedSlots = Object.keys(weekBookings).length;
        const utilizationRate = Math.round((bookedSlots / totalSlots) * 100);
        
        res.json({
            agentId,
            weekStart: weekStart.toISOString(),
            bookings: weekBookings,
            stats: {
                totalBookings,
                weeklyHours,
                weeklyRevenue,
                utilizationRate
            }
        });
    }
    
    async handleCheckAvailability(req, res) {
        const { agentId, startTime, duration } = req.body;
        
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
        
        // Check for conflicts
        let isAvailable = true;
        const conflicts = [];
        
        for (const [bookingId, booking] of this.bookings) {
            if (booking.agentId !== agentId) continue;
            
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            
            // Check for overlap
            if ((start >= bookingStart && start < bookingEnd) ||
                (end > bookingStart && end <= bookingEnd) ||
                (start <= bookingStart && end >= bookingEnd)) {
                isAvailable = false;
                conflicts.push({
                    bookingId: booking.bookingId,
                    clientName: booking.clientName,
                    time: `${bookingStart.toLocaleTimeString()} - ${bookingEnd.toLocaleTimeString()}`
                });
            }
        }
        
        res.json({
            available: isAvailable,
            conflicts,
            suggestedAlternatives: isAvailable ? [] : this.findAlternativeSlots(agentId, start, duration)
        });
    }
    
    async handleCreateBooking(req, res) {
        const {
            agentId,
            clientName,
            clientEmail,
            taskDescription,
            skills,
            startTime,
            duration,
            hourlyRate
        } = req.body;
        
        // First check availability
        const availabilityCheck = await this.checkAvailability(agentId, startTime, duration);
        if (!availabilityCheck.available) {
            return res.status(409).json({
                success: false,
                error: 'Time slot not available',
                conflicts: availabilityCheck.conflicts
            });
        }
        
        const bookingId = `BOOKING_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const totalCost = hourlyRate * duration;
        
        const booking = {
            bookingId,
            agentId,
            clientName,
            clientEmail,
            
            // Time
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(new Date(startTime).getTime() + duration * 60 * 60 * 1000).toISOString(),
            duration,
            
            // Task
            taskDescription,
            skills,
            
            // Financial
            hourlyRate,
            totalCost,
            paymentStatus: 'pending',
            
            // Status
            status: 'confirmed',
            createdAt: new Date().toISOString(),
            
            // Access
            meetingLink: `http://localhost:${this.port}/session/${bookingId}`,
            calendarEventId: null
        };
        
        // Save booking
        this.bookings.set(bookingId, booking);
        await fs.writeFile(
            `./calendar-data/bookings/${bookingId}.json`,
            JSON.stringify(booking, null, 2)
        );
        
        // Send confirmation email (mock)
        console.log(`📧 Sending confirmation to ${clientEmail}`);
        
        res.json({
            success: true,
            booking,
            paymentLink: `http://localhost:${this.port}/payment/${bookingId}`,
            calendarInvite: `http://localhost:${this.port}/calendar/invite/${bookingId}`
        });
    }
    
    async handleUpdateBooking(req, res) {
        const { bookingId } = req.params;
        const updates = req.body;
        
        const booking = this.bookings.get(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Update booking
        Object.assign(booking, updates, {
            updatedAt: new Date().toISOString()
        });
        
        // Save updated booking
        this.bookings.set(bookingId, booking);
        await fs.writeFile(
            `./calendar-data/bookings/${bookingId}.json`,
            JSON.stringify(booking, null, 2)
        );
        
        res.json({
            success: true,
            booking
        });
    }
    
    async handleCancelBooking(req, res) {
        const { bookingId } = req.params;
        
        const booking = this.bookings.get(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Check cancellation policy
        const now = new Date();
        const bookingStart = new Date(booking.startTime);
        const hoursUntilStart = (bookingStart - now) / (1000 * 60 * 60);
        
        let refundAmount = 0;
        if (hoursUntilStart > 24) {
            refundAmount = booking.totalCost; // Full refund
        } else if (hoursUntilStart > 12) {
            refundAmount = booking.totalCost * 0.5; // 50% refund
        }
        
        // Update booking status
        booking.status = 'cancelled';
        booking.cancelledAt = now.toISOString();
        booking.refundAmount = refundAmount;
        
        // Save cancellation
        this.bookings.set(bookingId, booking);
        await fs.writeFile(
            `./calendar-data/bookings/${bookingId}.json`,
            JSON.stringify(booking, null, 2)
        );
        
        res.json({
            success: true,
            message: 'Booking cancelled',
            refundAmount,
            cancellationPolicy: {
                '24+ hours': '100% refund',
                '12-24 hours': '50% refund',
                'Less than 12 hours': 'No refund'
            }
        });
    }
    
    async handleGetSchedule(req, res) {
        const { agentId } = req.params;
        const { startDate, endDate } = req.query;
        
        const start = new Date(startDate || new Date());
        const end = new Date(endDate || new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000));
        
        const schedule = [];
        
        for (const [bookingId, booking] of this.bookings) {
            if (booking.agentId !== agentId) continue;
            
            const bookingStart = new Date(booking.startTime);
            if (bookingStart >= start && bookingStart <= end) {
                schedule.push({
                    bookingId: booking.bookingId,
                    start: booking.startTime,
                    end: booking.endTime,
                    client: booking.clientName,
                    task: booking.taskDescription,
                    status: booking.status
                });
            }
        }
        
        // Sort by start time
        schedule.sort((a, b) => new Date(a.start) - new Date(b.start));
        
        res.json({
            agentId,
            period: { start: start.toISOString(), end: end.toISOString() },
            schedule,
            totalBookings: schedule.length,
            totalHours: schedule.reduce((sum, b) => {
                const duration = (new Date(b.end) - new Date(b.start)) / (1000 * 60 * 60);
                return sum + duration;
            }, 0)
        });
    }
    
    async handleCalendarSync(req, res) {
        const { agentId, provider = 'google' } = req.body;
        
        // Mock calendar sync
        // In production, would integrate with Google Calendar API, Outlook, etc.
        
        res.json({
            success: true,
            message: `Calendar sync initiated with ${provider}`,
            syncId: crypto.randomBytes(16).toString('hex'),
            instructions: [
                'Check your email for authorization link',
                'Grant calendar access permissions',
                'Bookings will sync automatically'
            ]
        });
    }
    
    async handleExportSchedule(req, res) {
        const { agentId } = req.params;
        const { format = 'csv', period = 'week' } = req.query;
        
        // Generate CSV content
        let csvContent = 'Date,Time,Client,Task,Duration,Status,Revenue\n';
        
        for (const [bookingId, booking] of this.bookings) {
            if (booking.agentId !== agentId) continue;
            
            const date = new Date(booking.startTime);
            csvContent += `${date.toLocaleDateString()},${date.toLocaleTimeString()},${booking.clientName},"${booking.taskDescription}",${booking.duration}h,${booking.status},$${booking.totalCost}\n`;
        }
        
        // Set headers for download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=agent_${agentId}_schedule.csv`);
        res.send(csvContent);
    }
    
    async handlePaymentProcessing(req, res) {
        const { bookingId, paymentMethod, paymentDetails } = req.body;
        
        const booking = this.bookings.get(bookingId);
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        // Mock payment processing
        // In production, would integrate with Stripe, PayPal, etc.
        
        const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        
        // Update booking with payment
        booking.paymentStatus = 'completed';
        booking.paymentId = paymentId;
        booking.paymentMethod = paymentMethod;
        booking.paidAt = new Date().toISOString();
        
        // Save updated booking
        this.bookings.set(bookingId, booking);
        await fs.writeFile(
            `./calendar-data/bookings/${bookingId}.json`,
            JSON.stringify(booking, null, 2)
        );
        
        // Save payment record
        const payment = {
            paymentId,
            bookingId,
            amount: booking.totalCost,
            method: paymentMethod,
            status: 'completed',
            processedAt: new Date().toISOString()
        };
        
        await fs.writeFile(
            `./calendar-data/payments/${paymentId}.json`,
            JSON.stringify(payment, null, 2)
        );
        
        res.json({
            success: true,
            message: 'Payment processed successfully',
            paymentId,
            receipt: `http://localhost:${this.port}/receipt/${paymentId}`
        });
    }
    
    // Helper methods
    async checkAvailability(agentId, startTime, duration) {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
        
        const conflicts = [];
        
        for (const [bookingId, booking] of this.bookings) {
            if (booking.agentId !== agentId || booking.status === 'cancelled') continue;
            
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            
            if ((start >= bookingStart && start < bookingEnd) ||
                (end > bookingStart && end <= bookingEnd) ||
                (start <= bookingStart && end >= bookingEnd)) {
                conflicts.push(booking);
            }
        }
        
        return {
            available: conflicts.length === 0,
            conflicts
        };
    }
    
    findAlternativeSlots(agentId, preferredStart, duration) {
        const alternatives = [];
        const searchDays = 7;
        
        for (let day = 0; day < searchDays; day++) {
            const date = new Date(preferredStart);
            date.setDate(date.getDate() + day);
            
            for (let hour = 9; hour < 17 - duration; hour++) {
                date.setHours(hour, 0, 0, 0);
                
                const availability = this.checkAvailability(agentId, date, duration);
                if (availability.available) {
                    alternatives.push({
                        date: date.toISOString(),
                        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
                        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    });
                    
                    if (alternatives.length >= 3) return alternatives;
                }
            }
        }
        
        return alternatives;
    }
    
    async startServer() {
        this.app.listen(this.port, () => {
            console.log(`📅 Calendar Scheduler running on http://localhost:${this.port}`);
            console.log('📋 Features:');
            console.log('   • Excel-like calendar grid');
            console.log('   • Real-time availability checking');
            console.log('   • Automated booking management');
            console.log('   • Payment processing integration');
            console.log('   • Calendar sync (Google, Outlook)');
        });
    }
}

// Start the scheduler
const scheduler = new AgentCalendarScheduler();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n📅 Shutting down Calendar Scheduler...');
    process.exit(0);
});

module.exports = AgentCalendarScheduler;