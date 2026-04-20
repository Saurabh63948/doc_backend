import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/auth.js"
import fileRouter from "./routes/files.js"
import folderRouter from "./routes/folders.js"
dotenv.config(); 

const app = express();

app.use(cors({ origin: "https://doc-frontend-umber.vercel.app" }));
app.use(express.json());

app.use("/api/auth",router);
app.use("/api/files",fileRouter)
app.use("/api/folders",folderRouter)
const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});