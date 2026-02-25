# MediaFusion – Advanced Offline Video Combiner

MediaFusion is a high-fidelity, browser-based video editing studio that allows you to combine images, screen recordings, and audio into professional master files—all while remaining 100% offline.

## 🚀 Local Setup Instructions

Follow these steps to get the project running on your local machine:

### 1. Prerequisites
- **Node.js**: Ensure you have Node.js (version 18.17 or later) installed.
- **npm**: Comes bundled with Node.js.

### 2. Installation
Open your terminal in the project root directory and run:
```bash
npm install
```

### 3. Running the Development Server
Start the development server:
```bash
npm run dev
```

### 4. Access the App
Open your browser and navigate to:
**[http://localhost:9002](http://localhost:9002)**

---

## 🛠 Key Features
- **Dynamic Intro**: 4 seconds per uploaded banner image with cinematic transitions.
- **Master Recording**: High-fidelity screen recording playback with speed control.
- **Automatic Outro**: A 4-second "THANK YOU" card with optional custom messaging.
- **Privacy First**: All rendering happens in your browser's RAM/Canvas. No data is ever uploaded to a server.
- **Local Vault**: Previously generated videos are saved to your browser's IndexedDB for easy access.

## ⚙️ Technical Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React, Tailwind CSS, ShadCN UI
- **Engine**: Canvas API, Web Audio API, MediaRecorder API
- **Icons**: Lucide React
