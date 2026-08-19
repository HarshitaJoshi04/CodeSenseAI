import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  loginUser,
  registerUser,
} from "../api";

export default function AuthPage() {

  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      let data;

      // =========================
      // LOGIN
      // =========================

      if (mode === "login") {

        data = await loginUser(
          email,
          password
        );

      }

      // =========================
      // REGISTER
      // =========================

      else {

        data = await registerUser(
          name,
          email,
          password
        );

      }

      console.log(
        "AUTH RESPONSE:",
        data
      );

      // =========================
      // CHECK RESPONSE
      // =========================

      if (!data?.success) {

        throw new Error(
          data?.message ||
          "Authentication failed"
        );

      }

      // =========================
      // SAVE JWT
      // =========================

      if (data.token) {

        localStorage.setItem(
          "token",
          data.token
        );

      }

      // =========================
      // SAVE USER
      // =========================

      if (data.user) {

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

      }

      // =========================
      // GO TO DASHBOARD
      // =========================

      navigate("/dashboard");

    } catch (err) {

      console.error(
        "Authentication error:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Something went wrong"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-sky-50 to-blue-50 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* =========================
            LOGO
        ========================== */}

        <div className="mb-8 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-500 to-sky-500 text-3xl text-white shadow-lg">

            💧

          </div>

          <h1 className="text-3xl font-bold text-cyan-950">

            CodeSense AI

          </h1>

          <p className="mt-2 text-sm text-sky-700">

            Understand your code with AI

          </p>

        </div>


        {/* =========================
            AUTH CARD
        ========================== */}

        <div className="rounded-2xl border border-cyan-200 bg-white p-6 shadow-xl shadow-cyan-100/70">

          {/* =========================
              LOGIN / REGISTER TABS
          ========================== */}

          <div className="mb-6 grid grid-cols-2 rounded-xl bg-cyan-50 p-1">

            <button
              type="button"
              onClick={() => {

                setMode("login");
                setError("");

              }}
              className={`rounded-lg py-2.5 text-sm font-bold transition ${
                mode === "login"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-cyan-500"
              }`}
            >

              Login

            </button>


            <button
              type="button"
              onClick={() => {

                setMode("register");
                setError("");

              }}
              className={`rounded-lg py-2.5 text-sm font-bold transition ${
                mode === "register"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-cyan-500"
              }`}
            >

              Register

            </button>

          </div>


          {/* =========================
              FORM
          ========================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* NAME */}

            {mode === "register" && (

              <div>

                <label className="mb-2 block text-sm font-bold text-cyan-800">

                  Name

                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  disabled={loading}
                  placeholder="Your name"
                  className="w-full rounded-xl border-2 border-cyan-100 bg-cyan-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:opacity-60"
                />

              </div>

            )}


            {/* EMAIL */}

            <div>

              <label className="mb-2 block text-sm font-bold text-cyan-800">

                Email

              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                disabled={loading}
                placeholder="you@example.com"
                className="w-full rounded-xl border-2 border-cyan-100 bg-cyan-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:opacity-60"
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label className="mb-2 block text-sm font-bold text-cyan-800">

                Password

              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                minLength={6}
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-cyan-100 bg-cyan-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:opacity-60"
              />

            </div>


            {/* =========================
                ERROR
            ========================== */}

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">

                ⚠ {error}

              </div>

            )}


            {/* =========================
                SUBMIT
            ========================== */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-b from-cyan-500 to-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-200 transition hover:from-cyan-600 hover:to-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Login"
                : "Create Account"}

            </button>

          </form>


          {/* =========================
              SWITCH
          ========================== */}

          <p className="mt-6 text-center text-xs text-sky-600">

            {mode === "login"
              ? "Don't have an account?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {

                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                );

                setError("");

              }}
              className="ml-1 font-bold text-cyan-700 hover:underline"
            >

              {mode === "login"
                ? "Register"
                : "Login"}

            </button>

          </p>

        </div>

      </div>

    </div>

  );
}