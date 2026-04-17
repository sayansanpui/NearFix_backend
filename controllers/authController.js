import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered." });
        }

        const shouldStorePlainPassword =
            process.env.STORE_PLAINTEXT_PASSWORD === "true" ||
            process.env.STORE_PLAINTEXT_PASSWORD === "1";
        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
        };

        if (shouldStorePlainPassword) {
            userData.originalPassword = password;
        }

        const user = await User.create(userData);

        return res.status(201).json({
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Registration failed." });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        if (!process.env.JWT_SECRET) {
            console.error("Missing JWT_SECRET in .env");
            return res.status(500).json({ message: "Server misconfiguration." });
        }

        const token = jwt.sign(
            { userId: user._id.toString(), role: user.role },
            process.env.JWT_SECRET
        );

        return res.status(200).json({ token });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Login failed." });
    }
};
