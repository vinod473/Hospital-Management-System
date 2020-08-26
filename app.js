const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admins.js");
const Patient = require("./models/Patients.js");
const app = express();
const initiateMongoServer = require("./config/db.js");

app.set("view engine","ejs");

//passport config
require("./config/passport.js")(passport);

//PORT
const PORT = process.env.PORT || 8080;
app.use(express.static(__dirname + '/public'));

// Initaite Mongo Server
initiateMongoServer();

// Express session
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//connect flash
app.use(flash());

//Global vars
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//bodyparser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get("/registerAdmin",(req,res)=>{
   res.render('registerAdmin'); 
});
app.post("/registerAdmin",(req,res)=>{
    
    const email = req.body.email;
    const password = req.body.password;
    const password1 =  req.body.pwd;
    const role =  req.body.role;
    const errors=[];
    if(!email || !password || !password1 || !role){
        errors.push({msg:"Please enter all fields"});
    }
    if( password !== password1){
        errors.push({msg:"Password do no match!!"});
    }
    if( errors.length>0 ){
        res.render("registerAdmin",{errors,email,password,role});
    }
    else{
        Admin.findOne({email:email})
            .then(user=>{
                if(user){
                    //user exist
                    errors.push({msg:"User already registerd!!"});
                    res.render("registerAdmin",{errors,email,password,password1,role});
                }
                else{
                    const newUser = new Admin({email,password,role});
                    // HASH password
                    bcrypt.genSalt(10, (err,salt) =>
                        bcrypt.hash(newUser.password,salt, (err,hash) => {
                            if(err)
                                throw err;
                            //set password to hashed
                            newUser.password = hash;
                            newUser.save()
                                .then(user =>{
                                    req.flash('success_msg','Registration Successfull!!');
                                    res.redirect('login');
                                })
                                .catch(err => console.log(err));
                    }));  
                }
            });
    }  
});
app.get('/',(req,res,next)=>{
    res.render('welcome');
});
app.get('/login',(req,res,next)=>{
    res.render('login');
});
app.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true,
    })(req,res,next);
});
const {ensureAuthenticated} = require("./config/auth.js");
app.get('/dashboard',ensureAuthenticated,(req,res)=>{
    res.render('dashboard');
});

//logout
app.get('/logout',ensureAuthenticated,(req,res)=>{
    req.logout();
    res.render('login',{'success_msg':'Successfully Logged out!'});
});
app.get("/patients",(req,res)=>{
   Patient.find({})
   .then(patients=>{
       res.render("patients",{patients});
   })
   .catch(err=>{console.log(err)});
});
app.get("/registerPatient",(req,res)=>{
   res.render("registerPatient"); 
});
app.post("/registerPatient",(req,res)=>{
    const errors=[];
    const ssnid = req.body.ssnid;
    const name = req.body.name;
    const age = req.body.age;
    const dateOfAdmission = req.body.dateofadmission;
    const typeOfBed = req.body.typeOfBed;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const status = req.body.status;
    if(!ssnid || !name || !age || !dateOfAdmission || !typeOfBed || !address || !city || !state || !status ){
        errors.push({msg:"Please enter all details!!"});
    }
    if(errors.length>0){
        res.render("registerPatient",{errors,ssnid,name,age,dateOfAdmission,typeOfBed,address,city,state,status});
    }
    else{
        Patient.findOne({ssnid:ssnid})
                .then(patient=>{
                    if(patient){
                        errors.push({msg:"Patient already Registerd!"});
                        res.render("registerPatient",{errors});
                    }
                    else{
                    const newPatient = new Patient({ssnid,name,age,dateOfAdmission,typeOfBed,address,city,state,status});
                    newPatient.save()
                        .then(pt=>{
                            req.flash("success_msg","Patient Successfully Registered!");
                            res.redirect("patients");
                        });
                    }
                })
            .catch(err=>console.log(err));
    }
});
app.get("/search",(req,res)=>{
    res.render("search");
});
app.get("/search/:token",(req,res)=>{
     const ssnid = req.params.token;
     Patient.findOne({ssnid:ssnid})
            .then(patient=>{
                if(patient){
                    res.render("details",{patient});
                }
                else{
                    req.flash("error_msg","Pateint Not found!!");
                    res.redirect("search");
                }
            })
            .catch(err=>console.log(err));
});
app.get("/update",(req,res)=>{
    res.render("update");
});
app.get("/update/:token",(req,res)=>{
    const ssnid = req.params.token;
    Patient.findOne({ssnid:ssnid})
            .then(user=>{
                if(user){
                    res.render("updateDetails",{patient:user});
                }
                else{
                    req.flash("error_msg","Pateint Not found!!");
                    res.redirect("update");
                }
            })
            .catch(err=>console.log(err));
});
app.post("/update/:token",(req,res)=>{
    Patient.updateOne({ssnid:req.params.token},[
        { 
            $set:{
            name : req.body.name,
            age : req.body.age,
            address : req.body.address,
            city : req.body.city,
            state : req.body.state,
            status : req.body.newstatus,
            typeOfBed : req.body.newtypeofbed,
            dateOfAdmission : req.body.newdateofadmission
            }
        }
        //,
        // {
        //     $set:{
        //         status : { $ifNull: [req.body.newstatus,req.body.status] },
        //         typeOfBed : { $ifNull: [req.body.newtypeofbed,req.body.typeOfBed] },
        //         dateOfAdmission : { $ifNull: [req.body.newdateofadmission,req.body.dateOfAdmission] }
        //     }
        // }
    ],
    (err,user)=>{
        if(user){
            req.flash("success_msg","Successfully Updated !!");
            res.render("dashboard");
        }
        else throw err;
    });
});
app.get("/delete",(req,res)=>{
    res.render("delete");
});
app.get("/delete/:token",(req,res)=>{
    const ssnid = req.params.token;
    Patient.findOne({ssnid:ssnid})
            .then(user=>{
                if(user){
                    res.render("deletePatient",{patient:user});
                }
                else{
                    res.render("delete",{"error_msg":"Pateint Not found!!"});
                }
            })
            .catch(err=>console.log(err));
});
app.post("/delete/:token",(req,res)=>{
        Patient.deleteOne({ssnid:req.params.token})
            .then(doc=>{
                if(doc.deletedCount==1){
                    res.render("dashboard",{"success_msg":"Patient Successfully deleted!!"});
                }
                else{
                    console.log("delete error");
                }
            })
            .catch(err=>console.log(err));
});
app.get("/medicineStore",(req,res)=>{
    res.render("medicineStore");
});
app.post("/medicineStore",(req,res)=>{
    const name = req.body.medicinename;
    const quantity = req.body.medicinequantity;
    const price = req.body.medicineprice;
    Medicine.findOne({name:name})
            .then(med=>{
                if(med){
                    Medicine.updateOne({name:name},{
                    $set:{
                            name : name,
                            price : price,
                            quantity : med.quantity + parseInt(quantity,10)
                        }
                    })
                    .then(ob=>{
                        req.flash("success_msg","Successfully Updated..");
                        res.redirect("addMedicine");
                    })
                    .catch(err=>console.log(err));
                }
                else{
                    const newMed = new Medicine({name,price,quantity});
                    newMed.save()
                            .then(medObj=>{
                                req.flash("success_msg","Medicine Added..");
                                res.redirect("medicineStore");
                            })
                            .catch(err=>console.log(err));
                }
            })
            .catch(err=>console.log(err));
});
app.get("/issueMedicine",(req,res)=>{
    res.render("issueMed");
});
app.get("/issueMedicine/:token",(req,res)=>{
    const ssnid = req.params.token;
    Patient.findOne({ssnid:ssnid})
            .then(patient=>{
                if(patient){
                    res.render("issueMedicine",{patient});
                }
                else{
                    res.render("issueMed",{"error_msg":"Patient not found"});
                }
            })
            .catch(err=>console.log(err));
});
app.get("/billing",(req,res)=>{
    res.render("search");
});
app.post("/billing",(req,res)=>{
    const ssnid = req.body.ssnid;
    Patient.findOne({ssnid:ssnid})
            .then(user=>{
                if(user){
                    res.render("billing",{patient:user});
                }
                else{
                    res.render("billing",{"error_msg":"Pateint Not found!!"});
                }
            })
            .catch(err=>console.log(err));
});
app.post("/billing/:token",(req,res)=>{
    const ssnid = req.params.token;
    Patient.findOne({ssnid:ssnid})
            .then(user=>{
                Patient.updateOne({ssnid:ssnid},{
                        $set:{
                            status : "Discharged"
                        }
                    })
                    .then(ob=>{
                        res.render("dashboard",{"success_msg":"Patient Discharged.."});
                    })
                    .catch(err=>console.log(err));
            })
            .catch(err=>console.log(err));
});
app.listen(PORT,(req,res)=>{
  console.log(`server started in port ${PORT}`);
});