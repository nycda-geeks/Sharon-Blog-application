var fs = require( 'fs' )
var pg = require( 'pg' )
var express = require('express')
var bodyParser = require('body-parser')
var Sequelize = require('sequelize')
var app = express()
app.use(bodyParser.urlencoded({ extended: false }))

var sequelize = new Sequelize('blogapplication', 'postgres', 'Hi123', {
	host: 'localhost',
	dialect: 'postgres'
});

app.set('views', './src/views');
app.set('view engine', 'jade')

app.use(express.static('./public/js'))
app.use(express.static('./public/css'))

app.get('/', function(req, res){
	res.render('index')
} );


app.get('/', function(req, res){
	res.render('index')
} );



app.get('/register', function(req, res){
	res.render('register')
} );


app.post('/register', function(req, res){
	var nameUser = req.body.nameUser
	var emailUser = req.body.emailUser
	var passwordUser = req.body.passwordUser

	var User = sequelize.define('users', {
		name: Sequelize.STRING,
		email: Sequelize.STRING,
		password: Sequelize.STRING
	});

	sequelize.sync().then(function () {
		User.create({
			name: nameUser,
			email: emailUser,
			password: passwordUser
		});
	}).then(function() {
		//console.log(users[name])
		res.redirect( '/yourpage' )
	})
	
})


app.get('/yourpage', function(req, res){
	res.render('yourpage')
} );



app.listen(3000);