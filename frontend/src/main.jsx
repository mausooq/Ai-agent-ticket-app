import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CheckAuth from "./components/Check-auth.jsx";
import Navbar from "./components/Navbar.jsx";
import "./index.css";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/LoginPage.jsx";
import Signup from "./pages/SignupPage.jsx";
import TicketDetailsPage from "./pages/TicketDetailPage.jsx";
import Tickets from "./pages/Tickets.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <CheckAuth protectedRoute={true}>
              <Tickets />
            </CheckAuth>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <CheckAuth protectedRoute={true}>
              <TicketDetailsPage />
            </CheckAuth>
          }
        />
        <Route
          path="/login"
          element={
            <CheckAuth protectedRoute={false}>
              <Login />
            </CheckAuth>
          }
        />
        <Route
          path="/signup"
          element={
            <CheckAuth protectedRoute={false}>
              <Signup />
            </CheckAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <CheckAuth protectedRoute={true}>
              <Admin />
            </CheckAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);