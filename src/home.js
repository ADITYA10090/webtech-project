// Home.js
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc, getDoc, setDoc 
} from 'firebase/firestore';
import './styles2.css';

const Home = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();

  // Reference to the surplusItems collection
  const surplusCollectionRef = collection(db, 'surplusItems');

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error(err.message);
    }
  };

  // State for surplus functionality
  const [modalOpen, setModalOpen] = useState(false);
  const [surplusData, setSurplusData] = useState([]);
  const [form, setForm] = useState({
    inventory: '',
    quantity: '',
    price: '',
  });

  // State for search query
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar state for profile editing
  // Default profile: username from auth and empty contact/upi initially.
  const [profile, setProfile] = useState({
    username: user?.displayName || user?.email || '',
    contact: '',
    upi: '',
  });
  const [editing, setEditing] = useState({
    username: false,
    contact: false,
    upi: false,
  });
  const [profileForm, setProfileForm] = useState(profile);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load user profile from Firestore on mount (if exists)
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            setProfileForm(data);
          }
        } catch (error) {
          console.error('Error loading user profile:', error.message);
        }
      }
    };
    loadUserProfile();
  }, [user]);

  // Open surplus modal
  const openModal = () => setModalOpen(true);

  // Close modal and reset form
  const closeModal = () => {
    setModalOpen(false);
    setForm({ inventory: '', quantity: '', price: '' });
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle profile form changes
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  // Toggle editing for a specific field
  const toggleEditing = (field) => {
    setEditing({ ...editing, [field]: !editing[field] });
    if (editing[field]) {
      // If canceling edit, reset the form field to the current profile value
      setProfileForm({ ...profileForm, [field]: profile[field] });
    }
  };

  // Save the edited profile field to Firestore and update state
  const saveProfileField = async (field) => {
    const newProfile = { ...profile, [field]: profileForm[field] };
    try {
      await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
      setProfile(newProfile);
    } catch (error) {
      console.error('Error saving profile field:', error.message);
    }
    setEditing({ ...editing, [field]: false });
  };

  // Handle surplus form changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle search query changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Delete a specific surplus item
  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'surplusItems', id));
    } catch (err) {
      console.error('Error deleting document: ', err.message);
    }
  };

  // Handle submission of surplus item
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure that username and contact are set
    if (!profile.username || !profile.contact) {
      alert('Please fill your username and contact first in the sidebar.');
      return;
    }

    try {
      await addDoc(surplusCollectionRef, {
        ...form,
        userId: user.uid,
        username: profile.username,
        contact: profile.contact,
        upi: profile.upi,
      });
      closeModal();
    } catch (err) {
      console.error('Error adding document: ', err.message);
    }
  };

  // Delete all surplus items (global deletion)
  const handleDeleteAll = async () => {
    try {
      for (const item of surplusData) {
        await deleteDoc(doc(db, 'surplusItems', item.id));
      }
    } catch (err) {
      console.error('Error deleting documents: ', err.message);
    }
  };

  // Listen for real-time updates in the surplusItems collection
  useEffect(() => {
    const unsubscribe = onSnapshot(
      surplusCollectionRef,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSurplusData(items);
      },
      (error) => {
        console.error('Error fetching documents: ', error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter surplus items based on the search query (case-insensitive)
  const filteredSurplusData = surplusData.filter((item) =>
    item.inventory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search Inventory..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Hamburger Button */}
      <button className="hamburger-btn" onClick={toggleSidebar}>
        &#9776;
      </button>

      {/* Sidebar for Profile Editing */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <h2>Profile</h2>
        <div className="profile-field">
          <label>Username:</label>
          {editing.username ? (
            <>
              <input
                type="text"
                name="username"
                value={profileForm.username}
                onChange={handleProfileChange}
              />
              <button onClick={() => saveProfileField('username')}>Save</button>
              <button onClick={() => toggleEditing('username')}>Cancel</button>
            </>
          ) : (
            <>
              <span>{profile.username}</span>
              <button onClick={() => toggleEditing('username')}>Edit</button>
            </>
          )}
        </div>
        <div className="profile-field">
          <label>Contact:</label>
          {editing.contact ? (
            <>
              <input
                type="text"
                name="contact"
                value={profileForm.contact}
                onChange={handleProfileChange}
              />
              <button onClick={() => saveProfileField('contact')}>Save</button>
              <button onClick={() => toggleEditing('contact')}>Cancel</button>
            </>
          ) : (
            <>
              <span>{profile.contact}</span>
              <button onClick={() => toggleEditing('contact')}>Edit</button>
            </>
          )}
        </div>
        <div className="profile-field">
          <label>UPI ID:</label>
          {editing.upi ? (
            <>
              <input
                type="text"
                name="upi"
                value={profileForm.upi}
                onChange={handleProfileChange}
              />
              <button onClick={() => saveProfileField('upi')}>Save</button>
              <button onClick={() => toggleEditing('upi')}>Cancel</button>
            </>
          ) : (
            <>
              <span>{profile.upi}</span>
              <button onClick={() => toggleEditing('upi')}>Edit</button>
            </>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <h1>Welcome, {user && (user.displayName || user.email)}!</h1>
        <div className="header-buttons">
          <button onClick={handleLogout} className="btn logout-btn">
            Log Out
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button onClick={openModal} className="btn surplus-btn">
          Add Inventory
        </button>
        <button onClick={handleDeleteAll} className="btn delete-all-btn">
          Delete All
        </button>
      </div>

      {/* Surplus Modal */}
      {modalOpen && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Surplus Item</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Inventory</label>
                <input
                  type="text"
                  name="inventory"
                  value={form.inventory}
                  onChange={handleChange}
                  required
                  placeholder="Item name"
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  placeholder="Quantity"
                />
              </div>
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  placeholder="Price"
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn submit-btn">
                  Submit
                </button>
                <button type="button" onClick={closeModal} className="btn cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Display Filtered Surplus Data */}
      {filteredSurplusData.length > 0 && (
        <div className="card-container">
          {filteredSurplusData.map((item) => (
            <div key={item.id} className="card">
              <h3>{item.inventory}</h3>
              <p>
                <strong>Quantity:</strong> {item.quantity}
              </p>
              <p>
                <strong>Price:</strong> ${item.price}
              </p>
              <p>
                <strong>User ID:</strong> {item.userId}
              </p>
              <p>
                <strong>Username:</strong> {item.username}
              </p>
              <p>
                <strong>Contact:</strong> {item.contact}
              </p>
              <p>
                <strong>UPI ID:</strong> {item.upi}
              </p>
              {item.userId === user.uid && (
                <button onClick={() => handleDeleteItem(item.id)} className="btn delete-btn">
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
