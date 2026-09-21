import { BrowserRouter, Routes, Route } from "react-router-dom";
import SurveyPage from "./surveypg";
import AdminDashboard from "./AdminDashboard";
import Analytics from "./Analytics";
import AdminGate from "./AdminGate";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SurveyPage />} />
        <Route
          path="/admin"
          element={
            <AdminGate password="shreyan2016">
              <Analytics />
            </AdminGate>
          }
        />
        <Route path="/Analytics" element={Analytics} />
      </Routes>
    </BrowserRouter>
  );
}