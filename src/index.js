import dotenv from "dotenv";
import dns from "node:dns";
import connectdb from "./db/index.js";


dotenv.config();


connectdb()
