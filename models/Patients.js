const mongoose = require("mongoose");

const patientSchema = mongoose.Schema({
    ssnid : Number,
    name : String,
    age: Number,
    dateOfAdmission: {
    	type : Date,
    	default: Date.now(),
    },  
    typeOfBed: String,
    address: String,
    city: String,
    state: String,
    status:String,
    medicines: [{
                    name : String,
                    price : Number,
                    quantity : Number
            }]
});

module.exports = mongoose.model("Patients",patientSchema);