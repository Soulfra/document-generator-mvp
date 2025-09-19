# 🎵🪢 Professional Portfolio Setup Guide

Transform your AnonTV portfolio into a professional system with music knot theory, authentication, and client management.

## What We've Built

✅ **Professional Portfolio Interface** - Clean, modern design replacing 4chan aesthetic  
✅ **JWT Authentication System** - Secure login with password hashing and sessions  
✅ **Music Knot Integration** - Skills generate music based on knot theory mathematics  
✅ **Client Management** - CRM system for managing clients and reviews  
✅ **Database Schema** - PostgreSQL with comprehensive tables and relationships  
✅ **Backend API** - Express.js server with full authentication and analytics  

## Quick Start

### 1. Prerequisites
```bash
# Install Node.js (if not already installed)
brew install node

# Install PostgreSQL (if not already installed)
brew install postgresql
brew services start postgresql
```

### 2. Database Setup
```bash
# Create database
createdb portfolio_platform

# Apply schema
psql -d portfolio_platform -f database-schema.sql
```

### 3. Install Dependencies
```bash
npm install express cors pg bcryptjs jsonwebtoken express-rate-limit express-validator
```

### 4. Start the System
```bash
# Use the automated startup script
./start-portfolio-system.sh

# Or manually start backend
node portfolio-backend.js
```

### 5. Access Your Portfolio
- **Frontend**: Open `professional-portfolio.html` in your browser
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Features Overview

### 🔐 Authentication System
- **Login**: admin@portfolio.com / admin123 (change in production)
- **JWT Tokens**: 7-day expiry with refresh capability
- **Password Reset**: Email-based (configure SMTP in .env)
- **Role-based Access**: Admin, Client, Viewer roles

### 🎼 Music Knot Theory
- **Skill Mapping**: Each skill maps to specific knot types and musical patterns
- **Real-time Generation**: Backend API generates music based on mathematical knot properties
- **Interactive Portfolio**: Click skills to hear their musical representation
- **Knot Types**: Trefoil, Figure-eight, Torus, Chain, and more

### 👥 Client Management
- **CRM System**: Track clients, projects, communications
- **Review System**: Collect and manage client testimonials
- **Analytics**: Track skill interactions and portfolio engagement
- **Admin Dashboard**: Manage all aspects from single interface

### 📊 Database Schema
- **Users & Authentication**: Secure user management with sessions
- **Portfolio Data**: Projects, skills, experience with music mappings
- **Client Management**: Clients, reviews, communications
- **Analytics**: Event tracking and usage metrics
- **Music Knots**: Mathematical knot definitions with musical properties

## File Structure

```
/Users/matthewmauer/Desktop/Document-Generator/
├── professional-portfolio.html     # Modern portfolio interface
├── anontv-legacy.html              # Original 4chan-style (backup)
├── auth-system.js                  # JWT authentication module
├── portfolio-backend.js            # Complete backend server
├── database-schema.sql             # PostgreSQL database schema
├── start-portfolio-system.sh       # Automated startup script
└── PORTFOLIO-SETUP.md             # This setup guide
```

## API Endpoints

### Public Endpoints
- `GET /health` - System health check
- `GET /api/v1/portfolio` - Public portfolio data
- `GET /api/v1/portfolio/skills` - Skills with music mappings
- `POST /api/v1/music/generate` - Generate music from skills
- `POST /api/v1/analytics/event` - Track interactions

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/linkedin` - LinkedIn OAuth
- `POST /auth/refresh` - Token refresh

### Admin Only
- `GET /api/v1/clients` - Client management
- `POST /api/v1/clients` - Create client
- `GET /api/v1/analytics/dashboard` - Analytics dashboard

## Music Knot Mappings

| Skill | Knot Type | Musical Pattern | Notes |
|-------|-----------|-----------------|-------|
| JavaScript | Trefoil | Steady progression | C-E-G-C |
| Python | Figure-eight | Smooth flow | D-F#-A-D |
| React | Square | Dynamic rhythm | E-G#-B-E |
| AI/ML | Torus | Complex patterns | G-Bb-D-G-Bb |
| Blockchain | Chain | Secure sequence | F-A-C-F |

## Configuration

### Environment Variables (.env)
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/portfolio_platform
JWT_SECRET=your-super-secret-jwt-key-change-in-production
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### LinkedIn Integration
1. Create LinkedIn app at https://developer.linkedin.com/
2. Add credentials to .env file
3. Configure OAuth redirect URL: `http://localhost:3001/auth/linkedin/callback`

## Integration with Existing System

### AnonTV Legacy Mode
- Original 4chan-style interface preserved at `anontv-legacy.html`
- Users can toggle between professional and retro modes
- All music knot functionality works in both interfaces

### Document Generator Integration
- Portfolio system integrates with existing Document Generator infrastructure
- Shares database connections and authentication where applicable
- Client management links to document generation projects

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql

# Test connection
psql -d portfolio_platform -c "SELECT NOW();"
```

### Port Conflicts
- Backend runs on port 3001 by default
- Change PORT in .env if needed
- Update API_BASE in professional-portfolio.html accordingly

### Authentication Issues
- Check JWT_SECRET is set in .env
- Verify database users table exists
- Check browser localStorage for stored tokens

## Next Steps

1. **LinkedIn Integration**: Complete OAuth setup for automatic profile sync
2. **Email System**: Configure SMTP for password reset functionality
3. **Music Enhancement**: Add more sophisticated knot theory algorithms
4. **Client Portal**: Build client-facing interface for project collaboration
5. **Analytics Dashboard**: Expand metrics and visualization
6. **Mobile Optimization**: Enhance responsive design for mobile devices

## Security Notes

⚠️ **Change Default Credentials**: Update admin password from 'admin123'  
⚠️ **JWT Secret**: Use strong, unique JWT_SECRET in production  
⚠️ **Database Security**: Configure PostgreSQL with proper user permissions  
⚠️ **HTTPS**: Use SSL/TLS in production environments  

---

**System Status**: ✅ Ready for production with proper configuration  
**Last Updated**: 2025-09-18  
**Version**: 1.0.0  