const express=require("express");
const cors=require("cors");
const dotenv=require("dotenv");
const connectDB=require("./config/db");

dotenv.config(); //load env

connectDB();  //connect db

const app=express();

//middleware

app.use(cors());
app.use(express.json());  //parse body as json

//routes

app.get("/",(req,res)=>{
    res.send("mates API is running");
})

const authRoutes=require("./routes/authRoutes");
app.use("/api/auth",authRoutes);

const userRoutes=require("./routes/userRoutes");
// console.log("typeof userRoutes:", typeof userRoutes);
app.use("/api/user",userRoutes);

const likeRoutes = require("./routes/likeRoutes");
app.use("/api/likes", likeRoutes);


//error handling

app.use((err,req,res,next)=>{
    console.error("Global error handler:", err);
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Server error" });
});

const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`);
});
