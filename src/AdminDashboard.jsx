import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./fbcfg";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // IMPORTANT:
  // This must be the EXACT name of your Firestore collection.
  const COLLECTION_NAME = "FashionSurveyResponses_100_Datasets";

  useEffect(() => {
    loadSurveyData();
  }, []);

  // ==============================
  // LOAD DATA FROM FIREBASE
  // ==============================
  async function loadSurveyData() {
    try {
      setLoading(true);
      setError("");

      const collectionRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(collectionRef);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Firebase data:", data);

      setSurveyData(data);
    } catch (err) {
      console.error("Error loading survey data:", err);

      setError(
        "Unable to load data from Firebase. Check your Firestore collection name and Firebase configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // FORMAT VALUES FOR DISPLAY
  // ==============================
  function formatValue(value) {
    if (value === undefined || value === null) {
      return "";
    }

    // Firestore array
    if (Array.isArray(value)) {
      return value.join(", ");
    }

    // Firestore timestamp
    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.toDate === "function"
    ) {
      return value.toDate().toLocaleString();
    }

    // Other objects
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  // ==============================
  // ESCAPE CSV VALUES
  // ==============================
  function escapeCSV(value) {
    const formatted = formatValue(value);

    return `"${formatted.replace(/"/g, '""')}"`;
  }

  // ==============================
  // DOWNLOAD CSV
  // ==============================
  function downloadCSV() {
    if (surveyData.length === 0) {
      alert("No survey data available.");
      return;
    }

    // Collect every field from every document
    const headerSet = new Set();

    surveyData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        headerSet.add(key);
      });
    });

    const headers = Array.from(headerSet);

    const csvRows = [];

    // Header row
    csvRows.push(
      headers.map((header) => escapeCSV(header)).join(",")
    );

    // Data rows
    surveyData.forEach((item) => {
      const row = headers.map((header) => {
        return escapeCSV(item[header]);
      });

      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "FashionSurveyResponses.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // ==============================
  // LOADING
  // ==============================
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Loading survey data...</h2>
      </div>
    );
  }

  // ==============================
  // ERROR
  // ==============================
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Something went wrong</h2>

        <p>{error}</p>

        <button onClick={loadSurveyData}>
          Try Again
        </button>
      </div>
    );
  }

  // ==============================
  // DASHBOARD
  // ==============================
  return (
    <div className="admin-container">

      {/* HEADER */}
      <div className="header">
        <div>
          <h1>Fashion Survey Dashboard</h1>
          <p>Customer survey responses and analytics</p>
        </div>

        <button
          onClick={downloadCSV}
          className="download-btn"
        >
          Download CSV
        </button>
      </div>

      {/* RESPONSE COUNT */}
      <div className="stats-card">
        <h3>Total Responses</h3>
        <h2>{surveyData.length}</h2>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table>

          <thead>
            <tr>
              <th>Name</th>
              <th>Age Group</th>
              <th>Gender</th>
              <th>Occupation</th>
              <th>City</th>
              <th>Shopping Mode</th>
              <th>Monthly Budget</th>
              <th>Favourite Categories</th>
              <th>Favourite Colours</th>
              <th>Favourite Brands</th>
            </tr>
          </thead>

          <tbody>

            {surveyData.length === 0 ? (

              <tr>
                <td colSpan="10">
                  No Responses Found
                </td>
              </tr>

            ) : (

              surveyData.map((item) => (

                <tr key={item.id}>

                  <td>
                    {formatValue(item.name)}
                  </td>

                  <td>
                    {formatValue(item.ageGroup)}
                  </td>

                  <td>
                    {formatValue(item.gender)}
                  </td>

                  <td>
                    {formatValue(item.occupation)}
                  </td>

                  <td>
                    {formatValue(item.city)}
                  </td>

                  <td>
                    {formatValue(item.shoppingMode)}
                  </td>

                  <td>
                    {formatValue(item.monthlyBudget)}
                  </td>

                  <td>
                    {formatValue(item.favoriteCategories)}
                  </td>

                  <td>
                    {formatValue(item.favoriteColors)}
                  </td>

                  <td>
                    {formatValue(item.favoriteBrands)}
                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}