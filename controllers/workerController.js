import Worker from "../models/Worker.js";

export const createWorker = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== "worker") {
            return res.status(403).json({ message: "Only workers can create a worker profile." });
        }

        const { name, skill, price, location, image } = req.body;
        const lat = location?.lat;
        const lng = location?.lng;

        if (!name || !skill || price === undefined || !image || lat === undefined || lng === undefined) {
            return res.status(400).json({
                message: "Name, skill, price, location (lat/lng), and image are required.",
            });
        }

        const worker = await Worker.create({
            userId: req.user.userId,
            name,
            skill,
            price,
            location: { lat, lng },
            image,
        });

        return res.status(201).json(worker);
    } catch (error) {
        console.error("Create worker error:", error);
        return res.status(500).json({ message: "Failed to create worker." });
    }
};

export const getAllWorkers = async (req, res) => {
    try {
        const workers = await Worker.find();
        return res.status(200).json(workers);
    } catch (error) {
        console.error("Get all workers error:", error);
        return res.status(500).json({ message: "Failed to fetch workers." });
    }
};
