import dotenv from "dotenv";
import dns from "node:dns";
import connectdb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})


dotenv.config();

// Fix for Windows/ISP DNS resolution issues with MongoDB Atlas SRV records
// dns.setServers(["8.8.8.8", "1.1.1.1"]);

connectdb()

  .then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(` Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO DB connection failed !!! ", err);
  });
