// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc3kYu6XGP-CzurpwVdRxuY9G_YHygP_E",
  authDomain: "telalmc-db.firebaseapp.com",
  projectId: "telalmc-db",
  storageBucket: "telalmc-db.firebasestorage.app",
  messagingSenderId: "11072599562",
  appId: "1:11072599562:web:5cbc24b30453746e2651f3",
  databaseURL: "https://telalmc-db-default-rtdb.firebaseio.com" // Default database URL
};

// Export to window
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}