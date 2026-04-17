import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({ message: "Authorization token missing." });
    }

    if (!process.env.JWT_SECRET) {
        console.error("Missing JWT_SECRET in .env");
        return res.status(500).json({ message: "Server misconfiguration." });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
};

const authorizeRoles = (...roles) => (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ message: "Forbidden." });
    }

    return next();
};

export { authorizeRoles };
export default auth;
