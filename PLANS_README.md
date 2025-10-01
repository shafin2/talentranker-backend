# TalentRanker Backend - Plan Management & Usage Enforcement

## 🚀 Quick Setup

### 1. Seed the Database

```bash
# Create admin user
npm run seed:admin

# Seed all plans (Freemium, Pakistan, International)
npm run seed:plans

# Or seed everything at once
npm run seed:all
```

### 2. Start the Server

```bash
npm run dev
```

## 📋 Plan Structure

### Freemium (Global)
- **Price**: Free
- **Limits**: 1 JD + 10 CVs
- **Auto-assigned** to all new users

### Pakistan Plans (PKR)
| Plan | Monthly | 6-Month | Annual | JD Limit | CV Limit |
|------|---------|---------|--------|----------|----------|
| Starter | ₨5,000 | ₨25,000 | ₨50,000 | 10 | 500 |
| Growth | ₨12,000 | ₨60,000 | ₨120,000 | 25 | 1,500 |
| Pro | ₨25,000 | ₨130,000 | ₨260,000 | 50 | 3,000 |
| Enterprise | Custom | Custom | Custom | Unlimited | Unlimited |

### International Plans (USD)
| Plan | Monthly | 6-Month | Annual | JD Limit | CV Limit |
|------|---------|---------|--------|----------|----------|
| Starter | $50 | $250 | $500 | 10 | 1,000 |
| Growth | $120 | $600 | $1,200 | 25 | 3,000 |
| Pro | $250 | $1,250 | $2,500 | 50 | 5,000 |
| Enterprise | Custom | Custom | Custom | Unlimited | Unlimited |

## 🔐 API Endpoints

### Admin Routes (Require Admin Role)

#### Plan Management
```bash
# List all plans
GET /api/admin/plans
GET /api/admin/plans?region=Pakistan&isActive=true

# Create new plan
POST /api/admin/plans
{
  "name": "Starter",
  "region": "Pakistan", 
  "billingCycle": "Monthly",
  "price": 5000,
  "jdLimit": 10,
  "cvLimit": 500
}

# Update plan
PUT /api/admin/plans/:planId

# Delete plan (only if no users)
DELETE /api/admin/plans/:planId

# Change user's plan
PUT /api/admin/users/:userId/plan
{
  "planId": "plan_object_id",
  "resetUsage": true
}
```

#### Analytics
```bash
# Get comprehensive analytics
GET /api/admin/analytics
# Returns: total users, users per plan, signups per day, usage stats
```

### User Routes (Require Authentication)

```bash
# Get user profile with plan & usage
GET /api/users/me

# Get available plans (filtered by region if provided)
GET /api/users/plans?region=Pakistan

# Upgrade/downgrade plan
PUT /api/users/me/plan
{
  "planId": "plan_object_id",
  "resetUsageOnUpgrade": true
}

# Get usage statistics
GET /api/users/usage
```

### Usage Enforcement (Require Authentication)

```bash
# Upload JD (checks limits)
POST /api/usage/jd/upload

# Upload CV(s) (checks limits)
POST /api/usage/cv/upload
{
  "count": 5  # Optional: bulk upload
}

# Get usage stats
GET /api/usage/stats
```

## ⚡ Usage Enforcement Logic

### How it Works
1. **Before upload**: Check current usage vs plan limits
2. **Within limits**: Increment usage counter and proceed
3. **Limit exceeded**: Return error message
4. **Enterprise plans**: Skip all checks (unlimited)

### Example Usage Check Response
```json
{
  "success": true,
  "message": "Usage updated successfully",
  "usage": {
    "current": 8,
    "limit": 10,
    "remaining": 2,
    "unlimited": false
  }
}
```

### Error Response (Limit Exceeded)
```json
{
  "success": false,
  "message": "Plan limit exceeded. Please upgrade your plan.",
  "usage": {
    "current": 10,
    "limit": 10,
    "remaining": 0,
    "unlimited": false
  }
}
```

## 🛠 Database Schema

### Plan Model
```javascript
{
  name: "Starter" | "Growth" | "Pro" | "Enterprise" | "Freemium",
  region: "Pakistan" | "International" | "Global",
  billingCycle: "Monthly" | "SixMonth" | "Annual" | null,
  price: Number | null,
  currency: "PKR" | "USD",
  jdLimit: Number | null,  // null = unlimited
  cvLimit: Number | null,  // null = unlimited
  features: [String],
  description: String,
  isActive: Boolean,
  sortOrder: Number
}
```

### User Model (Updated)
```javascript
{
  // ... existing fields
  plan: ObjectId,     // Reference to Plan
  jdUsed: Number,     // Current JD usage
  cvUsed: Number      // Current CV usage
}
```

## 🔄 Automatic Plan Assignment

- **New signups** → Automatically assigned **Freemium (Global)** plan
- **Google OAuth** → Also gets Freemium plan
- **Usage starts at 0** for both JD and CV

## 🧪 Testing the Flow

### 1. Create a Test User
```bash
POST /api/auth/signup
{
  "name": "Test User",
  "email": "test@example.com", 
  "password": "test123"
}
# User automatically gets Freemium plan
```

### 2. Check Plan Limits
```bash
GET /api/users/me
# Returns user with plan: { jdLimit: 1, cvLimit: 10 }
```

### 3. Test Usage Enforcement
```bash
# First JD upload - should succeed
POST /api/usage/jd/upload

# Second JD upload - should fail
POST /api/usage/jd/upload
# Returns: "Plan limit exceeded. Please upgrade your plan."
```

### 4. Upgrade Plan
```bash
PUT /api/users/me/plan
{
  "planId": "starter_plan_id",
  "resetUsageOnUpgrade": true
}
```

### 5. Test Again
```bash
POST /api/usage/jd/upload
# Should now succeed with new limits
```

## 📊 Frontend Integration

### Get User's Region-Based Plans
```javascript
// Frontend detects user's country and requests appropriate plans
const region = userCountry === 'Pakistan' ? 'Pakistan' : 'International';
const response = await fetch(`/api/users/plans?region=${region}`);
```

### Monitor Usage
```javascript
// Before any upload operation
const usage = await fetch('/api/users/usage');
if (!usage.jd.unlimited && usage.jd.remaining === 0) {
  showUpgradePrompt();
}
```

## 🔧 Development Tips

### Useful Commands
```bash
# Seed fresh data
npm run seed:all

# View all plans
curl http://localhost:5000/api/admin/plans

# Test usage enforcement
curl -X POST http://localhost:5000/api/usage/jd/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Environment Variables
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
# ... other existing vars
```

This implementation provides a complete plan management and usage enforcement system that's ready for production use! 🎉