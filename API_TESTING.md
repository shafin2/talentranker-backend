# Backend API Testing Guide

## Test Routes

### 1. Health Check (No Auth Required)
```bash
curl http://localhost:5000/api/health
```

### 2. User Signup
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from the response for the following requests.

### 4. Upload JD (Text Input)
```bash
curl -X POST http://localhost:5000/api/jd/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Full Stack Developer",
    "description": "Looking for experienced developer",
    "content": "We are seeking a Senior Full Stack Developer with 5+ years experience in React, Node.js, MongoDB. Must have strong problem-solving skills..."
  }'
```

### 5. Upload JD (PDF File)
```bash
curl -X POST http://localhost:5000/api/jd/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "jdFile=@/path/to/job-description.pdf" \
  -F "title=Senior Developer" \
  -F "description=Great opportunity"
```

### 6. Get All JDs
```bash
curl http://localhost:5000/api/jd \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 7. Upload CVs (Multiple PDFs)
```bash
curl -X POST http://localhost:5000/api/cv/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "cvFiles=@/path/to/resume1.pdf" \
  -F "cvFiles=@/path/to/resume2.pdf" \
  -F "cvFiles=@/path/to/resume3.pdf"
```

### 8. Get All CVs
```bash
curl http://localhost:5000/api/cv \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 9. Rank CVs
```bash
curl -X POST http://localhost:5000/api/ranking/rank \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescriptionId": "JD_ID_HERE",
    "cvIds": ["CV_ID_1", "CV_ID_2", "CV_ID_3"]
  }'
```

### 10. Get Ranking Results
```bash
curl http://localhost:5000/api/ranking/results \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Expected Response Formats

### JD Upload Success
```json
{
  "success": true,
  "message": "Job Description uploaded successfully",
  "data": {
    "_id": "...",
    "title": "Senior Full Stack Developer",
    "description": "Looking for experienced developer",
    "content": "Full job description text...",
    "filename": null,
    "createdAt": "2025-10-01T..."
  }
}
```

### CV Upload Success
```json
{
  "success": true,
  "message": "3 CV(s) uploaded successfully",
  "data": [
    {
      "_id": "...",
      "filename": "resume1.pdf",
      "createdAt": "2025-10-01T..."
    },
    {
      "_id": "...",
      "filename": "resume2.pdf",
      "createdAt": "2025-10-01T..."
    }
  ]
}
```

### Ranking Success
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "jobDescription": "...",
    "results": [
      {
        "cv": "...",
        "filename": "resume1.pdf",
        "prediction": "Relevant",
        "confidence": 85.5
      },
      {
        "cv": "...",
        "filename": "resume2.pdf",
        "prediction": "Relevant",
        "confidence": 72.3
      }
    ],
    "status": "completed"
  }
}
```

## Common Errors

### No Token
```json
{
  "message": "Access denied. No token provided."
}
```

### Invalid Token
```json
{
  "message": "Invalid token."
}
```

### Limit Exceeded
```json
{
  "message": "Job Description limit reached. Your plan allows 1 JD(s). Please upgrade your plan or archive existing JDs.",
  "limit": 1,
  "current": 1
}
```

### File Too Large
```json
{
  "message": "File too large"
}
```

### Invalid File Type
```json
{
  "message": "Only PDF files are allowed"
}
```
