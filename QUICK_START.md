# TalentRanker - Quick Start Guide

## ✅ Backend Setup Complete!

All backend files have been created and dependencies installed.

## 🚀 Starting the Server

```bash
cd talentranker-backend
npm start
```

Server will run on: http://localhost:5000

## 📋 What's Working

### ✅ Already Implemented
- User authentication (signup, login, logout)
- Google OAuth integration
- Admin panel (user management, plan changes)
- Plan management
- JWT session persistence

### ✅ Just Added
- **Job Description Management**
  - Upload JD (PDF or text)
  - List all JDs
  - View single JD
  - Delete JD (archive)
  - Usage limit checking

- **CV Management**
  - Upload multiple CVs (PDFs)
  - List all CVs
  - View single CV
  - Delete CV (archive)
  - Usage limit checking

- **AI-Powered Ranking**
  - Rank CVs against JD using ML model
  - Get ranking results
  - View ranking history
  - Delete ranking results

## 🧪 Testing the APIs

### 1. Upload Job Description (Text)
```bash
curl -X POST http://localhost:5000/api/jd/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Full Stack Developer",
    "description": "Looking for an experienced developer",
    "content": "We are seeking a Senior Full Stack Developer with 5+ years experience in React, Node.js, MongoDB..."
  }'
```

### 2. Upload Job Description (PDF)
```bash
curl -X POST http://localhost:5000/api/jd/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "jdFile=@/path/to/job-description.pdf" \
  -F "title=Senior Full Stack Developer" \
  -F "description=Looking for an experienced developer"
```

### 3. Upload CVs (Multiple PDFs)
```bash
curl -X POST http://localhost:5000/api/cv/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "cvFiles=@/path/to/resume1.pdf" \
  -F "cvFiles=@/path/to/resume2.pdf" \
  -F "cvFiles=@/path/to/resume3.pdf"
```

### 4. Rank CVs Against JD
```bash
curl -X POST http://localhost:5000/api/ranking/rank \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescriptionId": "JD_ID_HERE",
    "cvIds": ["CV_ID_1", "CV_ID_2", "CV_ID_3"]
  }'
```

### 5. Get Ranking Results
```bash
curl -X GET http://localhost:5000/api/ranking/results \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Expected Response from Ranking

```json
{
  "success": true,
  "data": {
    "_id": "ranking_result_id",
    "jobDescription": {
      "_id": "jd_id",
      "title": "Senior Full Stack Developer"
    },
    "results": [
      {
        "cv": "cv_id_1",
        "filename": "john_doe_resume.pdf",
        "prediction": "Relevant",
        "confidence": 85.5
      },
      {
        "cv": "cv_id_2",
        "filename": "jane_smith_resume.pdf",
        "prediction": "Relevant",
        "confidence": 72.3
      },
      {
        "cv": "cv_id_3",
        "filename": "bob_johnson_resume.pdf",
        "prediction": "Not Relevant",
        "confidence": 45.8
      }
    ],
    "status": "completed"
  }
}
```

## 🎯 Next Steps - Frontend Implementation

### Priority 1: User Dashboard Components
Create these components in `src/components/user/`:

1. **JD Management**
   - `JDUpload.jsx` - Form to upload JD (PDF or text input)
   - `JDList.jsx` - Display all user's JDs
   - `JDCard.jsx` - Single JD card with actions

2. **CV Management**
   - `CVUpload.jsx` - Drag-drop multiple PDF upload
   - `CVList.jsx` - Display all uploaded CVs
   - `CVCard.jsx` - Single CV card with file info

3. **Ranking Interface**
   - `RankingForm.jsx` - Select JD + CVs, trigger ranking
   - `RankingResults.jsx` - Display ranking table
   - `RankingHistory.jsx` - View past rankings
   - `ExportCSV.jsx` - Export results to CSV

4. **Usage Display**
   - `UsageStats.jsx` - Show JD/CV usage vs limits
   - `UpgradePrompt.jsx` - Show when approaching limits

### Priority 2: Update User Dashboard Page
Create new `src/pages/UserDashboard.jsx`:

```jsx
import UsageStats from '../components/user/UsageStats';
import JDManagement from '../components/user/JDManagement';
import CVManagement from '../components/user/CVManagement';
import RankingInterface from '../components/user/RankingInterface';

// Layout with tabs:
// - Overview (usage stats, quick actions)
// - Job Descriptions
// - CVs
// - Ranking
// - History
```

### Priority 3: API Service Layer
Create `src/services/talentranker.js`:

```javascript
import api from './auth';

export const jdService = {
  uploadJD: (formData) => api.post('/api/jd/upload', formData),
  getAllJDs: () => api.get('/api/jd'),
  getJDById: (id) => api.get(`/api/jd/${id}`),
  deleteJD: (id) => api.delete(`/api/jd/${id}`)
};

export const cvService = {
  uploadCVs: (formData) => api.post('/api/cv/upload', formData),
  getAllCVs: () => api.get('/api/cv'),
  getCVById: (id) => api.get(`/api/cv/${id}`),
  deleteCV: (id) => api.delete(`/api/cv/${id}`)
};

export const rankingService = {
  rankCVs: (data) => api.post('/api/ranking/rank', data),
  getResults: () => api.get('/api/ranking/results'),
  getResultById: (id) => api.get(`/api/ranking/results/${id}`),
  deleteResult: (id) => api.delete(`/api/ranking/results/${id}`)
};
```

## 🔧 Troubleshooting

### Error: "JD limit exceeded"
- User has reached plan limit
- Check current usage: `User.jdUsed` vs `Plan.jdLimit`
- Solution: Admin changes plan OR user archives old JDs

### Error: "CV limit exceeded"
- User has reached plan limit
- Check current usage: `User.cvUsed` vs `Plan.cvLimit`  
- Solution: Admin changes plan OR user archives old CVs

### Error: "PDF parsing failed"
- PDF might be corrupted or image-based (no text)
- Try converting PDF to text-based format
- Use OCR for image-based PDFs (future enhancement)

### Error: "ML API timeout"
- ML API might be slow or down
- Current timeout: 30 seconds
- Check API status: https://ahmadmahmood447.pythonanywhere.com/api

## 📝 Development Checklist

- [x] Backend models (User, Plan, JD, CV, RankingResult)
- [x] Backend services (PDF, ML)
- [x] Backend middleware (auth, usage limits)
- [x] Backend controllers (JD, CV, ranking)
- [x] Backend routes
- [x] Server integration
- [x] Package installation
- [ ] Frontend API services
- [ ] Frontend JD components
- [ ] Frontend CV components
- [ ] Frontend ranking components
- [ ] Frontend usage display
- [ ] Frontend error handling
- [ ] CSV export functionality
- [ ] End-to-end testing

## 🎨 UI/UX Recommendations

### Color Scheme (Match Landing Page)
- Primary: `#667eea` (blue)
- Secondary: `#764ba2` (purple)
- Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)

### Key UI Elements
1. **Upload Areas**: Drag-drop with dotted borders, gradient on hover
2. **Progress Bars**: For usage limits (change color when > 80%)
3. **Results Table**: Sortable columns, highlight "Relevant" predictions
4. **Cards**: Glass morphism effect for JD/CV cards
5. **Buttons**: Gradient background, smooth transitions

## 🚀 Ready to Launch!

Your backend is fully configured and ready. Start the server with `npm start` and begin building the frontend components to complete your TalentRanker system!
