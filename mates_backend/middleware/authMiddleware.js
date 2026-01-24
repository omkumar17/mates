const jwt=require("jsonwebtoken");
const User=require("../models/user");

const authMiddleware=async(req,res,next)=>{
    let token;

    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ){
        try{
            token=req.headers.authorization.split(" ")[1];
            console.log("AUTH HEADER:", req.headers.authorization);
    console.log("RAW TOKEN:", token);

            const decoded=jwt.verify(token,process.env.JWT_SECRET);

            req.user=await User.findById(decoded.id).select("-passwordHash");

            return next();
        }catch(error){
            console.log("Auth middleware error:",error.message);
            return res.status(401).json({message:"not authorized, invalid token"});
        }
    }
    
    if(!token){
        return res.status(401).json({message:"Not authorize, no token"});
    }
};
module.exports=authMiddleware;