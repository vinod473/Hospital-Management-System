const mongoose = require("mongoose");

const medicineSchema = mongoose.Schema({
    name : String,
    price : Number,
    quantity : Number
});


module.exports = mongoose.model("Medicines",medicineSchema);