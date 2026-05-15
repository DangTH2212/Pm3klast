# PM3K - TikTok Sandbox Clone Platform

A fullstack TikTok sandbox clone platform for content posting, built with Next.js, Express.js, MongoDB Atlas, and TikTok Content Posting API.

## Features

- Login with TikTok sandbox account
- OAuth 2.0 authentication with token storage
- Video upload and publishing to TikTok sandbox
- Dashboard with upload history
- Modern TailwindCSS UI
- JWT authentication
- Token refresh mechanism
- MongoDB persistence

---

## Folder Structure

```
pm3klast/
├── .env.example                 # Environment variables template
├── package.json                 # Root workspace package
├── README.md                    # This file
│
├── backend/                     # Express.js Backend
│   ├── package.json
│   └── src/
│       ├── server.js           # Express server entry point
│       ├── models/
│       │   ├── user.model.js   # User schema with TikTok tokens
│       │   ├── video.model.js  # Video upload history schema
│       │   └── index.js       # Model exports
│       ├── routes/
│       │   ├── auth.routes.js  # OAuth, login, logout routes
│       │   ├── tiktok.routes.js # Video upload routes
│       │   ├── video.routes.js  # Video listing routes
│       │   └── profile.routes.js # Profile routes
│       ├── services/
│       │   ├── tiktok.service.js # TikTok API calls
│       │   └── upload.service.js # Upload workflow
│       ├── middleware/
│       │   ├── auth.middleware.js # JWT auth middleware
│       │   ├── error.middleware.js # Error handling
│       │   └── rateLimiter.middleware.js # Rate limiting
│       └── uploads/            # Local video storage
│
├── frontend/                    # Next.js Frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── pages/
│       │   ├── _app.js        # App wrapper with AuthProvider
│       │   ├── index.js       # Landing page
│       │   ├── login.js       # TikTok OAuth login
│       │   ├── dashboard.js   # Main dashboard
│       │   ├── upload.js       # Video upload page
│       │   └── oauth/
│       │       └── callback.js # OAuth callback handler
│       ├── lib/
│       │   ├── api.js         # Axios API service layer
│       │   └── AuthContext.js # React Context for auth
│       └── styles/
│           └── globals.css    # Tailwind styles
│
└── uploads/                    # Shared uploads directory
    └── videos/                 # Uploaded video files
```

---

## Prerequisites

1. **Node.js** v18+ installed
2. **MongoDB Atlas** account (free tier works)
3. **TikTok Developer** sandbox app created

---

## TikTok Sandbox Setup

### Step 1: Create TikTok Developer App

1. Go to [TikTok Developer Portal](https://developers.tiktok.com/)
2. Navigate to "My Apps"
3. Click "Create App"
4. Select "Content Posting API"
5. Choose "Sandbox" environment
6. Fill in app details

### Step 2: Configure Sandbox Settings

1. In your app dashboard, go to "App Settings"
2. Under "Sandbox", enable:
   - User Info Basic (user.info.basic)
   - Video Upload (video.upload)
   - Video Publish (video.publish)
3. Set Redirect URI to: `http://localhost:3000/oauth/callback`

### Step 3: Get Sandbox Credentials

From your app settings, copy:
- **Client Key**
- **Client Secret**

---

## MongoDB Atlas Setup

### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0 Sandbox)
3. Choose region closest to you

### Step 2: Create Database User

1. Go to "Security" → "Database Access"
2. Click "Add New Database User"
3. Set username and password (remember these!)
4. Grant "Read and write to any database"

### Step 3: Configure Network Access

1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0) for development

### Step 4: Get Connection String

1. Go to "Clusters" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `pm3k`

---

## Installation

### Step 1: Clone and Install Dependencies

```bash
# Navigate to project
cd pm3klast

# Install all dependencies (root + backend + frontend)
npm install
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your credentials
```

### Step 3: Configure .env File

Edit the `.env` file with your actual credentials:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/pm3k?retryWrites=true&w=majority

# JWT Secret (generate new one)
JWT_SECRET=your-64-char-random-secret

# TikTok Sandbox
TIKTOK_ENV=sandbox
TIKTOK_CLIENT_KEY=your-client-key
TIKTOK_CLIENT_SECRET=your-client-secret
TIKTOK_REDIRECT_URI=http://localhost:3000/oauth/callback

# URLs
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Step 4: Generate JWT Secret

```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Running Locally (Development)

### Option 1: Run Both Servers Together

```bash
# From root directory
npm run dev
```

This runs:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## Running with Ngrok (For TikTok OAuth)

TikTok requires a publicly accessible redirect URI. Use ngrok for local testing.

### Step 1: Install Ngrok

```bash
# Download from https://ngrok.com/download
# Or use npm
npm install -g ngrok
```

### Step 2: Start Ngrok

```bash
# In a new terminal
ngrok http 3000
```

### Step 3: Copy Forwarding URL

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 4: Update Environment

Edit `.env`:
```env
TIKTOK_REDIRECT_URI=https://abc123.ngrok.io/oauth/callback
FRONTEND_URL=https://abc123.ngrok.io
```

### Step 5: Update TikTok App Settings

In TikTok Developer Portal, add the ngrok URL as a redirect URI.

### Step 6: Restart Servers

```bash
npm run dev
```

**Note:** Ngrok free tier URLs change each restart. Update TikTok app settings with new URL.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/oauth/url` | Get TikTok OAuth URL |
| POST | `/api/auth/tiktok/callback` | Handle OAuth callback |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh TikTok token |
| POST | `/api/auth/logout` | Logout user |

### TikTok
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tiktok/upload` | Upload video to TikTok |
| POST | `/api/tiktok/upload/init` | Initialize upload |
| POST | `/api/tiktok/publish` | Publish video |
| POST | `/api/tiktok/publish/status` | Check publish status |

### Videos
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos` | Get user videos |
| GET | `/api/videos/:id` | Get single video |
| GET | `/api/videos/stats/summary` | Get video statistics |
| DELETE | `/api/videos/:id` | Delete video record |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| GET | `/api/profile/tiktok` | Get TikTok profile |
| GET | `/api/profile/tiktok/cached` | Get cached TikTok profile |

---

## MongoDB Schemas

### User Schema
```javascript
{
  email: String,
  password: String (hashed),
  username: String,
  tiktok: {
    open_id: String,
    union_id: String,
    display_name: String,
    avatar_url: String,
    bio: String,
    follower_count: Number,
    following_count: Number,
    video_count: Number,
    likes_count: Number
  },
  tokens: {
    access_token: String,
    refresh_token: String,
    expires_at: Date,
    refresh_expires_at: Date
  },
  isActive: Boolean,
  lastLogin: Date
}
```

### Video Schema
```javascript
{
  userId: ObjectId,
  tiktok: {
    publish_id: String,
    share_url: String,
    video_id: String
  },
  title: String,
  description: String,
  localFile: {
    filename: String,
    size: Number,
    mimeType: String
  },
  status: 'pending' | 'uploading' | 'processing' | 'published' | 'failed',
  postSettings: {
    privacy_level: String,
    disable_comment: Boolean,
    disable_share: Boolean
  },
  publishedAt: Date
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid Redirect URI" Error
- Ensure `TIKTOK_REDIRECT_URI` matches exactly what's in TikTok Developer Portal
- Include `http://` or `https://` prefix
- No trailing slash

#### 2. "Token Exchange Failed"
- Check TikTok sandbox credentials
- Verify redirect URI matches
- Ensure ngrok URL is updated in TikTok app

#### 3. MongoDB Connection Error
- Verify connection string format
- Check username/password
- Ensure network access allows your IP

#### 4. Upload Fails
- Check video format (MP4 recommended)
- Verify file size under 50MB
- Ensure TikTok token is valid (not expired)

#### 5. Blank Dashboard / Empty localStorage
- Check browser console for errors
- Verify backend is running
- Clear localStorage and login again

---

## Security Notes

- Never commit `.env` file
- Use strong JWT secrets (64+ characters)
- Enable rate limiting in production
- Use HTTPS in production
- Keep TikTok credentials secure

---

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Next.js   │────▶│   Express   │
│   (React)   │◀────│  Frontend   │◀────│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                    ┌───────────────────────────┤
                    │                           │
              ┌─────▼─────┐              ┌──────▼──────┐
              │  MongoDB  │              │   TikTok    │
              │   Atlas   │              │    API      │
              └───────────┘              └─────────────┘
```

---

## License

MIT License - Feel free to use for your TikTok sandbox testing.

---

Built with Next.js, Express, MongoDB, and TikTok Content Posting API.
