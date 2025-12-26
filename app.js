// // Import Firebase SDKs (v9+)
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.x/firebase-app.js";
// import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.x/firebase-auth.js";
// import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.x/firebase-firestore.js";

// // TODO: Replace with your actual Firebase config
// const firebaseConfig = {
//     apiKey: "YOUR_API_KEY",
//     authDomain: "YOUR_PROJECT.firebaseapp.com",
//     projectId: "YOUR_PROJECT_ID",
//     storageBucket: "YOUR_PROJECT.appspot.com",
//     messagingSenderId: "YOUR_ID",
//     appId: "YOUR_APP_ID"
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);
// const provider = new GoogleAuthProvider();

// // DOM Elements
// const loginSec = document.getElementById('login-section');
// const checkinSec = document.getElementById('checkin-section');
// const nudgeSec = document.getElementById('nudge-section');
// const nudgeText = document.getElementById('nudge-text');

// // 1. Authentication [cite: 153]
// document.getElementById('login-btn').addEventListener('click', () => {
//     signInWithPopup(auth, provider);
// });

// onAuthStateChanged(auth, (user) => {
//     if (user) {
//         loginSec.classList.add('hidden');
//         checkinSec.classList.remove('hidden');
//         document.getElementById('auth-status').innerText = `Hello, ${user.displayName.split(' ')[0]}`;
//     } else {
//         loginSec.classList.remove('hidden');
//         checkinSec.classList.add('hidden');
//         nudgeSec.classList.add('hidden');
//     }
// });

// // 2. Log Mood & Store in Firestore [cite: 157, 185]
// window.logMood = async (mood) => {
//     const user = auth.currentUser;
//     if (!user) return;

//     try {
//         await addDoc(collection(db, "moods"), {
//             uid: user.uid,
//             mood: mood,
//             timestamp: new Date() // [cite: 137, 188]
//         });
        
//         detectPattern(user.uid, mood);
//     } catch (e) {
//         console.error("Error adding document: ", e);
//     }
// };

// // 3. Rule-Based Pattern Detection [cite: 139, 183]
// async function detectPattern(uid, currentMood) {
//     // Basic rule: If 'Overwhelmed' or 'Drained', trigger a nudge
//     if (currentMood === 'Overwhelmed' || currentMood === 'Drained') {
//         showNudge("Take 30 seconds to focus only on your exhales. You've got this."); // [cite: 146]
//     } else {
//         showNudge("Keep that momentum going! Have a steady day ahead.");
//     }
// }

// function showNudge(message) {
//     checkinSec.classList.add('hidden');
//     nudgeSec.classList.remove('hidden');
//     nudgeText.innerText = message; // [cite: 196]
// }

// window.resetUI = () => {
//     nudgeSec.classList.add('hidden');
//     checkinSec.classList.remove('hidden');
// };