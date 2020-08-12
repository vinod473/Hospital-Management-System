const mongoose = require("mongoose");

const MongoUri = "mongodb+srv://vinod:openmlab@719@cluster0.pzby0.mongodb.net/admindb?retryWrites=true&w=majority";

const initiateMongoServer = async() =>{
    try{
         await mongoose.connect(MongoUri,{
             useUnifiedTopology: true,
             useNewUrlParser: true
         });
    console.log("connected to DB !!"); 
    }
    catch(e){
        console.log(e);
    throw e;
    }
};
  
module.exports = initiateMongoServer;