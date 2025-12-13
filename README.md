# 🎬 MovieVerse

![React](https://img.shields.io/badge/React-19.1.1-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.5.0-orange)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Free-brightgreen)
![Vite](https://img.shields.io/badge/Vite-7.1.7-purple)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

A modern, full-stack movie discovery application with real-time updates, cloud storage, and beautiful UI. Built with React, Firebase, and TMDB API.

## 🚀 Live Demo

**[View Live App](https://movie-trailer-app-gules.vercel.app)** ⚡

## ✨ Key Features

### 🔐 User Authentication & Security

- **Firebase Authentication** - Secure email/password login
- **Protected Routes** - Private user data with Firestore rules
- **Profile Management** - Update username, email, and password
- **Cloud Profile Photos** - Cloudinary integration for image storage
- **Account Security** - Reauthentication for sensitive operations

### 🎬 Movie Discovery

- **Multi-Category Browsing** - Movies, TV Shows, Animation, Documentaries
- **Real-time Search** - Instant results with TMDB API
- **Trending Content** - Weekly trending movies and shows
- **Movie Details** - Comprehensive info with trailers, cast, and ratings
- **Genre Filtering** - Browse by your favorite genres

### 💾 Personal Collections

- **Watchlist System** - Save movies to watch later
- **Favorites** - Mark and organize your favorite content
- **Firebase Sync** - Real-time cross-device synchronization
- **User-specific Data** - Each user has private collections

### 🎨 Modern UI/UX

- **8 Theme Options** - Light, Dark, and 6 vibrant color themes
- **Glassmorphism Design** - Modern frosted glass effects
- **Smooth Animations** - Framer Motion powered transitions
- **Fully Responsive** - Mobile-first design for all devices
- **Age Verification** - Optional adult content filtering (18+)

### 🔧 Advanced Features

- **Universal Movie Overlay** - Click any movie card to view details
- **YouTube Trailers** - Watch trailers directly in-app
- **Smart Recommendations** - "Hot Takes For You" trending section
- **Account Statistics** - Track your movies saved and watch time
- **Danger Zone** - Account deletion and data management

## 🛠 Tech Stack

### Frontend

- **React 19** - Latest React with modern hooks
- **Vite** - Lightning-fast build tool
- **Framer Motion** - Production-ready animations
- **React Router DOM** - Client-side routing
- **Context API** - Global state management

### Backend & Services

- **Firebase Authentication** - User management
- **Cloud Firestore** - Real-time NoSQL database
- **Cloudinary** - Cloud image storage (free tier)
- **TMDB API** - Movie and TV show data
- **YouTube API** - Trailer integration

### Styling

- **CSS3** - Custom styles with CSS variables
- **Glassmorphism** - Modern blur effects
- **Responsive Grid** - Flexible layouts
- **8 Dynamic Themes** - Persistent user preferences

## 📦 Installation

### Prerequisites

- Node.js 16+
- npm or yarn
- Firebase account ([Get started](https://firebase.google.com))
- TMDB API key ([Get key](https://www.themoviedb.org/settings/api))
- Cloudinary account ([Sign up free](https://cloudinary.com))

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/movieverse.git
cd movieverse
npm install
```

### 2. Environment Setup

Create `.env` file in root:

```env
# TMDB API
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# Firebase Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

### 3. Firebase Setup

#### Enable Authentication

1. Go to Firebase Console → Authentication
2. Enable "Email/Password" sign-in method

#### Create Firestore Database

1. Go to Firestore Database → Create Database
2. Start in **production mode**
3. Choose a location

#### Set Security Rules

**Firestore Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /favorites/{favoriteId} {
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null &&
                       request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null &&
                       resource.data.userId == request.auth.uid;
    }

    match /watchlist/{watchlistId} {
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null &&
                       request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null &&
                       resource.data.userId == request.auth.uid;
    }
  }
}
```

### 4. Cloudinary Setup

1. Create free account at [cloudinary.com](https://cloudinary.com)
2. Go to Settings → Upload → Upload Presets
3. Click "Add upload preset"
4. Set:
   - **Signing Mode:** Unsigned
   - **Preset Name:** movieverse_profiles (or custom name)
   - **Folder:** profile-photos
5. Save and copy the preset name to `.env`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 🏗 Project Structure

```
movieverse/
├── public/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── Account.jsx          # User profile & settings
│   │   ├── MovieDetails.jsx     # Movie info overlay
│   │   ├── Trending.jsx         # Trending movies
│   │   └── Watchlist.jsx        # User watchlist
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Login.jsx            # Authentication
│   │   └── Signup.jsx           # User registration
│   ├── context/
│   │   ├── FavoritesContext.jsx # Favorites management
│   │   └── WatchlistContext.jsx # Watchlist management
│   ├── firebase/
│   │   └── config.js            # Firebase initialization
│   ├── styles/
│   │   └── *.css                # Component styles
│   └── App.jsx                  # Main app component
├── .env                         # Environment variables
├── .gitignore                   # Git ignore rules
└── package.json                 # Dependencies
```

## 🎯 Core Features Explained

### Authentication Flow

```jsx
// Login redirects to home on success
const handleLogin = async (email, password) => {
  await signInWithEmailAndPassword(auth, email, password);
  navigate("/"); // Automatic redirect
};
```

### Universal Movie Details

```jsx
// Click any movie card anywhere in the app
const handleMovieClick = (movieId) => {
  setSelectedMovieId(movieId);
  setIsMovieDetailsActive(true);
};
```

### Theme System

```jsx
// 8 available themes with persistence
const themes = [
  "light",
  "dark",
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "red",
];
// Saved to localStorage automatically
```

### Cloud Photo Upload

```jsx
// Direct upload to Cloudinary (no Firebase Storage costs!)
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_PRESET);
  // Returns permanent URL
};
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Environment Variables in Vercel:**

- Go to Project Settings → Environment Variables
- Add all 10 variables from your `.env` file
- Redeploy

### Alternative Platforms

- **Netlify** - Similar process to Vercel
- **Firebase Hosting** - `firebase deploy`
- **AWS Amplify** - Connect GitHub repo

## 🔒 Security Features

### Data Protection

✅ Firestore rules prevent cross-user data access  
✅ User-specific collections with `userId` validation  
✅ Reauthentication required for password/email changes  
✅ Environment variables never exposed in client code

### Best Practices

- All API keys in `.env` (never committed to Git)
- Firebase rules restrict read/write by user ID
- Cloudinary unsigned uploads (no API secrets in frontend)
- XSS protection with React's built-in sanitization

## 📊 Performance

### Optimizations Applied

- ✅ Lazy loading for images
- ✅ Debounced search queries
- ✅ React Context for efficient state
- ✅ Framer Motion for optimized animations
- ✅ Vite for fast development and builds

### Lighthouse Scores (Target)

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

## 🐛 Troubleshooting

### Common Issues

**"Permission Denied" in Firestore**

- Ensure Firestore rules are published
- Check that user is authenticated
- Verify `userId` field is correct

**Profile Photo Not Uploading**

- Check Cloudinary credentials in `.env`
- Verify upload preset is set to "Unsigned"
- Check browser console for errors

**Build Errors on Vercel**

- Ensure all environment variables are added
- Check Node version compatibility (use 18+)
- Clear build cache and redeploy

**Movies Not Loading**

- Verify TMDB API key is valid
- Check API rate limits (not exceeded)
- Inspect network tab for API errors

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[TMDB](https://www.themoviedb.org)** - Movie database and API
- **[Firebase](https://firebase.google.com)** - Authentication and database
- **[Cloudinary](https://cloudinary.com)** - Image hosting
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[React](https://react.dev)** - UI framework

## 📞 Contact & Support

- **GitHub Issues** - [Report bugs or request features](../../issues)
- **Email** - your.email@example.com
- **Portfolio** - [Your Portfolio Link]

---

**Built with ❤️ by [Your Name]**

_Powered by React, Firebase, and TMDB API_
