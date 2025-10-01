# TalentRanker - Complete System Documentation

## System Overview

TalentRanker is a CV ranking system that uses Machine Learning to match candidates' CVs against job descriptions. The system includes user authentication, plan management, file uploads, and AI-powered ranking.

## Backend Architecture

### Models

1. **User** - User accounts with plan assignments
2. **Plan** - Subscription plans with JD/CV limits
3. **JobDescription** - Stored job descriptions
4. **CV** - Stored resumes/CVs
5. **RankingResult** - ML prediction results

### API Endpoints

#### Authentication (`/api/auth`)
- POST `/signup` - Register new user (auto-assigns Freemium plan)
- POST `/login` - User login
- POST `/logout` - User logout
- POST `/refresh` - Refresh access token
- GET `/google` - Google OAuth login

#### Admin (`/api/admin`)
- GET `/stats` - Dashboard statistics
- GET `/users` - List all users
- PUT `/users/:id` - Update user (including plan change)
- DELETE `/users/:id` - Delete user
- GET `/plans` - List all plans
- POST `/plans` - Create plan
- PUT `/plans/:id` - Update plan
- DELETE `/plans/:id` - Delete plan

#### Job Descriptions (`/api/jd`)
- POST `/upload` - Upload JD (PDF or text) ✅ Checks JD limit
- GET `/` - Get all user's JDs
- GET `/:id` - Get single JD
- DELETE `/:id` - Delete JD (soft delete)

#### CVs (`/api/cv`)
- POST `/upload` - Upload multiple CVs (PDF only) ✅ Checks CV limit
- GET `/` - Get all user's CVs
- GET `/:id` - Get single CV
- DELETE `/:id` - Delete CV (soft delete)

#### Ranking (`/api/ranking`)
- POST `/rank` - Rank CVs against JD
- GET `/results` - Get all ranking results
- GET `/results/:id` - Get single ranking result
- DELETE `/results/:id` - Delete ranking result

### Services

#### PDF Service (`pdfService.js`)
- Extract text from PDF files
- Validate PDF files (type, size)
- Max file size: 10MB

#### ML Service (`mlService.js`)
- API URL: `https://ahmadmahmood447.pythonanywhere.com/api`
- Input: `{ jd: string, resume: string }`
- Output: `{ result: { prediction: "Relevant"|"Not Relevant", confidence: number } }`
- Handles multiple CVs ranking
- Auto-sorts by confidence (highest first)

### Middleware

#### Usage Limits (`usageLimits.js`)
- `checkJDLimit` - Verifies user hasn't exceeded JD limit
- `checkCVLimit` - Verifies user hasn't exceeded CV limit  
- `updateUsageStats` - Updates user's usage statistics

#### File Upload (`upload.js`)
- Single file upload for JDs
- Multiple files upload for CVs (max 20 at once)
- PDF only, max 10MB per file
- Memory storage for processing

## User Flow

### 1. User Registration
```
User signs up → Auto-assigned Freemium plan → Can upload 1 JD, 10 CVs
```

### 2. Plan Upgrade (via Admin)
```
User requests upgrade → Submits Google Form with payment proof → 
Admin verifies → Admin changes plan in admin panel → 
User gets new limits
```

### 3. Using the System
```
Step 1: User uploads Job Description (PDF or text)
  ↓
Step 2: User uploads CV(s) (PDF, multiple files supported)
  ↓
Step 3: User selects JD and CV(s) to rank
  ↓
Step 4: System calls ML API for each CV
  ↓
Step 5: Results displayed in table with:
  - Rank
  - Candidate (filename)
  - Prediction (Relevant/Not Relevant)
  - Confidence Score
  ↓
Step 6: User can export results to CSV
```

### 4. Limit Enforcement
```
Before Upload:
  ✓ Check if user has active plan
  ✓ Check current usage vs plan limits
  ✓ If exceeded → Show error message
  ✓ If OK → Process upload

Error Messages:
  - "Job Description limit reached. Your plan allows X JD(s). Please upgrade your plan or archive existing JDs."
  - "CV limit exceeded. Your plan allows X CV(s). You have Y and trying to upload Z more."
  - "No active plan. Please subscribe to a plan to use this feature."
```

## ML Model Integration

### API Details
- **Endpoint**: POST https://ahmadmahmood447.pythonanywhere.com/api
- **Headers**: Content-Type: application/json
- **Request Body**:
  ```json
  {
    "jd": "job description text...",
    "resume": "resume text..."
  }
  ```
- **Response**:
  ```json
  {
    "result": {
      "prediction": "Relevant",
      "confidence": 68.46
    }
  }
  ```

### Ranking Logic
1. Extract text from JD and all CVs
2. Call ML API for each CV individually
3. Collect all predictions
4. Sort results:
   - First by prediction (Relevant > Not Relevant)
   - Then by confidence (highest first)
5. Return ranked list

## Database Schema

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  plan: ObjectId (ref: Plan),
  jdUsed: Number,
  cvUsed: Number,
  createdAt: Date
}
```

### Plan
```javascript
{
  name: String,
  region: String,
  billingCycle: String,
  price: Number,
  currency: String,
  jdLimit: Number (-1 = unlimited),
  cvLimit: Number (-1 = unlimited),
  features: [String]
}
```

### JobDescription
```javascript
{
  user: ObjectId (ref: User),
  title: String,
  description: String (short),
  content: String (full text),
  filename: String,
  status: String (active/archived),
  rankedCVsCount: Number
}
```

### CV
```javascript
{
  user: ObjectId (ref: User),
  filename: String,
  content: String (extracted text),
  fileSize: Number,
  status: String (active/archived)
}
```

### RankingResult
```javascript
{
  user: ObjectId (ref: User),
  jobDescription: ObjectId (ref: JobDescription),
  results: [{
    cv: ObjectId (ref: CV),
    filename: String,
    prediction: String,
    confidence: Number
  }],
  status: String (processing/completed/failed),
  error: String
}
```

## Installation & Setup

### Backend Dependencies
```bash
cd talentranker-backend
npm install express mongoose dotenv cors morgan cookie-parser express-session
npm install passport passport-google-oauth20 passport-local
npm install bcryptjs jsonwebtoken
npm install pdf-parse multer axios
```

### Environment Variables (.env)
```
MONGODB_URI=mongodb://localhost:27017/talentranker
PORT=5000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session
SESSION_SECRET=your-session-secret
```

### Seeding Data
```bash
# Seed admin user
npm run seed:admin

# Seed plans
npm run seed:plans
```

## Error Handling

### Common Errors
1. **Limit Exceeded**: 403 status with message and current/limit values
2. **File Too Large**: 400 status, max 10MB
3. **Invalid File Type**: 400 status, PDF only
4. **PDF Parsing Error**: 500 status with error details
5. **ML API Timeout**: 500 status, 30s timeout
6. **ML API Error**: 500 status with API error details

### Error Response Format
```json
{
  "message": "Error description",
  "limit": 10,
  "current": 8,
  "attempting": 3
}
```

## Security

### Authentication
- JWT-based authentication
- Access token (7 days) + Refresh token (30 days)
- httpOnly cookies for refresh tokens
- Password hashing with bcrypt (10 rounds)

### Authorization
- Route-level protection with `protect` middleware
- Admin-only routes with `adminAuth` middleware
- User can only access their own resources

### File Upload Security
- File type validation (PDF only)
- File size limits (10MB max)
- Memory storage (no disk writes)
- Virus scanning recommended (future enhancement)

## Performance Considerations

### Optimizations
- Database indexes on frequently queried fields
- Soft deletes (archive) instead of hard deletes
- Pagination for large result sets
- Memory storage for PDFs (no disk I/O)
- Async ML API calls with error handling

### Limitations
- Max 20 CVs per upload
- Max 10MB per PDF
- 30s timeout for ML API calls
- 50 results limit for ranking history

## Future Enhancements

1. **File Storage**: Move to cloud storage (AWS S3, Google Cloud Storage)
2. **Batch Processing**: Queue system for large ranking jobs
3. **Real-time Updates**: WebSocket for ranking progress
4. **Advanced Filtering**: Filter results by confidence, prediction
5. **Analytics**: User analytics dashboard
6. **Email Notifications**: Notify when ranking is complete
7. **API Rate Limiting**: Prevent abuse
8. **Caching**: Cache frequent rankings
9. **Multi-language Support**: Support non-English CVs/JDs
10. **Resume Parsing**: Extract structured data from CVs