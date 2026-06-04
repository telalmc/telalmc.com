// Firebase configuration configuration file
// To save settings automatically for all visitors on GitHub Pages:
// 1. Create a free project on Firebase (https://console.firebase.google.com/)
// 2. Add a Web App to your project to get the configuration object.
// 3. Enable "Realtime Database" in Firebase Console.
// 4. Set the Database Rules to read/write:
//    {
//      "rules": {
//        ".read": "true",
//        ".write": "true"
//      }
//    }
// 5. Copy the config object and paste it below:

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Export to window
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
}
