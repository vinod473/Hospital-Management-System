const mongoose = require("mongoose");

const patientSchema = mongoose.Schema({
    ssnid : Number,
    name : String,
    age: Number,
    dateOfAdmission: Date,
    typeOfBed: String,
    address: String,
    city: String,
    state: String,
    status:String
});

module.exports = mongoose.model("Patients",patientSchema);