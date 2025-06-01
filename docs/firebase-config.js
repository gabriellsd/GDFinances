// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrYy4QDCNs8MJsUuScvNWnwt4uoAEsZjM",
    authDomain: "gdfinances-16586.firebaseapp.com",
    projectId: "gdfinances-16586",
    storageBucket: "gdfinances-16586.firebasestorage.app",
    messagingSenderId: "317414845406",
    appId: "1:317414845406:web:e9f9579fe78a31e9cfcb4f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const db = firebase.firestore(); 