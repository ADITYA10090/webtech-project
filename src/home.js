// Home.js
import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import './styles2.css';

const Home = () => {
  const user = auth.currentUser;
  const navigate = useNavigate();

  // Reference to the entire surplusItems collection
  const surplusCollectionRef = collection(db, 'surplusItems');

  // Function to handle log out
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

  // Open the surplus modal
  const openModal = () => setModalOpen(true);

  // Close the modal and reset form
  const closeModal = () => {
    setModalOpen(false);
    setForm({ inventory: '', quantity: '', price: '' });
  };

  // Handle input changes in the form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission and add surplus data to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Save entry globally without user filtering
      await addDoc(surplusCollectionRef, form);
      closeModal(); // Modal closes after submit
    } catch (err) {
      console.error('Error adding document: ', err.message);
    }
  };

  // Handle delete all inventory (global deletion)
  const handleDeleteAll = async () => {
    try {
      // Loop through the current surplusData and delete each document
      for (const item of surplusData) {
        await deleteDoc(doc(db, 'surplusItems', item.id));
      }
    } catch (err) {
      console.error('Error deleting documents: ', err.message);
    }
  };

  // Use Firestore's onSnapshot to listen for real-time updates globally
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

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []); // Listener set up only once for the entire collection

  return (
    <div className="container">
      <div className="header">
        <h1>Welcome, {user && (user.displayName || user.email)}!</h1>
        <h2>Welcome To Collaboratory!</h2>
        <div className="header-buttons">
          <button onClick={handleLogout} className="btn logout-btn">
            Log Out
          </button>
        </div>
      </div>

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

      {/* Display surplus data in cards */}
      {surplusData.length > 0 && (
        <div className="card-container">
          {surplusData.map((item) => (
            <div key={item.id} className="card">
              <h3>{item.inventory}</h3>
              <p>
                <strong>Quantity:</strong> {item.quantity}
              </p>
              <p>
                <strong>Price:</strong> ${item.price}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
