# EduTrack 🎓

EduTrack is a comprehensive educational tracking and productivity platform designed to help students manage their study schedules, track their progress, and stay focused. The project consists of a **Web Dashboard** for detailed tracking and an **Expo-powered Mobile Application** for on-the-go management.

---

## 🚀 Key Features

### 💻 Web Dashboard
- **Study Activity Logging**: Record subjects, dates, and hours spent studying.
- **Real-time Synchronization**: Powered by **Firebase** for instant data updates.
- **Progress Tracking**: View and delete study logs directly from the dashboard.
- **Responsive Design**: Optimized for both desktop and mobile browsers.

### 📱 Mobile Application (EduTrackMobile)
- **Pomodoro Timer**: Dedicated focus and break modes to enhance productivity.
- **Integrated Scheduler**: Plan your study sessions with a functional time picker.
- **Activity Log**: View your study history on your mobile device.
- **Premium UI**: Modern design with dark mode support and smooth animations.
- **Cross-Platform**: Built with Expo/React Native for iOS and Android.

---

## 🛠️ Technology Stack

- **Frontend (Web)**: HTML5, Vanilla CSS, JavaScript.
- **Mobile**: React Native, Expo, TypeScript, Expo Router.
- **Backend/Storage**: Firebase (Firestore & Storage).
- **Icons & Theme**: Expo Symbols, React Navigation, Lucid-inspired aesthetics.

---

## 📂 Project Structure

```bash
EduTrack/
├── EduTrackMobile/      # React Native / Expo Mobile Application
│   ├── app/             # File-based routing (Expo Router)
│   ├── components/      # Reusable UI components
│   └── context/         # Theme and state management
├── js/                  # Web dashboard logic
├── css/                 # Web dashboard styles
├── index.html           # Landing page
├── dashboard.html       # Web tracking dashboard
└── firebase.js          # Firebase configuration shares logic
```

---

## 🏗️ Getting Started

### Prerequisites
- Node.js (v18 or later)
- Expo Go app on your physical device (for mobile testing)
- A Firebase project (for data synchronization)

### Setting up the Web Dashboard
1. Open `index.html` in your browser.
2. Ensure `firebase.js` is configured with your project's credentials.

### Setting up the Mobile App
1. Navigate to the mobile directory:
   ```bash
   cd EduTrackMobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npx expo start
   ```
4. Scan the QR code with your Expo Go app or use an emulator.

---

## 📜 License
This project is private and intended for educational tracking purposes.

---

*Made with ❤️ by the EduTrack Team.*
