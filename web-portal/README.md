# Career Recommendation System - Web Portal

A comprehensive web-based career recommendation platform that helps users discover suitable career paths and job opportunities based on their skills and resume analysis.

## Overview

The Career Recommendation System is a full-stack application that leverages AI to analyze user resumes, extract skills, and provide personalized career recommendations and job matches. The system includes both user-facing features for career exploration and a robust admin panel for platform management.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Storage**: MinIO
- **AI Processing**: Python-based AI processor service
- **UI Components**: TailwindCSS, shadcn/ui, Lucide Icons

## User Features

### Authentication & Profile
- User registration and login with email/password
- Profile management with personal information
- Avatar upload support
- Last login tracking

### Resume Management
- Upload resumes in various formats (PDF, DOC, DOCX)
- Real-time processing status tracking
- Skills extraction and display
- Experience and education parsing
- Resume deletion capability

### Career Recommendations
- AI-powered career path suggestions
- Match score calculation
- Skills matching analysis
- Career category classification
- Detailed recommendation descriptions

### Job Discovery
- Browse job opportunities with advanced filtering
- Filter by job title, company, location, and type
- Job details view with salary information
- Bookmark/save jobs for later
- Career path association

### Dashboard
- Personalized dashboard with recommendations
- Skills overview
- Recent job postings
- Quick resume upload access

### Notifications
- In-app notification system
- Job match notifications
- Resume processing completion alerts
- System announcements

## Admin Features

### Dashboard
- Platform overview statistics
- Recent user activities
- System health monitoring
- Quick action links

### User Management
- View all users with search and filtering
- Bulk user operations (activate/deactivate)
- CSV export of user data
- Role-based access control (USER, ADMIN, MODERATOR, RECRUITER)
- User status management

### Resume Management
- View all uploaded resumes
- Search and filter by status
- Download resume files
- Delete resumes with MinIO cleanup
- Processing status tracking

### Activity Logs
- Track user actions across the platform
- Search by user, action, or entity
- Filter by action type (LOGIN, LOGOUT, UPLOAD_RESUME, etc.)
- IP address and user agent tracking
- Paginated results

### Audit Logs
- Track admin actions for security
- Search by admin, action, or entity
- Filter by action type (CREATE_USER, DELETE_USER, etc.)
- Complete audit trail
- Pagination support

### Career Path Management
- Create, edit, and delete career paths
- Define required skills and soft skills
- Set salary ranges and job opening counts
- Growth rate tracking
- Category-based organization
- Active/inactive status management

### Analytics Dashboard
- User metrics (total, active, inactive, new)
- Resume metrics (total, processed, pending, failed)
- Job metrics (total, active, inactive, new)
- Engagement metrics (bookmarks, recommendations)
- Job performance by career path
- CSV export functionality
- Time-period filtering (7, 30, 90 days)

### Feedback Management
- View user feedback and complaints
- Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- Filter by type (BUG_REPORT, FEATURE_REQUEST, COMPLAINT, SUGGESTION)
- Priority management (LOW, MEDIUM, HIGH, URGENT)
- Admin notes and resolution tracking
- Status updates

### Skill Taxonomy
- Manage skills database
- Categorize skills (TECHNICAL, SOFT, LANGUAGE, TOOL)
- Difficulty levels (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
- Active/inactive status
- Search and filter capabilities
- Full CRUD operations

### System Configuration
- AI service configuration
- Rate limiting settings
- General system settings
- Notification configuration
- Category-based organization (AI, RATE_LIMIT, GENERAL, NOTIFICATION)
- Key-value pair management
- Always-visible category cards for easy configuration access
- Add/edit configurations via intuitive dialog interface

### Email Service Configuration
- SMTP settings management
- Multiple email provider support (SMTP, SendGrid, Mailgun, AWS SES)
- Active configuration selection
- From email and name configuration
- Username/password management

### AI Service Settings
- API key management for AI providers
- Support for OpenAI, Anthropic, Google, and custom providers
- Model name configuration
- Rate limiting per API key
- Expiration date management
- Usage tracking
- Active/inactive status

### Notification Settings
- Email notification toggle
- Push notification toggle
- Notification frequency settings (immediate, daily, weekly)
- Event-based notification configuration
- Email sender details

### API Key Management
- View all API keys
- Filter by provider and active status
- Create new API keys
- Update existing keys
- Delete keys
- Usage tracking

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create user (admin only)
- `PATCH /api/admin/users` - Update user status (admin only)

### Resume Management
- `POST /api/resumes/upload` - Upload resume
- `GET /api/admin/resumes` - Get all resumes (admin only)
- `DELETE /api/admin/resumes/[id]` - Delete resume (admin only)

### Career Recommendations
- `GET /api/recommendations` - Get user recommendations
- `GET /api/admin/recommendations` - Get all recommendations (admin only)

### Jobs
- `GET /api/jobs` - Get jobs with filtering
- `GET /api/admin/jobs` - Get all jobs (admin only)
- `POST /api/admin/jobs` - Create job (admin only)
- `PUT /api/admin/jobs` - Update job (admin only)
- `DELETE /api/admin/jobs` - Delete job (admin only)

### Career Paths
- `GET /api/admin/careers` - Get career paths (admin only)
- `POST /api/admin/careers` - Create career path (admin only)
- `PUT /api/admin/careers?id={id}` - Update career path (admin only)
- `DELETE /api/admin/careers?id={id}` - Delete career path (admin only)

### Activity Logs
- `GET /api/admin/activity-logs` - Get activity logs (admin only)

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs (admin only)

### Analytics
- `GET /api/admin/analytics?period={days}` - Get analytics (admin only)

### Feedback
- `GET /api/admin/feedback` - Get feedback (admin only)
- `PATCH /api/admin/feedback?id={id}` - Update feedback status (admin only)

### Skills
- `GET /api/admin/skills` - Get skills (admin only)
- `POST /api/admin/skills` - Create skill (admin only)
- `PUT /api/admin/skills?id={id}` - Update skill (admin only)
- `DELETE /api/admin/skills?id={id}` - Delete skill (admin only)

### System Configuration
- `GET /api/admin/system-config` - Get system config (admin only)
- `POST /api/admin/system-config` - Create/update config (admin only)
- `PUT /api/admin/system-config` - Update config (admin only)

### Email Configuration
- `GET /api/admin/email-config` - Get email config (admin only)
- `POST /api/admin/email-config` - Create email config (admin only)
- `PUT /api/admin/email-config?id={id}` - Update email config (admin only)
- `DELETE /api/admin/email-config?id={id}` - Delete email config (admin only)

### API Keys
- `GET /api/admin/api-keys` - Get API keys (admin only)
- `POST /api/admin/api-keys` - Create API key (admin only)
- `PUT /api/admin/api-keys?id={id}` - Update API key (admin only)
- `DELETE /api/admin/api-keys?id={id}` - Delete API key (admin only)

## Database Schema

### Core Models
- **User**: User accounts with roles and profile information
- **Resume**: User resumes with processing status and extracted data
- **CareerRecommendation**: AI-generated career recommendations
- **CareerPath**: Career path definitions with requirements
- **Job**: Job postings with company and location details
- **JobBookmark**: User-saved jobs

### Logging Models
- **ActivityLog**: User action tracking
- **AuditLog**: Admin action tracking
- **Feedback**: User feedback and complaints

### Configuration Models
- **Skill**: Skills taxonomy
- **SystemConfig**: System-wide configuration
- **EmailConfig**: Email service configuration
- **ApiKey**: AI service API keys

### Support Models
- **Notification**: User notifications

## User Roles

- **USER**: Regular user with access to career recommendations and job search
- **ADMIN**: Full administrative access to all features
- **MODERATOR**: Limited admin access for content moderation
- **RECRUITER**: Access to job posting and candidate management

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/career_db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# MinIO
MINIO_HOST="localhost"
MINIO_PORT="9000"
MINIO_ROOT_USER="your-access-key"
MINIO_ROOT_PASSWORD="your-secret-key"
MINIO_BUCKET="career-resumes"
MINIO_USE_SSL="false"

# AI Processor Service
AI_PROCESSOR_URL="http://localhost:8000"
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- MinIO or S3-compatible storage
- Python 3.9+ (for AI processor)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
web-portal/
├── app/
│   ├── admin/              # Admin panel pages
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # User dashboard
│   ├── jobs/               # Job listings
│   ├── profile/            # User profile
│   └── layout.tsx          # Root layout
├── components/
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   └── utils.ts            # Utility functions
├── prisma/
│   └── schema.prisma       # Database schema
└── public/                 # Static assets
```

## Security Features

- Role-based access control (RBAC)
- Admin-only API endpoints
- Audit logging for admin actions
- Activity logging for user actions
- Secure file upload handling
- Rate limiting support
- Session management with NextAuth.js

## Performance Considerations

- Server-side rendering with Next.js App Router
- Database indexing for frequently queried fields
- Pagination for large datasets
- Optimistic UI updates
- Image optimization with Next.js Image component
- MinIO for efficient file storage

## Future Enhancements

- Real-time notifications with WebSockets
- Advanced analytics with charts
- Mobile app development
- Integration with job board APIs
- Video resume support
- AI interview preparation
- Skill assessment tests
- Learning path recommendations

## Support

For issues and questions, please refer to the project documentation or contact the development team.
