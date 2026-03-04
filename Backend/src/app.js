import express from "express"

import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//Configurations set
app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.CORS_ORIGIN
    ].filter(Boolean),
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))  //we accept json data
// app.use(express.urlencoded())       data is from url's
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes
import authRouter from "./route/auth.route.js";
import studentRouter from "./route/student.route.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/students", studentRouter);

export { app }
