// Auth.js
import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import './styles.css';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  GithubAuthProvider
} from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!username) {
      setError("Username is required");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long and include letters, numbers, and special symbols");
      return;
    }
    try {
      const usernameRef = ref(db, "usernames/" + username);
      const snapshot = await get(usernameRef);
      if (snapshot.exists()) {
        setError("Username already taken");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      await set(usernameRef, { uid: userCredential.user.uid });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <div className="card auth-card">
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        {isSignUp && (
          <>
            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
            />
            <input
              type="text"
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
          </>
        )}
        <div className="button-container">
          {isSignUp ? (
            <button onClick={handleSignup} className="primary-button">
              Create Account
            </button>
          ) : (
            <button onClick={handleSignin} className="primary-button">
              Sign In
            </button>
          )}
        </div>
        <div className="button-container social-container">
          <button onClick={signInWithGoogle} className="social-button">
            <img
              src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp?s96"
              alt="Google"
            />
            Sign In with Google
          </button>
          <button onClick={signInWithGithub} className="social-button">
            <img
              src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
              alt="GitHub"
            />
            Sign In with GitHub
          </button>
        </div>
        <div className="alternate">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span
              onClick={() => {
                setError('');
                setIsSignUp(!isSignUp);
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
