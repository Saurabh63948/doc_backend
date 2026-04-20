
import express from "express";
import auth from "../middleware/authMiddleware.js";
import pool from "../db.js";

const fileRouter = express.Router();

// GET /api/files — all files for logged-in user
fileRouter.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, icon, doc_content, canvas_data, folder_id, updated_at
       FROM files
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/files — create new file (optionally inside a folder)
fileRouter.post("/", auth, async (req, res) => {
  const { name, icon = "⚡", folder_id = null } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO files (user_id, name, icon, folder_id, doc_content, canvas_data)
       VALUES ($1, $2, $3, $4, '', '[]')
       RETURNING id, name, icon, folder_id, doc_content, canvas_data, updated_at`,
      [req.user.id, name, icon, folder_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/files/:id — save doc content, canvas shapes, OR move to folder

fileRouter.patch("/:id", auth, async (req, res) => {
  const { doc_content, canvas_data, folder_id, name } = req.body;
  const fileId = req.params.id;

  try {
    // Build the SET clause dynamically based on what was sent
    const updates = [];
    const values  = [];
    let   idx     = 1;

    if (doc_content !== undefined) { updates.push(`doc_content = $${idx++}`); values.push(doc_content); }
    if (canvas_data  !== undefined) { updates.push(`canvas_data = $${idx++}`); values.push(canvas_data); }
    if (name         !== undefined) { updates.push(`name = $${idx++}`);        values.push(name); }
    // folder_id can be null (remove from folder) or a number (move to folder)
    if (Object.prototype.hasOwnProperty.call(req.body, "folder_id")) {
      updates.push(`folder_id = $${idx++}`);
      values.push(folder_id); // null is valid here
    }

    if (updates.length === 0) return res.status(400).json({ error: "Nothing to update" });

    updates.push(`updated_at = NOW()`);
    values.push(fileId, req.user.id);

    const result = await pool.query(
      `UPDATE files SET ${updates.join(", ")}
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING id, name, icon, folder_id, updated_at`,
      values
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "File not found or access denied" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/files/:id
fileRouter.delete("/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM files WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "File not found or access denied" });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default fileRouter