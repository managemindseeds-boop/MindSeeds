import express from "express"

import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//Configurations set
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))  //we accept json data
// app.use(express.urlencoded())       data is from url's
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes
import authRouter from "./route/auth.route.js";
app.use("/api/v1/auth", authRouter);

export { app }