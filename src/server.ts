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
                    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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


// users api routes
app.post("/users", async (req: Request, res: Response) => {
     const { name, email } = req?.body;

     try{
          const result = await pool.query(`INSERT INTO users(name, email) VALUES($1, $2) RETURNING *`, [name, email]);
          // console.log(result);

          res.status(201).json({
               success: true,
               message: "Data inserted successfully",
               data: result?.rows[0]
          });
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
})

app.get("/users", async(req: Request, res: Response) => {
     try{
          const result = await pool.query(`SELECT * FROM users`);
          
          if(result?.rows?.length > 0){
               res.status(200).json({
                    success: true,
                    message: "Users retrived successfully",
                    data: result?.rows
               })
          }else {
               res.status(200).json({
                    success: true,
                    message: "User not found!",
                    data: result?.rows
               })
          }
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
})

app.get("/users/:id", async(req: Request, res: Response) => {
     try{
          const result = await pool.query(`SELECT * FROM users WHERE id=$1`, [req?.params?.id]);
          
          if(result?.rows?.length > 0) {
               res.status(200).json({
                    success: true,
                    message: "User retrived successfully",
                    data: result?.rows[0]
               })
          }else {
               res.status(200).json({
                    success: true,
                    message: "User not found!",
                    data: result?.rows
               })
          }
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
})

app.put("/users/:id", async(req: Request, res: Response) => {
     const { name, email } = req?.body;

     try{
          const result = await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`, [name, email, req?.params?.id]);
          
          if(result?.rows?.length > 0) {
               res.status(201).json({
                    success: true,
                    message: "User updated successfully",
                    data: result?.rows[0]
               })
          }else {
               res.status(500).json({
                    success: false,
                    message: "User not found!",
                    data: result?.rows
               })
          }
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
})

app.delete("/users/:id", async(req: Request, res: Response) => {
     try{
          const result = await pool.query(`DELETE FROM users WHERE id=$1`, [req?.params?.id]);
          
          if(result?.rowCount === 0) {
               res.status(500).json({
                    success: false,
                    message: "User not found!"
               })
          }else {
               res.status(204).json({
                    success: true,
                    message: "User deleted successfully"
               })
          }
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
})


// todos api routes
app.post("/todos", async(req: Request, res: Response) => {
     const { user_id, title } = req?.body;

     try{
          const result = await pool.query(`INSERT INTO todos(user_id, title) VALUES($1, $2) RETURNING *`, [user_id, title]);
          // console.log("Post todo:", result);

          if(result?.rows.length > 0) {
               res.status(201).json({
                    success: true,
                    message: "Todo inserted successfully",
                    data: result?.rows
               })
          }else {
               res.status(500).json({
                    success: false,
                    message: "Failed to insert!",
                    data: result?.rows
               })
          }
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
});

app.get("/todos", async(req: Request, res: Response) => {
     try{
          const result = await pool.query(`SELECT * FROM todos`);

          if(result?.rows.length > 0) {
               res.status(200).json({
                    success: true, 
                    message: "Todos retrived successfully",
                    data: result?.rows
               })
          }else {
               res.status(500).json({
                    success: false,
                    message: "Todos not found!"
               })
          }
     }catch(err: any) {
          res.status(500).json({
               success: false,
               message: err?.message
          })
     }
})


// server start function
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

// res.status(200).json({
//      success: true,
//      message: "Users retrived successfully",
//      data: result?.rows
// })

// res.status(500).json({
//      success: false,
//      message: "User not found!",
//      data: result?.rows
// })

// catch(err: any) {
//      res.status(500).json({
//           success: false,
//           message: err?.message
//      })
// }
