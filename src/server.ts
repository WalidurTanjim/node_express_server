import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
     connectionString: process.env.CONNECTION_STRING
});

const initDB = async () => {
     const client = await pool.connect();

     try {
          await client.query("BEGIN");

          await client.query(`
               CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    age INT,
                    phone VARCHAR(15),
                    address TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
               )
          `);

          await client.query(`
               CREATE TABLE IF NOT EXISTS todos (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    completed BOOLEAN DEFAULT FALSE,
                    due_data Date,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
               )
          `);

          await client.query("COMMIT");

          console.log("Users table created successfully!");
     } catch (error) {
          await client.query("ROLLBACK");
          console.error("Database initialization failed:", error);
          throw error;
     } finally {
          client.release();
     }
};

// root api route
app.get('/', (req: Request, res: Response) => {
     res.send('Hello Next Level Web Developers!');
});

app.post("/", async (req: Request, res: Response) => {
     console.log("req body:", req?.body);

     res.status(201).json({
          success: true,
          message: "API is working..."
     })
})

const startServer = async () => {
     try {
          await initDB();

          app.listen(port, () => {
               console.log(`Server is running on port ${port}`);
          });
     } catch (error) {
          console.error("Server startup failed:", error);
          process.exit(1);
     }
};

startServer();
