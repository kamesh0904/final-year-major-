# NeuroNest - Mental Health Support Platform

A comprehensive mental health support platform designed for neurodivergent individuals, featuring therapeutic games, AI-powered chatbot, personalized reports, and goal tracking.

## 🌟 Features

### 🎮 Therapeutic Games (10 Games)
- **ChromaticRush** - Color-based cognitive training
- **SensoryFlow** - Sensory processing exercises
- **OrderShift** - Pattern recognition and sequencing
- **ImpulseGuard** - Impulse control training
- **EmotionMatch** - Emotional recognition practice
- **PatternRelease** - Stress relief through patterns
- **MomentumSteps** - Progressive goal achievement
- **CalmPath** - Mindfulness and relaxation
- **BreathSync** - Breathing exercises
- **LightBuilder** - Creative expression therapy

### 💬 AI Companion Chatbot
- Natural, empathetic conversations
- Crisis detection and support
- Personalized responses based on user profile
- OpenAI GPT-4 powered

### 📊 Insights & Reports
- **Daily Reports** - 5-question daily check-ins with AI-generated insights
- **Weekly Reports** - Comprehensive weekly analysis with achievements and focus areas
- **PDF Downloads** - Export reports for personal records or sharing with therapists
- **Post-Game Questionnaires** - Triggered after 5 minutes of cumulative gameplay

### 🎯 Goal Tracking
- Daily gentle goals with streak tracking
- Personalized goal suggestions
- Progress visualization

### 📝 Personal Diary
- Secure, private journaling
- Mood tracking
- Reflection prompts

### 👤 User Profile
- Neurodivergence screening questionnaire
- Game high scores tracking
- Contact information for emergency support
- Progress history

## 🏗️ Tech Stack

### Frontend (Web)
- **React** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Supabase** for authentication and database
- **jsPDF** for report generation

### Mobile App
- **React Native** with Expo
- **TypeScript** for type safety
- **Native Navigation** with React Navigation
- **Same Backend** as web app
- **Cross-platform** (iOS & Android)

### Backend
- **FastAPI** (Python)
- **OpenAI GPT-4** for AI features
- **Supabase** for database
- **PostgreSQL** for data storage

### Deployment
- **Google Cloud Run** for backend
- **Firebase Hosting** for frontend
- **Expo EAS** for mobile app builds
- **GitHub Actions** for CI/CD

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- OpenAI API key
- Google Cloud Platform account (for deployment)
- Expo CLI (for mobile app development)

### Local Development

#### 1. Clone the Repository
```bash
git clone https://github.com/kamesh0904/final-year-major-.git
cd final-year-major-
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your credentials
# See backend/.env for required variables

# Run backend
python main.py
```

Backend will run on `http://localhost:8000`

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file with Supabase credentials
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

Frontend will run on `http://localhost:5173`

#### 4. Mobile App Setup (Optional)
```bash
cd mobile

# Install dependencies
npm install

# Create .env file with configuration
# EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# EXPO_PUBLIC_API_URL=http://localhost:8000

# Start Expo development server
npm start

# Scan QR code with Expo Go app on your phone
```

See [MOBILE_APP_SETUP_GUIDE.md](MOBILE_APP_SETUP_GUIDE.md) for detailed mobile setup.

#### 5. Database Setup
Run the SQL migrations in Supabase SQL Editor in this order:
1. `backend/migrations/add_contact_info.sql`
2. `backend/migrations/add_crisis_detection.sql`
3. `backend/migrations/add_diary_system.sql`
4. `backend/migrations/add_gentle_goal_streak.sql`
5. `backend/migrations/add_post_game_questionnaire.sql`
6. `backend/migrations/add_daily_reports.sql`
7. `backend/migrations/add_enhanced_weekly_reports.sql`

## 🌐 Deployment

See [GCP_DEPLOYMENT_GUIDE.md](GCP_DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy
```bash
# Make sure you have gcloud CLI installed and configured
./deploy.sh
```

## 📁 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── agents/             # AI agent implementations
│   ├── logic/              # Business logic
│   ├── migrations/         # Database migrations
│   ├── schemas/            # Pydantic schemas
│   └── main.py            # FastAPI app entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── contexts/      # React contexts
│   │   ├── navigation/    # Navigation setup
│   │   └── screens/       # App screens
│   └── App.tsx            # Root component
├── games/                  # Unity games (optional)
└── .github/workflows/      # CI/CD pipelines
```

## 🔐 Environment Variables

### Backend (.env)
```
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
ENVIRONMENT=development
```

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

## 📖 Documentation

- [GCP Deployment Guide](GCP_DEPLOYMENT_GUIDE.md)
- [Mobile App Setup Guide](MOBILE_APP_SETUP_GUIDE.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [OAuth Setup Guide](OAUTH_SETUP_GUIDE.md)
- [Post-Game Questionnaire Implementation](POST_GAME_QUESTIONNAIRE_IMPLEMENTATION.md)
- [Enhanced Weekly Reports](ENHANCED_WEEKLY_REPORTS_IMPLEMENTATION.md)
- [Gentle Goal System](TODAYS_GENTLE_GOAL_IMPLEMENTATION.md)
- [Diary Feature](DIARY_FEATURE_IMPLEMENTATION.md)
- [Crisis Detection](ENHANCED_CHATBOT_CRISIS_DETECTION.md)

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

This is a final year major project. For any questions or suggestions, please open an issue.

## 📄 License

This project is part of an academic final year project.

## 👥 Team

- Kamesh (GitHub: @kamesh0904)

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Supabase for backend infrastructure
- Google Cloud Platform for hosting
- All open-source libraries used in this project

## 📞 Support

For emergency mental health support, please contact:
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/

---

**Note**: This platform is designed to support mental health but is not a replacement for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition.
