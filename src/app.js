var fs = require( 'fs' )
var pg = require( 'pg' )
var express = require('express')
var bodyParser = require('body-parser')
var Sequelize = require('sequelize')
var session = require('express-session');

var app = express()
app.use(bodyParser.urlencoded({ extended: false }))

var sequelize = new Sequelize('blogapplication', 'postgres', 'Hi123', {
	host: 'localhost',
	dialect: 'postgres'
});

app.use(session({
	// secret: 'oh wow very secret much security',
	// resave: true,
	// saveUninitialized: false
}));

app.set('views', './src/views');
app.set('view engine', 'jade')

app.use(express.static('./public/js'))
app.use(express.static('./public/css'))

var User = sequelize.define('users', {
		name: Sequelize.STRING,
		email: Sequelize.STRING,
		password: Sequelize.STRING
	});
var Post = sequelize.define('posts', {
		title: Sequelize.STRING,
		body: Sequelize.STRING,
		img: Sequelize.STRING
})
	User.hasMany(Post)
	Post.belongsTo(User)


//Homepage Wall
app.get('/', function(req, res){

	Post.findAll().then(function (posts) {
	var data = posts.map(function (post) {
		return {
			title: post.dataValues.title,
			body: post.dataValues.body
		};
	});

	console.log("printing results:");
	console.log(data);

	res.render('index', 
		{posts: data})
} );


// Register new user
// Still to add: if user already exists; don't create but return with error.
app.get('/register', function(req, res){
	res.render('register')
} );


app.post('/register', function(req, res){
	var nameUser = req.body.nameUser
	var emailUser = req.body.emailUser
	var passwordUser = req.body.passwordUser.toString()

	sequelize.sync().then(function () {
		User.create({
			name: nameUser,
			email: emailUser,
			password: passwordUser
		});
	}).then(function() {
		req.session.user = user
		res.redirect( '/profile' )
	})
	
})


app.get('/login', function(req, res){
	res.render('login')
} );

app.post('/login', function(req, res){
	// var loginEmail = req.body.loginEmail;
	// var loginPassword = req.body.loginPassword;
	// User.findOne({where: {
	// 	email: req.body.loginEmail
	// }})

})


// Your page - add new post and view your posts
app.get('/profile', function(req, res){

	Post.findAll().then(function (posts) {
	var data = posts.map(function (post) {
		return {
			title: post.dataValues.title,
			body: post.dataValues.body,
			img: post.dataValues.img
		};
	});
		console.log("printing results:");
		console.log(data);
	});	

	res.render('profile', {
		yourPosts: data
	})
} );

app.post('/profile', function(req, res){

	var titlePost = req.body.titlePost
	var bodyPost = req.body.bodyPost
	var imgPost = req.body.imgPost

	sequelize.sync().then(function () {
		Post.create({
			title: titlePost,
			body: bodyPost,
			img: imgPost
		});
	}).then(function() {
		//console.log(users[name])
		res.render( 'profile' )
})


// One post - to click one post and see it.
app.get('/onepost', function(req, res){

	// work with jQuery to click a post and select it.
	// Then put this information in a variable: entire object
	// Send entire object to next page, render.

	var selectPost = selectedPost

	res.render('onepost', {
		selectPost: selectPost
	})
} );



app.listen(3000);