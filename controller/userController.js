var mongoose = require('mongoose');
var models = require('../models/userModel')(mongoose);
var jade = require('jade');
var path = require('path');
var emailHelper = require('../helpers/emailHelper');

var uController = module.exports = {};

uController.login = function (email, password, callback) {
    var result = {
        success: true,
        message: "",
        user: {}
    };
    models.User.findOne({Email: email}, function (err, user) {
        if (!user) {
            result.message = 'Invalid email or password.';
            result.success = false;
        } else {
            if (password === user.Password) {
                result.user = user;
            } else {
                result.message = 'Invalid email or password.';
                result.success = false;
            }
        }
        callback(err, result);
    });
};

uController.register = function (username, email, password, callback) {
    var result = {
        success: true,
        message: "",
        user: {}
    };
    models.User.findOne({$or: [{Email: email}, {Username: username}]}, function (err, user) {
        if (user) {
            result.success = false;
            result.message = 'Username or email already taken!';
            callback(err, result);
        } else {
            var u = new models.User();
            u.Email = email;
            u.Password = password;
            u.Username = username;
            u.IsAdmin = false;
            u.WasFirst = false;
            u.save(function (err) {
                if (err) {
                    console.log(err);
                    result.success = false;
                    result.message = 'Unexpected error!';
                }
                else {
                    result.user = u;
                }
                callback(err, result);
            });
        }
    });
};

uController.deleteUser = function(userId, callback){
    var result = {
        success: true,
        message: ""
    };
    models.User.findOne({ _id: userId }).populate('Team.Players._IdPlayer').exec(function(err, user){
        if(err) console.log(err);
        var players = [];
        for(var i = 0; i < user.Team.Players.length; i++){
            players.push(user.Team.Players[i]._IdPlayer._id);
        }
        mongoose.models.Player.update( { _id: {$in: players}}, {IsAvailable: true}, {multi: true}, function (err) {
            if (err) console.log(err);
            models.User.remove({ _id: userId }, function(err){
                if (err) console.log(err);

                result.success = true;
                result.message = "User deleted successfully!!!";
                callback(err, result);
            });
        });
    });
};

uController.getAllUsers = function(callback){
    models.User.find({}, function(err, users){
        if(err) console.log(err);

        callback(err, users);
    });
};

uController.getUserTeam = function (userId, callback) {
    var team = [];
    models.User.findOne({ _id: userId }).populate('Team.Players._IdPlayer').exec(function(err, user){
        if(err) console.log(err);

        callback(err, user.Team);
    });
};

uController.changePlayer = function(idUserTo, idPlayerTo, idUserFrom, idPlayerFrom, callback){
    models.User.findOne({ _id: idUserTo }, function(err, userTo) {
        if (err) console.log(err);
        var teamTo = [];
        for(var i = 0; i < userTo.Team.Players.length; i++){
            var currentPlayerId = userTo.Team.Players[i];
            if(currentPlayerId._IdPlayer.toString() === idPlayerTo){
                currentPlayerId._IdPlayer = idPlayerFrom;
            }
            teamTo.push(currentPlayerId);
        }
        models.User.update({ _id: idUserTo }, { 'Team.Players': teamTo }, function(err){
            models.User.findOne({ _id: idUserFrom }, function(err, userFrom) {
                if (err) console.log(err);

                var teamFrom = [];
                for(var i = 0; i < userFrom.Team.Players.length; i++){
                    var currentPlayerId = userFrom.Team.Players[i];
                    if(currentPlayerId._IdPlayer.toString() === idPlayerFrom){
                        currentPlayerId._IdPlayer = idPlayerTo;
                    }
                    teamFrom.push(currentPlayerId);
                }
                models.User.update({ _id: idUserFrom }, { 'Team.Players': teamFrom }, function(err){
                    uController.getAllUsers(function(err, users){
                        var emails = "";
                        for (i = 0; i < users.length; i++) {
                            var item = users[i];
                            if (emails === "") {
                                emails = item.Email;
                            }
                            else {
                                emails += ',' + item.Email;
                            }
                        }
                        mongoose.models.Player.findOne({ _id: idPlayerTo }, function(err,playerTo){
                            mongoose.models.Player.findOne({ _id: idPlayerFrom}, function(err,playerFrom){
                                jade.renderFile(path.join(__dirname, '../views/email/changePlayerEmail.jade'), {
                                    userFromName: userFrom.Username,
                                    userToName: userTo.Username,
                                    playerToName: playerTo.Name,
                                    playerFromName: playerFrom.Name
                                }, function (err, htmlEmail) {
                                    emailHelper.sendEmail(emails, htmlEmail, 'Fifa', function (err, info) {
                                        if (err)console.log(err);
                                        callback(err);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

uController.getUserByEmail = function (email, callback) {
    var result = {
        success: true,
        message: "",
        user: {}
    };
    models.User.findOne({Email: email}, function (err, user) {
        if (!user) {
            result.success = false;
        } else {
            result.user = user;
        }
        callback(err, result);
    });
};