import Worker from "../models/Worker.js";

function getDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(a));
}

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

        const { lat, lng } = req.query;
        const hasLat = lat !== undefined;
        const hasLng = lng !== undefined;

        if (!hasLat && !hasLng) {
            return res.status(200).json(workers);
        }

        if (hasLat !== hasLng) {
            return res.status(400).json({
                message: "Both lat and lng query params are required for distance sorting.",
            });
        }

        const userLat = Number(lat);
        const userLng = Number(lng);

        if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
            return res.status(400).json({
                message: "lat and lng must be valid numbers.",
            });
        }

        const workersWithDistance = workers
            .map((worker) => {
                const workerObj = worker.toObject();
                const workerLat = workerObj.location?.lat;
                const workerLng = workerObj.location?.lng;

                if (!Number.isFinite(workerLat) || !Number.isFinite(workerLng)) {
                    return {
                        ...workerObj,
                        distance: null,
                    };
                }

                return {
                    ...workerObj,
                    distance: getDistance(userLat, userLng, workerLat, workerLng),
                };
            })
            .sort((a, b) => {
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });

        return res.status(200).json(workersWithDistance);
    } catch (error) {
        console.error("Get all workers error:", error);
        return res.status(500).json({ message: "Failed to fetch workers." });
    }
};

export const getMyWorkerProfile = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== "worker") {
            return res.status(403).json({ message: "Only workers can view their profile." });
        }

        const worker = await Worker.findOne({ userId: req.user.userId });
        if (!worker) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        return res.status(200).json(worker);
    } catch (error) {
        console.error("Get my worker profile error:", error);
        return res.status(500).json({ message: "Failed to fetch worker profile." });
    }
};

export const updateMyWorkerProfile = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== "worker") {
            return res.status(403).json({ message: "Only workers can update their profile." });
        }

        const worker = await Worker.findOne({ userId: req.user.userId });
        if (!worker) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        const payload = req.body || {};
        const allowedFields = new Set(["name", "skill", "price", "location", "image"]);
        const invalidFields = Object.keys(payload).filter((key) => !allowedFields.has(key));

        if (invalidFields.length > 0) {
            return res.status(400).json({
                message: `Unsupported fields: ${invalidFields.join(", ")}. Allowed fields: name, skill, price, location, image.`,
            });
        }

        const { name, skill, price, location, image } = payload;

        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) {
                return res.status(400).json({ message: "name must be a non-empty string." });
            }
            worker.name = name.trim();
        }

        if (skill !== undefined) {
            if (typeof skill !== "string" || !skill.trim()) {
                return res.status(400).json({ message: "skill must be a non-empty string." });
            }
            worker.skill = skill.trim();
        }

        if (price !== undefined) {
            if (typeof price !== "number" || !Number.isFinite(price)) {
                return res.status(400).json({ message: "price must be a valid number." });
            }
            worker.price = price;
        }

        if (location !== undefined) {
            if (!location || typeof location !== "object" || Array.isArray(location)) {
                return res.status(400).json({ message: "location must be an object." });
            }

            const allowedLocationFields = new Set(["lat", "lng"]);
            const invalidLocationFields = Object.keys(location).filter((key) => !allowedLocationFields.has(key));
            if (invalidLocationFields.length > 0) {
                return res.status(400).json({
                    message: `Unsupported location fields: ${invalidLocationFields.join(", ")}. Allowed fields: lat, lng.`,
                });
            }

            if (location.lat !== undefined) {
                if (typeof location.lat !== "number" || !Number.isFinite(location.lat)) {
                    return res.status(400).json({ message: "location.lat must be a valid number." });
                }
                worker.location.lat = location.lat;
            }

            if (location.lng !== undefined) {
                if (typeof location.lng !== "number" || !Number.isFinite(location.lng)) {
                    return res.status(400).json({ message: "location.lng must be a valid number." });
                }
                worker.location.lng = location.lng;
            }
        }

        if (image !== undefined) {
            if (typeof image !== "string" || !image.trim()) {
                return res.status(400).json({ message: "image must be a non-empty string." });
            }
            worker.image = image.trim();
        }

        await worker.save();

        return res.status(200).json({
            message: "Worker profile updated successfully.",
            worker,
        });
    } catch (error) {
        console.error("Update my worker profile error:", error);
        return res.status(500).json({ message: "Failed to update worker profile." });
    }
};

export const deleteMyWorkerProfile = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== "worker") {
            return res.status(403).json({ message: "Only workers can delete their profile." });
        }

        const deletedWorker = await Worker.findOneAndDelete({ userId: req.user.userId });
        if (!deletedWorker) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        return res.status(200).json({ message: "Worker profile deleted successfully." });
    } catch (error) {
        console.error("Delete my worker profile error:", error);
        return res.status(500).json({ message: "Failed to delete worker profile." });
    }
};

export const updateAvailability = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== "worker") {
            return res.status(403).json({ message: "Only workers can update availability." });
        }

        const { availability } = req.body || {};
        if (typeof availability !== "boolean") {
            return res.status(400).json({ message: "availability must be true or false." });
        }

        const worker = await Worker.findOneAndUpdate(
            { userId: req.user.userId },
            { availability },
            { new: true }
        );

        if (!worker) {
            return res.status(404).json({ message: "Worker profile not found." });
        }

        return res.status(200).json({
            message: "Availability updated successfully.",
            worker,
        });
    } catch (error) {
        console.error("Update availability error:", error);
        return res.status(500).json({ message: "Failed to update availability." });
    }
};
