import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./fbcfg";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [surveyData, setSurveyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSurveyData();
  }, []);

  async function loadSurveyData() {
    try {
      const snapshot = await getDocs(collection(db, "FashionSurvey"));

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSurveyData(data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (surveyData.length === 0) {
      alert("No data found.");
      return;
    }

    const headers = Object.keys(surveyData[0]);

    const rows = surveyData.map((item) =>
      headers.map((header) => {
        const value = item[header];

        if (Array.isArray(value)) {
          return `"${value.join(", ")}"`;
        }

        if (typeof value === "object" && value !== null) {
          return `"${JSON.stringify(value)}"`;
        }

        return `"${value ?? ""}"`;
      }).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "FashionSurveyResponses.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  }

  return (
    <div className="admin-container">
      <div className="header">
        <h1>Fashion Survey Dashboard</h1>

        <button onClick={downloadCSV} className="download-btn">
          Download CSV
        </button>
      </div>

      <h3>Total Responses: {surveyData.length}</h3>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Occupation</th>
              <th>City</th>
              <th>Shopping Mode</th>
              <th>Budget</th>
              <th>Favourite Categories</th>
              <th>Favourite Colours</th>
              <th>Favourite Brands</th>
            </tr>
          </thead>

          <tbody>
            {surveyData.length === 0 ? (
              <tr>
                <td colSpan="10">No Responses Found</td>
              </tr>
            ) : (
              surveyData.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.ageGroup}</td>
                  <td>{item.gender}</td>
                  <td>{item.occupation}</td>
                  <td>{item.city}</td>
                  <td>{item.shoppingMode}</td>
                  <td>{item.monthlyBudget}</td>
                  <td>{item.favoriteCategories?.join(", ")}</td>
                  <td>{item.favoriteColors?.join(", ")}</td>
                  <td>{item.favoriteBrands?.join(", ")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}