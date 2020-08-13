const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

 const Admin = require("../models/Admins.js");

module.exports = function(passport){
    passport.use(
        new localStrategy({usernameField : 'email'}, (email,password,done)=>{
            //match user
            Admin.findOne({email:email})
                .then(user =>{
                    if( !user ){
                        return done(null,false,{message: 'Access Denied!!'});
                    }
                    // match password
                    bcrypt.compare(password, user.password,(err,isMatch)=>{
                        if(err)
                            throw err;
                        if(isMatch){
                            return done(null,user);
                        }
                        else{
                            return done(null,false,{message:'Incorrect Password'});
                            
                        }
                    });
                })
                .catch(err=>console.log(err));
                })
        );
        
    passport.serializeUser((user, done)=> {
      done(null, user.id);
    });
     
    passport.deserializeUser((id, done)=> {
      Admin.findById(id, (err, user) => {
        done(err, user);
      });
    });
};