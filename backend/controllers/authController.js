import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/Users.js";

import Repository from "../models/Repository.js";

// Helper to create JWTs — centralizes secret check so missing JWT_SECRET fails fast with a clear error
const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Throwing here is caught by the surrounding try/catch and returns a 500 with a clear server-side message
    throw new Error("JWT_SECRET not configured");
  }
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};
// ===============================
// REGISTER
// ===============================

export const register = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
        });

        const token = createToken(user._id);

        res.status(201).json({
            success: true,
            message: "Registration successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {

        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed",
        });
    }
};


// ===============================
// LOGIN
// ===============================

export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = createToken(user._id);

        res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Login failed",
        });
    }
};


export const getUsage = async (req, res) => {
  try {
    if (!req.userId || !req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const repositoryCount = await Repository.countDocuments({
      userId: req.userId,
    });

    return res.json({
      success: true,
      usage: {
        // Active repositories is the authoritative usage metric
        analysesUsed: repositoryCount,
        analysesLimit: req.user.limits.maxRepositories,
      },
    });

  } catch (error) {
    console.error("GET USAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get usage",
    });
  }
};