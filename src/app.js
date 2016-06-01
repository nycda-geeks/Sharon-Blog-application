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
	secret: 'secured password',
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 6000000 }
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
var Comment = sequelize.define('comments', {
	body: Sequelize.STRING,
})

sequelize.sync()

User.hasMany(Post)
Post.belongsTo(User)
Post.hasMany(Comment)
User.hasMany(Comment)
Comment.belongsTo(User)
Comment.belongsTo(Post)


//Homepage Wall
app.get('/', function(req, res){
	Post.findAll({ include: [User] 
	}).then((posts) => {
		res.render('blog', {
			storedUser: req.session.user,
			allPosts: posts
		})
	} )
})



app.post('/comment', function(req, res){
	Promise.all([
		Comment.create({
			body: req.body.postComment
		}),
		User.findOne({
			where: {
				id: req.session.user.id
			}
		}),
		Post.findOne({
			where: {
				id: req.body.id
			}
		})
		]).then(function(allofthem){
			console.log(allofthem[0])
			console.log(allofthem[1])
			console.log(allofthem[2])
			allofthem[0].setUser(allofthem[1])
		}).then(function(){
			res.redirect('/')
		})
	})



// Register new user
// Still to add: if user already exists; don't create but return with error.
app.get('/register', function(req, res){
	res.render('register')
} );


app.post('/register', function(req, res){
	var nameUser = req.body.nameUser
	var emailUser = req.body.emailUser
	var passwordUser = req.body.passwordUser

	User.create({
		name: nameUser,
		email: emailUser,
		password: passwordUser
	}).then(function(user) {
		//req.session.user = user
		res.redirect( '/profile' )
	})
	
})



app.get('/login', function(req, res){
	res.render('login')
} );

app.post('/login', bodyParser.urlencoded({extended: true}), function(req, res){
	var loginEmail = req.body.loginEmail;
	var loginPassword = req.body.loginPassword;

	if(loginEmail.length === 0) {
		console.log('niet1')
		res.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(loginPassword.length === 0) {
		console.log('niet2')
		res.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: loginEmail
		}
	}).then(function (user) {
		console.log('niet3')
		if (user !== null && loginPassword === user.password) {
			req.session.user = user;
			console.log(user.id)
			res.redirect('/profile');
		} else {
			console.log('niet5')
			res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function (error) {
		console.log('niet6')
		res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
});




// Profile - add new post and view your posts
app.get('/profile', function(req, res){
	User.findOne({
		where: {
			id: req.session.user.id
		}
	}).then(function(theuser){
		theuser.getPosts().then((posts) => {
			res.render('profile', {
				yourPosts: posts,
				storedUser: req.session.user
			});
		});
	});
});


app.post('/profile', function(req, res){

	var titlePost = req.body.titlePost
	var bodyPost = req.body.bodyPost
	var imgPost = req.body.imgPost

	console.log(req.session.user)
	User.findOne({
		where: {
			id: req.session.user.id
		}
	}).then(function(theuser){
		theuser.createPost({
			title: titlePost,
			body: bodyPost,
			img: imgPost
		})
	}).then(function(){
		res.redirect( '/profile' )
	})
})


// One post - to click one post and see it.
app.get('/onepost', function(req, res){

	// work with jQuery to click a post and select it.
	// Then put this information in a variable: entire object
	// Send entire object to next page, render.

	//var selectPost = selectedPost

	res.render('onepost', {
		selectPost: selectPost
	})
} );


app.get('/logout', function(req, res){
	req.session.destroy(function(err) {
  	//cannot access session here
  })
	res.render('blog', {
		message: 'Successfully logged out.'})
})


app.listen(3000)