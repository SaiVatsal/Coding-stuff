# KL University 360° Interactive Website

A modern, legally compliant 360-degree interactive website for KL University (Koneru Lakshmaiah Education Foundation) featuring virtual campus tours, smart data aggregation, AI chatbot, and admin panel.

## 🚀 Features

- **360° Virtual Campus Tour** - Explore the campus in immersive 360-degree mode with clickable hotspots
- **Interactive Map** - Google Maps integration with key locations
- **Smart Data Aggregation** - Displays college info, courses, facilities, and events
- **Media Gallery** - YouTube embeds and licensed image gallery
- **AI Chatbot** - Pre-defined knowledge base for admissions, courses, and placements
- **Admin Panel** - CRUD operations for content management
- **SEO Optimized** - Meta tags, lazy loading, and responsive design

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Pannellum (360° viewer)
- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose
- **APIs**: Google Maps JavaScript API, YouTube Embed API

## 📁 Project Structure

```
kl-university-360/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service calls
│   │   ├── utils/          # Utility functions
│   │   └── data/           # Static data files
│   └── public/
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # Express routes
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   └── config/             # Configuration files
├── .env.example            # Environment variables template
└── README.md
```

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Google Cloud Console account (for Maps API)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd kl-university-360
npm install
```

### 2. Environment Variables

Create `.env` files in both client and server directories:

**server/.env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kl-university
JWT_SECRET=your-super-secret-jwt-key
ADMIN_EMAIL=admin@kluniversity.in
ADMIN_PASSWORD=securepassword123
```

**client/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Street View Static API
4. Create credentials (API Key)
5. Restrict the API key to your domains

### 4. Run the Application

**Development mode (runs both client and server):**
```bash
npm run dev
```

**Or run separately:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Admin Panel**: http://localhost:5173/admin (login required)

## 📋 API Endpoints

### Public Endpoints
- `GET /api/college` - College overview
- `GET /api/departments` - All departments
- `GET /api/courses` - All courses
- `GET /api/facilities` - Campus facilities
- `GET /api/events` - Events and news
- `GET /api/media` - Media gallery
- `POST /api/chatbot` - Chatbot queries

### Admin Endpoints (Protected)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/departments` - Create department
- `PUT /api/admin/departments/:id` - Update department
- `DELETE /api/admin/departments/:id` - Delete department
- Similar CRUD for courses, events, media, etc.

## 🔒 Legal Compliance

This project is built with legal and ethical compliance:

- ✅ Uses only official APIs (Google Maps, YouTube embeds)
- ✅ No web scraping of copyrighted content
- ✅ Pre-defined structured knowledge for chatbot
- ✅ Admin-uploaded media only
- ✅ Proper attribution for all content

## 📱 Responsive Design

The website is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🔧 Performance Optimizations

- Lazy loading for images and components
- Code splitting with React.lazy()
- Optimized bundle size
- CDN-ready assets
- Gzip compression on server

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
