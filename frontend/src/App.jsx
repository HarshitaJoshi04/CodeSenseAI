import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AuthPage from "./components/AuthPage";
import Dashboard from "./components/Dashboard";


function ProtectedRoute({ children }) {

  const token =
    localStorage.getItem("token");

  if (!token) {

    return (
      <Navigate
        to="/"
        replace
      />
    );

  }

  return children;

}


export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* =====================
            LOGIN / REGISTER
        ====================== */}

        <Route
          path="/"
          element={<AuthPage />}
        />


        {/* =====================
            DASHBOARD
        ====================== */}

        <Route
          path="/dashboard"
          element={

            <ProtectedRoute>

              <Dashboard />

            </ProtectedRoute>

          }
        />


        {/* =====================
            UNKNOWN URL
        ====================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>

  );

}