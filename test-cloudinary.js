import "dotenv/config";
import cloudinary from "./config/cloudinary.js";

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Missing Cloudinary env vars in .env");
  process.exit(1);
}

cloudinary.api
  .ping()
  .then((result) => {
    if (result && result.status === "ok") {
      console.log("Cloudinary Connected");
      process.exit(0);
    }

    console.log("Cloudinary ping returned:", result);
    process.exit(1);
  })
  .catch((err) => {
    console.error("Cloudinary error:", err);
    process.exit(1);
  });
