var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var userController = require('./controller/userController');
var draftController = require('./controller/draftController');

/*
var fs = require("fs");

function main() {
    fs.readdir("./node_modules", function (err, dirs) {
        if (err) {
            console.log(err);
            return;
        }
        dirs.forEach(function(dir){
            if (dir.indexOf(".") !== 0) {
                var packageJsonFile = "./node_modules/" + dir + "/package.json";
                if (fs.existsSync(packageJsonFile)) {
                    fs.readFile(packageJsonFile, function (err, data) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            var json = JSON.parse(data);
                            console.log('"'+json.name+'": "' + json.version + '",');
                        }
                    });
                }
            }
        });

    });
}
*/


mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');
});
mongoose.connection.on('error', function (err) {
    console.log('Could not connect to mongo server!');
    console.log(err);
});

var mongoConnectionString = 'mongodb://localhost:27017/sofifa';

mongoose.connect(mongoConnectionString);

var routes = require('./routes/index');
var users = require('./routes/users');
var scrape = require('./routes/scrape');
var draft = require('./routes/draft');
var settings = require('./routes/settings');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(session({
    secret: 'dasdnuihedsadt'
    })
);

//loading session
app.use(function (req, res, next) {
    draftController.getActiveDraft(function (err, result) {
        //req.session.regenerate(function() {
            if (result.success) {
                var currentDraft = result.draft;
                req.currentDraft = currentDraft;
                req.session.currentDraft = currentDraft;
                res.locals.currentDraft = currentDraft;

                var currentUserTurn = null;
                var i = 0;
                while(currentUserTurn == null){
                    var user = currentDraft.Users[i];
                    if(!user.Selected){
                        currentUserTurn = user._IdUser;
                    }
                    i++;
                }
                req.currentUserTurn = currentUserTurn;
                req.session.currentUserTurn = req.currentUserTurn;
                res.locals.currentUserTurn = req.currentUserTurn;

                var IsUserTurn = req.session.user ? (currentUserTurn.Username === req.session.user.Username) : false;
                req.IsUserTurn = IsUserTurn;
                req.session.IsUserTurn = IsUserTurn;
                res.locals.IsUserTurn = IsUserTurn;
            }
            if (req.session.user) {
                userController.getUserByEmail(req.session.user.Email, function (err, result) {
                    if (result.success) {
                        req.user = result.user;
                        delete req.user.Password;
                        req.session.user = req.user;
                        res.locals.user = req.user;
                    }
                    next();
                });
            }
            else{
                next();
            }
        //});
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/scrape', scrape);
app.use('/draft', draft);
app.use('/setting', settings);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.param('id', function (req, res, next, id) {
    next();
});


// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

//main();

module.exports = app;
