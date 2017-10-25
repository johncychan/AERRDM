var LocalStrategy   = require('passport-local').Strategy;
var User = require('../models/user');
var bCrypt = require('bcrypt-nodejs');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

module.exports = function(passport, db){

	passport.use('signup', new LocalStrategy({
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            findOrCreateUser = function(){
                // find a user in Mongo with provided username
                db.collection("users").findOne({ $or: [ {'username' :  username }, {'email' : req.body.email} ] }, 
		  function(err, user) {
                    // In case of any error, return using the done method
                    if (err){
                        console.log('Error in SignUp: '+err);
                        return done(err);
                    }
                    // already exists
                    if (user) {
			if (req.body.username == user.username)
	                        console.log('User already exists with username: '+username);
			if(req.body.email == user.email)
	                        console.log('User already exists with email: '+req.param('email'));
                        return done(null, false, req.flash('message','User Already Exists'));
                    } 

		    else {
                        // if there is no user with that email
                        // create the user
                        var newUser = {username: "", password: "", email: "", firstName: "", lastName: "", facility: ""};

                        // set the user's local credentials
                        newUser.username = username;
                        newUser.password = createHash(password);
                        newUser.email = req.body.email;
                        newUser.firstName = req.body.firstName;
                        newUser.lastName = req.body.lastName;
						newUser.facility = req.body.facility;

                        // save the user
                        db.collection("users").insertOne(newUser, function(err, r) {
                            if (err || r.insertedCount != 1){
                                console.log('Error in Saving user: '+err);  
                                throw err;  
                            }
                            console.log('User Registration succesful');    
                            return done(null, newUser);
                        });
                    }
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        })
    );


    // Generates hash using bCrypt
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

}
