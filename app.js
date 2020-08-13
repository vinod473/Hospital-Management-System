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
app.get('/register',(req,res,next)=>{
    res.render('register');
});
const {ensureAuthenticated} = require("./config/auth.js");
app.get('/dashboard',ensureAuthenticated,(req,res)=>{
    res.render('dashboard');
});

//logout
app.get('/logout',ensureAuthenticated,(req,res)=>{
    req.logout();
    req.flash('success_msg','Successfully Logged out!');
    res.redirect('/login');
});
app.get("/patients",ensureAuthenticated,(req,res)=>{
   Patient.find({})
   .then(patients=>{
       res.render("patients",{patients});
   })
   .catch(err=>{console.log(err)});
});
app.get("/registerPatient",ensureAuthenticated,(req,res)=>{
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
                            req.flash("success_msg","Successfully Registered!");
                            res.redirect("registerPatient");
                        });
                    }
                })
            .catch(err=>console.log(err));
    }
});
app.get("/search",ensureAuthenticated,(req,res)=>{
    res.render("search");
});
app.post("/search",(req,res)=>{
     const ssnid = req.body.ssnid;
     Patient.findOne({ssnid:ssnid})
            .then(patient=>{
                if(patient){
                    res.render("details",{patient});
                }
                else{
                    res.render("details",{"error_msg":"Patient Not Found!",patient});
                }
            })
            .catch(err=>console.log(err));
});
app.get("/update",ensureAuthenticated,(req,res)=>{
    res.render("search");
});
app.post("/update",(req,res)=>{
    const ssnid = req.body.ssnid;
    Patient.findOne({ssnid:ssnid})
            .then(patient =>{
                if(patient){
                    var req.session.localVar = patient;
                    res.redirect("/update/patient");
                }
                else{
                    req.flash({"error_msg":"Patient not found!!"});
                    res.render("search");
                }
            })
            .catch(err => console.log(err));
});
app.get("/update/patient",(req,res)=>{
    const patient = req.session.localVar;
   res.render("update",{patient}); 
});
app.listen(PORT,(req,res)=>{
  console.log(`server started in port ${PORT}`);
});