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
});
var Comment = sequelize.define('comments', {
	body: Sequelize.STRING,
});

sequelize.sync()

User.hasMany(Post)
Post.belongsTo(User)
Post.hasMany(Comment)
User.hasMany(Comment)
Comment.belongsTo(User)
Comment.belongsTo(Post)


//Homepage Wall
app.get('/', function(req, res){
	res.render('index', {
		title: 'Blog application',
		message: req.query.message,
		storedUser: req.session.user,
	})
})


//Wall
app.get('/blog', function(req, res){
	Post.findAll({ include: [{model: User}, {model: Comment, include: [User]}] 
}).then((posts) => {
	res.render('blog', {
		title: 'Blog application',
		message: req.query.message,
		storedUser: req.session.user,
		allPosts: posts
	})
} );
})


app.post('/comment', function(req, res){
	if(req.body.postComment != undefined){
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
				allofthem[0].setUser(allofthem[1])
				allofthem[0].setPost(allofthem[2])
			}).then(function(){
				res.redirect(req.body.origin)
			})
		}
		if(req.body.postComment === undefined) {
			res.redirect(req.body.origin + '?message=' + encodeURIComponent("Please write a comment first."))
		}

	})



// Register new user
// Still to add: if user already exists; don't create but return with error.
app.get('/register', function(req, res){
	res.render('register', {
		message: req.query.message,
		title: 'Register blog application'
	})
} );


app.post('/register', function(req, res){
	var nameUser = req.body.nameUser
	var emailUser = req.body.emailUser
	var passwordUser = req.body.passwordUser

	if(nameUser.length === 0) {
		res.redirect('/register?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}
	if(emailUser.length === 0) {
		res.redirect('/register?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}
	if(passwordUser.length === 0) {
		res.redirect('/register?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}
	if(nameUser !== null && emailUser !== null && passwordUser !== null){
		User.create({
			name: nameUser,
			email: emailUser,
			password: passwordUser
		}).then(function(user) {
			res.redirect( '/profile' )
		})
	}
})



app.get('/login', function(req, res){
	res.render('login', {
		message: req.query.message,
		title: 'Login blog application'
	})
} );

app.post('/login', bodyParser.urlencoded({extended: true}), function(req, res){
	var loginEmail = req.body.loginEmail;
	var loginPassword = req.body.loginPassword;

	if(loginEmail.length === 0) {
		res.redirect('/login?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(loginPassword.length === 0) {
		res.redirect('/login?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: loginEmail
		}
	}).then(function (user) {
		if (user !== null && loginPassword === user.password) {
			req.session.user = user;
			console.log(user.id)
			res.redirect('/profile');
		} else {
			res.redirect('/login?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function (error) {
		res.redirect('/login?message=' + encodeURIComponent("Invalid email or password."));
	});
});




// Profile - add new post and view your posts
app.get('/profile', function(req, res){
	var user = req.session.user;
	if (user === undefined) {
		res.render('profile', {
			message: 'Please log in to view your profile.',
			title: 'Profile blog application'
		});
	} else {
		Post.findAll({
			where: {
				userId: user.id
			},
			include: [{ 
				model: Comment, include: [{ 
					model: User }] 
				}]
			}).then((posts) => {
				if (req.query) {
					res.render('profile', {
						message: req.query.message,
						yourPosts: posts,
						storedUser: user,
						title: 'Profile blog application'
					});
				} else {
					res.render('profile', {
						yourPosts: posts,
						storedUser: user,
						title: 'Profile blog application'
					});
				}
			})
		}
	});


app.post('/profile', function(req, res){

	var titlePost = req.body.titlePost
	var bodyPost = req.body.bodyPost
	var imgPost = req.body.imgPost

	console.log(req.body)

	console.log(req.session.user)
	if(titlePost.length == 0 && bodyPost.length == 0 && imgPost.length == 0){
		res.redirect('/profile?message=' + encodeURIComponent("Your post can't be empty."));
	} else if(bodyPost.length == 0 && imgPost.length == 0){
		res.redirect('/profile?message=' + encodeURIComponent("Your post can't be empty."));
	} else if(bodyPost.length != 0 || imgPost.length != 0){
		if (titlePost.length != 0) {
			User.findOne({
				where: {
					id: req.session.user.id
				}
			}).then(function(theuser){
				theuser.createPost({
					title: titlePost,
					body: bodyPost,
					img: imgPost
				}).then(function(){
					res.redirect( '/profile' )
				})
			})
		}
	}
})



// One post
app.get('/onepost/:id', function(req, res){
	var postID = req.params.id
	var user = req.session.user

	console.log(req.params.id)

	Post.findOne({
		where: {
			id: req.params.id
		}, 
		include: [
		{model: User}, { model: Comment, include: [{
				model: User
			}]
		}]

	}).then((thepost) => {
		console.log(thepost)
		res.render('onepost', {
			title: 'One post',
			postID: postID,
			thepost: thepost,
			storedUser: user
		})
	})
})



//cannot access session here
app.get('/logout', function(req, res){
	console.log(req.session)
	req.session.destroy(function(err) {
		if(err) {
			throw err;
		}
	})
	res.render('index', {
		message: 'Successfully logged out.',
		title: 'Logout blog application'
	})
})


app.listen(3000)