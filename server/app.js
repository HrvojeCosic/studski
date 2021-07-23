const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const db = require('./db');
const session = require('express-session');
require('dotenv').config();

const usersRouter = require('./routes/users');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' })); //TODO(?): allow production frontend origin
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//SESSION SETUP
const SequelizeStore = require('connect-session-sequelize')(session.Store);
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: new SequelizeStore({
			db: db /*sequelize*/,
		}),

		// cookie: { secure: true }, //no https atm
	})
);

app.use('/api/users', usersRouter);

db.authenticate()
	.then(console.log('Connection has been established successfully.'))
	.catch(error => console.error('Unable to connect to the database:', error));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	// res.status(err.status || 500);  //no default engine was specified and no extension was provided...
	// res.render('error');
});

module.exports = app;
