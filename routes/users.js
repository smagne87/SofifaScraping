var express = require('express');
var path = require('path');
var userController = require('../controller/userController');

var router = express.Router();

/* User Home. */
router.get('/', requireLogin, function (req, res, next) {
    userController.getUserByEmail(req.session.user.Email, function (err, result) {
        if (result.success) {
            res.render(path.join(__dirname, '../views/users/index'));
        } else {
            req.session.reset();
            res.redirect('/users/login');
        }
    });
});

router.get('/list', requireAdminLogin, function (req, res, next) {
    userController.getAllUsers(function (err, usersList) {
        res.render(path.join(__dirname, '../views/users/list'), {list: usersList});
    });
});


router.get('/delete/:id', requireAdminLogin, function (req, res, next) {
    userController.deleteUser(req.params.id, function (err, deletedResult) {
        res.render(path.join(__dirname, '../views/users/deleteUserConfirm'), {result: deletedResult});
    });
});

router.get('/changePlayer', requireLogin, function (req, res, next) {
    var currTeam;
    userController.getUserTeam(req.session.user._id, function (err, team) {
        currTeam = team;
        userController.getAllUsers(function(err, users){
            var tempUsers = [];
            for(var i = 0; i < users.length; i++){
                var user = users[i];
                if(user.Username !== req.session.user.Username){
                    tempUsers.push(user);
                }
            }
            res.render(path.join(__dirname, '../views/users/changePlayers'), {userTeam: currTeam, userList: tempUsers});
        });
    });
});


router.get('/playerByUser', requireLogin, function (req, res, next) {
    userController.getUserTeam(req.query.idUser, function (err, team) {
        res.render(path.join(__dirname, '../views/users/userTeam'), {userTeam: team});
    });
});

router.post('/changePlayer', requireLogin, function (req, res, next) {
    console.log(req.session.user._id);
    console.log('Player To:'+req.body.playerTo);
    console.log('User: '+req.body.selectedUser);
    console.log('Player From: '+req.body.playerFrom);
    userController.changePlayer(req.session.user._id, req.body.playerTo, req.body.selectedUser, req.body.playerFrom, function(err){
        res.redirect('/users/changePlayer');
    });
});

router.get('/myTeam', requireLogin, function (req, res, next) {
    userController.getUserTeam(req.session.user._id, function (err, team) {
        res.render(path.join(__dirname, '../views/users/myTeam'), {team: team});
    });
});

router.get('/logout', requireLogin, function (req, res, next) {
    req.session.regenerate(function(){
        res.redirect('/');
    });
});

router.get('/login', function (req, res, next) {
    res.render(path.join(__dirname, '../views/users/login'), {error: ""});
});

router.get('/register', function (req, res, next) {
    res.render(path.join(__dirname, '../views/users/register'), {error: ""});
});

router.post('/login', function (req, res, next) {
    userController.login(req.body.email, req.body.password, function (err, result) {
        if (result.success) {
            //req.session.regenerate(function() {
                req.session.user = result.user;
                res.redirect('/users');
            //});
        } else {
            res.render(path.join(__dirname, '../views/users/login'), {error: result.message});
        }
    });
});

router.post('/register', function (req, res, next) {
    userController.register(req.body.username, req.body.email, req.body.password, function (err, result) {
        if (result.success) {
            //req.session.regenerate(function() {
                req.session.user = result.user;
                res.redirect('/users');
            //});
        } else {
            res.render(path.join(__dirname, '../views/users/register'), {error: result.message});
        }
    });
});

function requireLogin(req, res, next) {
    if (!req.user && !req.session.user) {
        res.redirect('/users/login');
    } else {
        next();
    }
}

function requireAdminLogin (req, res, next) {
    if (!req.user && !req.session.user) {
        res.redirect('/forbidden');
    } else {
        if(!req.session.user.IsAdmin) {
            res.redirect('/forbidden');
        }
        else
            next();
    }
}

module.exports = router;
