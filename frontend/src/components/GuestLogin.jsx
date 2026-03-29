// frontend/src/components/GuestLogin.jsx
import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";

export default function GuestLogin({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [appliances, setAppliances] = useState([]);
  const [newAppliance, setNewAppliance] = useState("");

  useEffect(() => {
    const savedId = localStorage.getItem("guest_id");
    const savedName = localStorage.getItem("guest_name");

    if (savedId && savedName) {
      setUserId(savedId);
      setName(savedName);

      const savedAppliances = JSON.parse(localStorage.getItem(savedId)) || [];
      setAppliances(savedAppliances);
    }
  }, []);

  const handleLogin = () => {
    const id = userId || "user_" + Math.floor(Math.random() * 100000);

    setUserId(id);
    localStorage.setItem("guest_id", id);
    localStorage.setItem("guest_name", name);
    localStorage.setItem(id, JSON.stringify(appliances));

    onLogin();
  };

  const addAppliance = () => {
    if (!newAppliance.trim()) return;

    const updated = [...appliances, newAppliance.trim()];
    setAppliances(updated);
    localStorage.setItem(userId, JSON.stringify(updated));
    setNewAppliance("");
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserId("");
    setName("");
    setAppliances([]);
    setNewAppliance("");
    if (onLogin) {
      onLogin();
    }
    window.location.reload();
  };

  return (
    <div style={{ ...styles.page, position: "relative" }}>
      <div style={styles.card}>
        {!userId ? (
          <>
            <img
              src={logo}
              alt="SaveMyEnergy logo"
              style={{
                position: "absolute",
                top: "10px",
                left: "20px", // change to "right: 20px" if needed
                width: 100,
                height: 100,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />

            <h1 style={styles.title}>SaveMyEnergy</h1>
            <p style={styles.subtitle}>
              Real-time energy savings for low-income households
            </p>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your Household ID"
              style={styles.input}
            />

            <button onClick={handleLogin} style={styles.button}>
              Login
            </button>
          </>
        ) : (
          <>
            <button style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>

            <h1 style={styles.title}>Welcome, {name}!</h1>
            <p style={styles.subtitle}>
              Add your appliances for more personalised advice, or continue now
            </p>

            <div style={styles.applianceListBox}>
              <p style={styles.sectionTitle}>Your appliances</p>
              {appliances.length > 0 ? (
                <ul style={styles.list}>
                  {appliances.map((a, i) => (
                    <li key={i} style={styles.listItem}>
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={styles.emptyText}>No appliances added yet</p>
              )}
            </div>

            <input
              value={newAppliance}
              onChange={(e) => setNewAppliance(e.target.value)}
              placeholder="Add new appliance"
              style={styles.input}
            />

            <button onClick={addAppliance} style={styles.secondaryButton}>
              Add Appliance
            </button>

            <button onClick={onLogin} style={styles.button}>
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    position: "relative",
  },
  logoutButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
    fontWeight: "600",
  },
  title: {
    marginBottom: "10px",
    fontSize: "32px",
    color: "#111827",
  },
  subtitle: {
    fontSize: "15px",
    color: "#64748b",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "8px",
  },
  secondaryButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#e5e7eb",
    color: "#111827",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "10px",
  },
  applianceListBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#374151",
    marginBottom: "10px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    marginBottom: "6px",
    color: "#111827",
  },
  emptyText: {
    color: "#6b7280",
    margin: 0,
  },
};
