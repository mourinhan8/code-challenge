# Crude Server

Crude Server is a RESTful CRUD backend for managing products. It uses ExpressJS with TypeScript, MongoDB for persistence, and Mongoose for data modeling.

## Tech Stack

- Node.js
- ExpressJS
- TypeScript
- TypeScript Native Preview (`@typescript/native-preview@beta`) with `tsgo`
- MongoDB
- Mongoose
- dotenv
- cors
- tsx for development

## Prerequisites

- Node.js 20 or newer
- npm
- A running MongoDB instance, either local or hosted

## Installation

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env
```

Update `.env` with your MongoDB connection string.

## Environment Variables

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/crude_server
CORS_ORIGIN=*
```

## MongoDB Connection Setup

For a local MongoDB server, use:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/crude_server
```

For MongoDB Atlas, use a connection string like:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/crude_server?retryWrites=true&w=majority
```

Make sure the database user has read and write permissions, and that your IP address is allowed in the MongoDB Atlas network access settings.

## Run in Development

```bash
npm run dev
```

The development script uses `tsx watch src/server.ts`.

## Build with tsgo

```bash
npm run build
```

The build script runs:

```bash
tsgo -p tsconfig.json
```

`tsgo` comes from `@typescript/native-preview@beta`. It is the Go-based TypeScript compiler preview and is used here to speed up TypeScript compilation compared with the regular TypeScript compiler in larger projects.

## Build with Fallback tsc

```bash
npm run build:tsc
```

This runs:

```bash
tsc -p tsconfig.json
```

The regular `typescript` package is kept as a dev dependency for ecosystem compatibility and as a reliable fallback.

## Run in Production

Build first, then start the compiled server:

```bash
npm run build
npm start
```

The production start script runs `node dist/server.js`.

## Response Format

Successful responses use:

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Product not found"
}
```

## API Documentation

Base URL:

```text
http://localhost:5000
```

### Health Check

```http
GET /health
```

Example response:

```json
{
  "success": true,
  "message": "Server is healthy"
}
```

### Create Product

```http
POST /api/products
Content-Type: application/json
```

Example request body:

```json
{
  "name": "Mechanical Keyboard",
  "description": "A compact keyboard with tactile switches",
  "price": 129.99,
  "category": "Electronics",
  "inStock": true
}
```

Example response:

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "665f6f806a5c0b56a03f51b1",
    "name": "Mechanical Keyboard",
    "description": "A compact keyboard with tactile switches",
    "price": 129.99,
    "category": "Electronics",
    "inStock": true,
    "createdAt": "2026-05-17T09:00:00.000Z",
    "updatedAt": "2026-05-17T09:00:00.000Z"
  }
}
```

### List Products

```http
GET /api/products
```

Supported query parameters:

- `category`: filter by exact category
- `inStock`: `true` or `false`
- `minPrice`: minimum product price
- `maxPrice`: maximum product price
- `search`: case-insensitive search by product name
- `page`: page number, defaults to `1`
- `limit`: page size, defaults to `10`, maximum `100`

Example:

```http
GET /api/products?category=Electronics&inStock=true&minPrice=50&maxPrice=200&search=keyboard&page=1&limit=10
```

Example response:

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "_id": "665f6f806a5c0b56a03f51b1",
      "name": "Mechanical Keyboard",
      "description": "A compact keyboard with tactile switches",
      "price": 129.99,
      "category": "Electronics",
      "inStock": true,
      "createdAt": "2026-05-17T09:00:00.000Z",
      "updatedAt": "2026-05-17T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Product Details

```http
GET /api/products/:id
```

Example:

```http
GET /api/products/665f6f806a5c0b56a03f51b1
```

Example response:

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "_id": "665f6f806a5c0b56a03f51b1",
    "name": "Mechanical Keyboard",
    "description": "A compact keyboard with tactile switches",
    "price": 129.99,
    "category": "Electronics",
    "inStock": true,
    "createdAt": "2026-05-17T09:00:00.000Z",
    "updatedAt": "2026-05-17T09:00:00.000Z"
  }
}
```

Invalid MongoDB ObjectIds return `400`. Missing products return `404`.

### Update Product

```http
PUT /api/products/:id
Content-Type: application/json
```

Example request body:

```json
{
  "price": 119.99,
  "inStock": false
}
```

Example response:

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "665f6f806a5c0b56a03f51b1",
    "name": "Mechanical Keyboard",
    "description": "A compact keyboard with tactile switches",
    "price": 119.99,
    "category": "Electronics",
    "inStock": false,
    "createdAt": "2026-05-17T09:00:00.000Z",
    "updatedAt": "2026-05-17T09:30:00.000Z"
  }
}
```

### Delete Product

```http
DELETE /api/products/:id
```

Example:

```http
DELETE /api/products/665f6f806a5c0b56a03f51b1
```

Example response:

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "_id": "665f6f806a5c0b56a03f51b1",
    "name": "Mechanical Keyboard",
    "description": "A compact keyboard with tactile switches",
    "price": 119.99,
    "category": "Electronics",
    "inStock": false,
    "createdAt": "2026-05-17T09:00:00.000Z",
    "updatedAt": "2026-05-17T09:30:00.000Z"
  }
}
```

## Product Model

```ts
{
  name: string;
  description?: string;
  price: number;
  category?: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

`createdAt` and `updatedAt` are managed automatically through Mongoose timestamps.
