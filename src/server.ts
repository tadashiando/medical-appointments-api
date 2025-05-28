import express from "express";
import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";
import routes from "./routes";

dotenv.config();
const app = express();

app.use(express.json());

app.use("/api/v1", routes);

// MongoDB connection
mongoose
  .connect(
    process.env.MONGO_URI as string,
    {
      dbName: process.env.DB_NAME,
    } as ConnectOptions
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
