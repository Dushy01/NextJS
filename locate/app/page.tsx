'use client';
import styles from "./page.module.css";
// import { auth, googleAuthProvider, firestore } from './firebaseData/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { useGlobalUidContext } from "./context/uid";

import { firestore } from "./firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();
  const { setUid, setEmail, setImageUrl, setUserName } = useGlobalUidContext();
  // function to handle google signup
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    // Set prompt option to select_account
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);

    // Once the user is signed in, update the UID state with the user's UID
    setUid(result.user.uid);
    if (result.user.photoURL != null) {
      setImageUrl(result.user.photoURL);
    }
    setEmail(result.user.email);
    setUserName(result.user.displayName);

    // Fetch the document corresponding to the user's UID
    const userDocRef = collection(firestore, 'Users');
    const q = query(userDocRef, where('Uid', '==', result.user.uid));
    const userDocSnapshot = await getDocs(q);

    if (!userDocSnapshot.empty) {
      // Document exists, navigate to the landing page
      router.push('/components/landing');
    } else {
      // Document doesn't exist, navigate to the workspace page
      router.push('/components/workspace');
    }
  }

  return (
    <main className={styles.body}>
      <h1 className={styles.heading}>Locate</h1>
      <button className={styles.signupButton} onClick={googleSignIn}>
        <img src="google.png" className={styles.googleImageIcon} />
        Sign up with google
      </button>

    </main>
  );
}
