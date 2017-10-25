// Dependencies
var express 		= require('express');
var path 			= require('path');
var favicon 		= require('static-favicon');
var logger 			= require('morgan');
var cookieParser 	= require('cookie-parser');
var bodyParser 		= require('body-parser');
var mongo			= require('mongodb');
var MongoClient 	= require('mongodb').MongoClient;
var dbquery			= require('./routes/dbquery.js');
var socket_io		= require('socket.io');

// Express
var app = express();

// Socket.io
var io = socket_io();
app.io = io;
var clients = [];
var _socket = null;

//Database
MongoClient.connect('mongodb://localhost:27017/AERRDM', function(err, database) {
	if(err)
		throw err;

	var db = database;

	// socket.io events
	io.on('connection', function (socket)
	{
		clients[socket.handshake.address] = socket;
		console.log("Connected " + socket.handshake.address);

		socket.on('disconnect', function () {
			delete clients[socket.handshake.address];
			console.log("Disconnected " + socket.handshake.address);
			dbquery.ResetUserByInitiator(db, socket.handshake.address);
		});
	});

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');

	app.use(favicon());
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use('/bower_components',  express.static(__dirname + '/bower_components'));

	// Configuring Passport
	var passport = require('passport');
	var expressSession = require('express-session');
	app.use(expressSession({secret: 'mySecretKey', resave: false, saveUninitialized: true}));
	app.use(passport.initialize());
	app.use(passport.session());

	 // Using the flash middleware provided by connect-flash to store messages in session
	 // and displaying in templates
	var flash = require('connect-flash');
	app.use(flash());

	// Initialize Passport
	var initPassport = require('./passport/init');
	initPassport(passport, db);

	/*app.use(function(req, res, next) {
		req.db = db;
		next();
	});*/

	var routes = require('./routes/index')(passport, clients, db);
	app.use('/', routes);

	/// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handler
	app.use(function(err, req, res, next) {
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.render('error');
	});
});

module.exports = app;
