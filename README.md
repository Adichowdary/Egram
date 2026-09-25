<div align="center">

# 🏛️ EGRAM
### Next-Gen Real-Time Social, Campus & Community Collaboration Ecosystem
*Engineered for modern, high-engagement student networks, digital communities, and collaborative governance.*

<br/>

[![Next.js 16](https://img.shields.io/badge/Next.js-16.2.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Store-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Polyglot_Data-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-Smooth_UI-black?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-egram--project.vercel.app-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://egram-project.vercel.app/)

<br/>

[🚀 Quick Start](#-quick-start) • [✨ Core Features](#-core-features) • [🏗️ Architecture](#️-system-architecture) • [📂 Project Structure](#-project-structure) • [🔐 Security & Privacy](#-security--privacy) • [🧪 Testing](#-testing--quality)

---

</div>

## 📌 Overview

**Egram** is an all-in-one social and collaboration platform designed to bridge digital interaction, campus communication, and community networking. Built on **Next.js 16 (App Router)** and **React 19**, it delivers a sub-second, mobile-first experience uniting dynamic feeds, ephemeral media stories, instant direct messaging, virtual study meets, community circles, and verifiable skill certification.

---

## ✨ Core Features

### 1. 📱 Dynamic Activity Feed & Rich Media Posts
- **Interactive Posts:** Support for rich text, image attachments, tags, and categorized community posts.
- **Engagement Engine:** Instant optimistic likes, multi-level nested comment replies, and shareable links.
- **Feed Customization:** Switch seamlessly between Global feeds, Personal Network, and Circle-specific feeds.

### 2. ⏳ Ephemeral 24-Hour Stories
- **Instagram-Style Stories Bar:** Real-time story rings with unread status indicators.
- **Interactive Story Viewer:** Smooth animated transitions, progress bars, pause-on-hold, and quick reply triggers.
- **Creator Studio:** In-browser image upload, caption overlay, and automatic 24-hour expiration lifecycle.

### 3. 💬 Real-Time Encrypted Messaging
- **Direct & Group Chats:** Low-latency bi-directional messaging with live typing and read receipts.
- **Anti-Leak & Screenshot Alert:** Client-side privacy hooks (`useScreenshotDetection`) flagging screenshot attempts in private chats.
- **Online Presence & Heartbeat:** Real-time user active status using `PresenceHandler` and WebSocket telemetry.

### 4. 🔥 Gamified Streaks & Engagement
- **Daily Interaction Streaks:** Automated streak calculator (`useStreak`) rewarding consecutive daily interactions.
- **Activity Badges:** Student, Creator, and Contributor visual verification badges across user profiles and comments.

### 5. 👥 Community Circles & Study Rooms
- **Circles (`/circles`):** Topic-based community channels for clubs, cohorts, and campus interest groups.
- **Study Hub (`/study`):** Virtual audio/video rooms and collaborative workspaces (`CreateMeetModal`) with quick calendar integrations.
- **Group Management:** Role-based access, member invitations, custom banners, and group announcements.

### 6. 📜 Verifiable Certificate Issuance
- **Digital Credentials (`CertificateCard`):** Generate and display tamper-resistant achievement certificates directly on profiles.
- **Instant Verification:** Public credential verification URLs for academic and hackathon credentials.

### 7. 🔍 Instant Search & AI Discovery Hub
- **Universal Search (`/search`):** Instant search indexing users, posts, circles, and hashtags with debounce optimization.
- **Discover Hub (`/discover`):** Intelligent recommendation algorithm surfacing trending topics, top creators, and popular circles.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER (Next.js 16)                     │
│  React 19 • Tailwind CSS v4 • Framer Motion • Lucide React             │
│  MobileNav • CenterFeed • StoriesBar • PostCard • StoryViewerModal    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         REST / WebSocket Streams
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API ROUTE HANDLERS & MIDDLEWARE                    │
│  /api/posts • /api/stories • /api/messages • /api/users • /api/groups  │
│  Optimistic Edge Caching • AuthSync Middleware • Presence Heartbeat   │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
        Supabase Client (PostgreSQL)      Firebase / MongoDB
                    │                               │
┌───────────────────▼─────────────┐   ┌─────────────▼────────────────────┐
│      SUPABASE POSTGRESQL        │   │    FIREBASE & MONGODB STORES     │
│  Row-Level Security (RLS)       │   │  Realtime Document Stream        │
│  User Profiles, Posts, Social   │   │  High-Velocity Chat History      │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.2 (Turbopack)** | Full-stack App Router, Server Actions, & Route Handlers |
| **Frontend UI** | **React 19 & Tailwind CSS v4** | Next-generation declarative UI & utility-first styling |
| **Motion** | **Framer Motion 12** | Spring physics, page transitions, and story carousel animations |
| **Authentication** | **Firebase Auth & Supabase Auth** | Multi-provider authentication and JWT session validation |
| **Primary Database** | **Supabase (PostgreSQL)** | Relational social graph, posts, and strict Row-Level Security |
| **Document Store** | **MongoDB (Mongoose 9)** | High-throughput chat messages, stories, and notifications |
| **Icons & Assets** | **Lucide React** | Consistent, modern vector iconography |
| **Testing** | **Vitest 4 + Jest 30 + RTL** | Component unit tests and integration suites |

---

## 📂 Project Structure

```bash
egram-project/
├── public/                 # Static public assets, icons, and illustrations
├── src/
│   ├── app/                # Next.js 16 App Router pages and API routes
│   │   ├── api/            # REST API endpoints (posts, stories, messages, users)
│   │   ├── circles/        # Community circles hub
│   │   ├── discover/       # Discover & trending feed
│   │   ├── messages/       # Real-time chat application
│   │   ├── profile/        # Dynamic user profile & credentials
│   │   ├── search/         # Universal search interface
│   │   ├── study/          # Collaborative virtual study rooms
│   │   └── page.tsx        # Central social dashboard & activity feed
│   ├── components/         # Reusable presentation components
│   │   ├── CenterFeed.tsx  # Central algorithmic feed
│   │   ├── StoriesBar.tsx  # Ephemeral stories horizontal carousel
│   │   ├── PostCard.tsx    # Interactive post card with nested comments
│   │   ├── Sidebar.tsx     # Navigation & quick links
│   │   └── MobileNav.tsx   # Mobile-optimized bottom navigation
│   ├── hooks/              # Custom React hooks (usePosts, useRooms, useStreak)
│   ├── lib/                # Database clients (supabase.ts, firebase.ts, mongodb.ts)
│   └── models/             # Mongoose schemas (Post, Story, User, Message)
├── .env.example            # Template for environment configuration
├── next.config.ts          # Turbopack & Next.js compiler settings
└── package.json            # Project dependencies and script declarations
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### 1. Clone the Repository
```bash
git clone https://github.com/Adichowdary/Egram.git
cd Egram
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Add your configuration keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to explore Egram!

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 🧪 Testing & Quality

Egram includes preconfigured unit and integration tests using **Vitest** and **React Testing Library**:

```bash
# Run unit and component test suites
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🔐 Security & Privacy

- **Row-Level Security (RLS):** All Supabase queries enforce strict row-level policies ensuring private messages and user settings cannot be accessed across tenant boundaries.
- **Client-Side Privacy Hooks:** Real-time listeners alert users if a private chat screenshot is attempted on supported browsers.
- **Sanitized Inputs:** Strict input sanitization across post creators and comment forms preventing XSS attacks.

---

## 👨‍💻 Author

**Jashti Adi Naga Venkata Raghava (Adi Chowdary)**  
- 🌐 GitHub: [@Adichowdary](https://github.com/Adichowdary)  
- 💼 LinkedIn: [Adi Chowdary](https://www.linkedin.com/in/jashti-adi-naga-venkata-raghava-558391385)  
- 📸 Instagram: [@_.username__.error_720](https://www.instagram.com/_.username__.error_720?stkn=ODdydW41NDE4ODFh)  
- 📧 Email: `adichowdary720@gmail.com`

---

<div align="center">
  <sub>Built with ❤️ by Adi Chowdary • Star ⭐ this repository if you find it inspiring!</sub>
</div>