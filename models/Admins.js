const mongoose = require("mongoose");

const adminSchema = mongoose.Schema({
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    role: {
        type:String,
        enum: ['deskExecutive','pharmacist','diagnosticExecutive'],
        required:true
    }
});

module.exports = mongoose.model("Admins",adminSchema);
