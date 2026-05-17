import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const port = Number(process.env.PORT) || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

void startServer();
