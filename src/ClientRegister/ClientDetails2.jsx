import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

// ✅ Firebase init must already be done in your project
// import { auth, db } from "../firebase/Firebase"; ❌
// Using modular directly 👇

export default function SiteDetailsScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Client data from previous screen
  const clientData = location.state?.clientData || {};

  const auth = getAuth();
  const db = getFirestore();

  const [loading, setLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const [website, setWebsite] = useState("");
  const [locationText, setLocationText] = useState("");
  const [linkedin, setLinkedin] = useState("");

  /* ================= DROPDOWN DATA ================= */

  const categories = [
    "Graphics & Design",
    "Programming & Tech",
    "Digital Marketing",
    "Writing & Translation",
    "Video & Animation",
    "Music & Audio",
    "AI Services",
    "Data",
    "Business",
    "Finance",
    "Photography",
    "Lifestyle",
    "Consulting",
    "Personal Growth & Hobbies",
  ];

  const sourceOptions = [
    "Google",
    "Social Media",
    "Referral",
    "LinkedIn",
    "Other",
  ];

  /* ================= SAVE CLIENT DATA ================= */

  const saveClientData = async () => {
    if (!selectedCategory || !selectedSource) {
      alert("Please fill all dropdown fields");
      return;
    }

    if (!locationText.trim()) {
      alert("Please enter your location");
      return;
    }

    if (
      !linkedin ||
      !/^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/.test(linkedin)
    ) {
      alert("Please enter a valid LinkedIn URL");
      return;
    }

    try {
      setLoading(true);

      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error("User not logged in");

      const finalData = {
        ...clientData,
        userId: uid,
        role: "client",
        category: selectedCategory,
        website: website.trim(),
        location: locationText.trim(),
        linkedin: linkedin.trim(),
        source: selectedSource,
        created_at: serverTimestamp(),
      };

      await setDoc(doc(db, "users", uid), finalData, { merge: true });

      alert("Client profile saved successfully!");

      navigate("/client-main", {
        replace: true,
        state: { userData: finalData, uid },
      });
    } catch (err) {
      alert("Error saving data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          ←
        </button>
        <span style={styles.headerText}>Sign up as Client</span>
      </div>

      <h3 style={styles.title}>
        Set Up Your Profile For Your Workspace
      </h3>

      {/* CATEGORY */}
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={styles.input}
      >
        <option value="">Select your need category</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* WEBSITE */}
      <div style={styles.websiteBox}>
        <span style={{ opacity: 0.6 }}>www.</span>
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="company.com"
          style={styles.websiteInput}
        />
      </div>

      {/* LOCATION */}
      <input
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        placeholder="Where are you located?"
        style={styles.input}
      />

      {/* LINKEDIN */}
      <input
        value={linkedin}
        onChange={(e) => setLinkedin(e.target.value)}
        placeholder="https://www.linkedin.com/in/username"
        style={styles.input}
      />

      {/* SOURCE */}
      <select
        value={selectedSource}
        onChange={(e) => setSelectedSource(e.target.value)}
        style={styles.input}
      >
        <option value="">How did you hear about us?</option>
        {sourceOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* BUTTON */}
      <button
        onClick={saveClientData}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Saving..." : "CONTINUE"}
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    padding: 20,
    fontFamily: "Rubik, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 13,
  },
  title: {
    textAlign: "center",
    margin: "30px 0",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 20,
    border: "1px solid #ddd",
    marginBottom: 16,
    fontSize: 14,
  },
  websiteBox: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #ddd",
    borderRadius: 20,
    padding: "0 16px",
    marginBottom: 16,
  },
  websiteInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "14px 6px",
    fontSize: 14,
  },
  button: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    background: "#FDFD96",
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
};
