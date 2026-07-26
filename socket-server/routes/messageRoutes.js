const express=require("express");
const router=express.Router();

const Message=require("../models/message");

router.get("/:matchId",async(req,res)=>{

    const messages=await Message.find({
        match:req.params.matchId
    })
    .populate("sender","name")
    .sort({createdAt:1});

    res.json(messages);

});

module.exports=router;