import dotenv from "dotenv";
import connectdb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})


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
