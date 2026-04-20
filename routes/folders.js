import express from "express"
import auth from "../middleware/authMiddleware.js";
import pool from "../db.js";
const folderRouter = express.Router();
folderRouter.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, created_at FROM folders WHERE user_id = $1 ORDER BY created_at ASC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

folderRouter.post("/", auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  try {
    const result = await pool.query(
      "INSERT INTO folders (user_id, name) VALUES ($1, $2) RETURNING id, name, created_at",
      [req.user.id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

folderRouter.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE files SET folder_id = NULL WHERE folder_id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    await pool.query(
      "DELETE FROM folders WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default folderRouter;