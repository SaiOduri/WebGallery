const crypto = require('crypto');
const path = require('path');
const express = require('express');
const session = require('express-session');
const app = express();
var date = new Date();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Initialize database
var Datastore = require('nedb')
  , comments = new Datastore({ filename: 'db/comments.db', autoload: true, timestampData : true})
  , images = new Datastore({ filename: 'db/images.db', autoload: true })
  , users = new Datastore({ filename: 'db/users.db', autoload: true });

  const cookie = require('cookie');

  app.use(express.static('static'));


app.use(function (req, res, next){
    console.log("HTTP request", req.method, req.url, req.body);
    console.log(Object.keys(req.body));
    next();
});

// Initialize objects

var Comment = (function(){
    return function item(comment){
        this.content = comment.content;
        this.date = date;
        this.imageId = comment.imageId;
    }
}());

var Image = (function(){
    return function item(image, picture){
        this.title = image.title;
        this.picture = picture;
        this.url = picture.path;
        this.date = image.date;
    }
}());

var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

function generateSalt (){
    return crypto.randomBytes(16).toString('base64');
}

function generateHash (password, salt){
    var hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    return hash.digest('base64');
}

app.use(session({
    secret: 'SECRET',
    resave: false,
    saveUninitialized: true,
}));

app.use(function (req, res, next){
    req.username = ('username' in req.session)? req.session.username : null;
    var username = (req.username)? req.username : '';
    res.setHeader('Set-Cookie', cookie.serialize('username', username, {
        path : '/', 
        maxAge: 60 * 60 * 24 * 7
    }));
    next();
});

app.use(function (req, res, next){
    console.log("HTTP request", req.username, req.method, req.url, req.body);
    next();
});

var isAuthenticated = function(req, res, next) {
    if (!req.username) return res.status(401).end("access denied");
    next();
};

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signup/
app.post('/signup/', function (req, res, next) {
    if (!('username' in req.body)) return res.status(400).end('username is missing');
    if (!('password' in req.body)) return res.status(400).end('password is missing');
    var username = req.body.username;
    var password = req.body.password;
    var temp_list = []
    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (user) return res.status(409).end("username " + username + " already exists");

        // generate a new salt and hash
        var salt = generateSalt();
        var hash = generateHash(password, salt);

        users.update({_id: username},{_id: username, images: temp_list, hash: hash, salt: salt, password}, {upsert: true}, function(err){
            if (err) return res.status(500).end(err);
            return res.json("user " + username + " signed up");
        });
    });
});

// curl -H "Content-Type: application/json" -X POST -d '{"username":"alice","password":"alice"}' -c cookie.txt localhost:3000/signin/
app.post('/signin/', function (req, res, next) {
    if (!('username' in req.body)) return res.status(400).end('username is missing');
    if (!('password' in req.body)) return res.status(400).end('password is missing');
    var username = req.body.username;
    var password = req.body.password;
    // retrieve user from the database
    users.findOne({_id: username}, function(err, user){
        if (err) return res.status(500).end(err);
        if (!user) return res.status(401).end("access denied");
        if (user.hash !== generateHash(password, user.salt)) return res.status(401).end("access denied"); 
        // Create Session
        req.session.username = user._id;
        // initialize cookie
        res.setHeader('Set-Cookie', cookie.serialize('username', username, {
              path : '/', 
              maxAge: 60 * 60 * 24 * 7
        }));
        return res.json("user " + username + " signed in");
    });
});

// curl -b cookie.txt -c cookie.txt localhost:3000/signout/
app.get('/signout/', isAuthenticated, function (req, res, next) {
    req.session.destroy();
    res.setHeader('Set-Cookie', cookie.serialize('username', '', {
          path : '/', 
          maxAge: 60 * 60 * 24 * 7 // 1 week in number of seconds
    }));
    res.json(cookie);
});

// Create Image
// curl -b cookie.txt -H "Content-Type: application/json" -X POST -d '{"title":"Cool", "author":"Me", "File":"File"}' localhost:3000/api/images/
app.post('/api/images/', upload.single('file'), isAuthenticated, function (req, res, next) {
    var image = new Image(req.body, req.file);
    image.author = req.username;
    images.insert(image, function (err, item) {
        if (err) res.status(500).end(err);
        users.update({_id: req.username}, {$push: {'images': item._id}}, {}, function(){
        })
    res.json(item);
    });
});

// Create Comment

app.post('/api/comments/', isAuthenticated, function (req, res, next) {
    var comment = new Comment(req.body);
    comment.author = req.username;
    comments.insert(comment, function (err, item) {
        if (err) res.status(500).end(err);
        res.json(item);
    });
});

// Get First 10 Comments from an Id

app.get('/api/comments/:id/', isAuthenticated, function (req, res, next) {

    if(req.query.offset == null){
        offset = 0;
    }
    else{
        offset = parseInt(req.query.offset);
    }

    comments.find({imageId: req.params.id}).sort({createdAt:-1}).skip(offset*10).limit(10).exec(function(err, items) { 
        if (err) res.status(500).end(err);
        res.json(items.reverse());
    });
});

// Get All Comments from an Id

app.get('/api/comments/:id/all/', isAuthenticated, function (req, res, next) {
    
    comments.find({imageId: req.params.id}).sort({createdAt:-1}).exec(function(err, items) { 
        if (err) res.status(500).end(err);
        res.json(items.reverse());
    });
});

// Get All Usernames

app.get('/api/usernames/', isAuthenticated, function (req, res, next) {
    users.find({}).exec(function(err, items) {
        var temp_list = [];
        if (err) res.status(500).end(err);
        for(var i = 0; i < items.length; i++){
            temp_list.push(items[i]._id);
        };
        res.json(temp_list);
    });
});

// Get all images with username
// curl -b cookie.txt localhost:3000/api/images/alice
app.get('/api/images/:username', isAuthenticated, function(req, res, next){
    users.findOne({_id: req.params.username}, function(err, item){
        if (err) return res.status(500).end(err);
        res.json(item.images);
    });
});

// Get all images

app.get('/api/images/', isAuthenticated, function(req, res, next){
    images.find({}).exec(function(err, items) { 
        var temp_list = [];
        if (err) res.status(500).end(err);
        for(var i = 0; i < items.length; i++){
            temp_list.push(items[i]._id);
        };
        res.json(temp_list);
    });
});

// Get an image given an id

app.get('/api/image/:id/', isAuthenticated, function (req, res, next) {

    images.findOne({_id: req.params.id}, function(err, item){
        if (err) res.status(500).end(err);
        res.json(item);
    });
});

// Delete an image given an id

app.delete('/api/images/:id/', isAuthenticated, function (req, res, next) {

    var can_delete = false;
    images.findOne({_id: req.params.id}, function(err, item){
        if (err) return res.status(500).end(err);
        if (!item) return res.status(404).end("Image id #" + req.params.id + " does not exists");

        if(item.author == req.username){
            can_delete = true;
        }
        if(can_delete){
            users.update({_id: req.username}, {$pull: {'images': item._id}}, {}, function(){
            })
            images.remove({ _id: item._id }, { multi: false }, function(err, num) {
                comments.remove({imageId: item._id}, function(err, num){
                    if(err) console.log(err);
                });
                res.json(item);
             });
        }
        else{
            return res.status(401).end("access denied");
        }
    });

});

// Get the picture from the upload

app.get('/api/images/profile/picture/:id/', isAuthenticated, function (req, res, next) {

    images.findOne({_id: req.params.id}, function(err, item){
        if(item == null) res.status(404).end('image ' + req.params.id + ' does not exists');
        else{
            var profile = item.picture;
            if(profile != undefined){
                res.setHeader('Content-Type', profile.mimetype);
                res.sendFile(profile.path, { root: './'});}
            }
    });
});

// Delete a certain comment given an id

app.delete('/api/comments/:id/', isAuthenticated, function (req, res, next) {

    var condition2 = false;
    
    users.findOne({_id: req.username}, function(err, usr){
        var temp_lst = usr.images;
        comments.findOne({_id: req.params.id}, function(err, comment){
        if (err) return res.status(500).end(err);
        if (!comment) return res.status(404).end("Comment id #" + req.params.id + " does not exists");
        for(var i = 0; i < temp_lst.length; i++){
            if(temp_lst[i] == comment.imageId){
                condition2 = true;
            }
        }

        if(comment.author == req.username || condition2){
            comments.findOne({_id: req.params.id}, function(err, item){
                comments.remove({ _id: item._id }, { multi: false }, function(err, num) {  
                    res.json(item);
                 });
                });
        }
        else{
            return res.status(401).end("access denied");
        }
        });

    });

});



const http = require('http');
const PORT = 3000;

http.createServer(app).listen(PORT, function (err) {
    if (err) console.log(err);
    else console.log("HTTP server on http://localhost:%s", PORT);
});
