import cors from "cors";
import express from "express";
import productRoutes from "./routes/product.routes";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/notFound.middleware";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*"
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy"
  });
});

app.use("/api/products", productRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
