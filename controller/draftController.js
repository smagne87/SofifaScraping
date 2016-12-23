var mongoose = require('mongoose');
var draftModels = require('../models/draftModel')(mongoose);
var async = require('async');
var dController = module.exports = {};
var jade = require('jade');
var path = require('path');
var emailHelper = require('../helpers/emailHelper');
var uController = require('../controller/userController')

dController.cancelCurrentDraftRound = function(callback){
    draftModels.Draft.update({IsActive: true}, {IsActive: false}, {multi: true}, function (err) {
        callback(err);
    });
};

dController.addNewPlayer = function(selectedPlayerId, idUser, callback){
    mongoose.models.User.findOne({_id: idUser}, function (err, user) {
        if (err) console.log(err);
        user.Team.Players.push({
            _IdPlayer: mongoose.Types.ObjectId(selectedPlayerId),
            RoundSelected: 0,
            OrderSelected: 0
        });
        user.save(function (err) {
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
                mongoose.models.Player.findOne({ _id: selectedPlayerId }, function(err, selectedPlayer){
                    jade.renderFile(path.join(__dirname, '../views/email/addNewPlayer.jade'), {
                        username: user.Username,
                        playerName: selectedPlayer.Name
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
};

dController.getAllUsersTeams = function (callback) {
    mongoose.models.User.find({}).populate('Team.Players._IdPlayer').exec(function (err, users) {
        if (err) console.log(err);

        callback(err, users);
    });
};

dController.resetAll = function(callback){
    var result = {
        success: false,
        message: "Unexpected error",
        users: []
    };
    mongoose.models.User.update({ }, {WasFirst: false, Team: {}}, {multi: true}, function (err) {
        if (err) console.log(err);
        mongoose.models.Player.update({ }, {IsAvailable: true}, {multi: true}, function (err) {
            if (err) console.log(err);
            draftModels.Draft.remove({ }, function(err){
                if (err) console.log(err);

                result.success = true;
                result.message = "Reset all completed successfully!!!";
                callback(err, result);
            });
        });
    });
};

dController.confirmPlayerSelectionAndContinue = function (selectedPlayerId, callback) {
    var result = {
        success: true,
        message: ""
    };
    draftModels.Draft.findOne({IsActive: true}).populate('Users._IdUser').exec(function (err, draft) {
        if (err) console.log(err);

        var currentUserId = null;
        var i = 0;
        var idSubDocUsers = null;
        while (currentUserId == null) {
            var user = draft.Users[i];
            idSubDocUsers = user._id;
            if (!user.Selected) {
                currentUserId = user._IdUser;
            }
            i++;
        }
        draft.Users.id(idSubDocUsers)._IdPlayer = mongoose.Types.ObjectId(selectedPlayerId);
        draft.Users.id(idSubDocUsers).Selected = true;
        var draftFinished = true;
        for (i = 0; i < draft.Users.length; i++) {
            var user = draft.Users[i];
            if (!user.Selected) {
                draftFinished = false;
            }
        }
        if (draftFinished) {
            draft.IsActive = false;
        }
        var draftId = draft._id;
        draft.save(function (err) {
            if (err) console.log(err);
            mongoose.models.Player.update({_id: mongoose.Types.ObjectId(selectedPlayerId)}, {IsAvailable: false}, function (err) {
                if (err) console.log(err);
                mongoose.models.User.findOne({_id: currentUserId._id}, function (err, user) {
                    if (err) console.log(err);
                    user.Team.Players.push({
                        _IdPlayer: mongoose.Types.ObjectId(selectedPlayerId),
                        RoundSelected: draft.RoundNumber,
                        OrderSelected: draft.Users.id(idSubDocUsers).Order
                    });
                    user.save(function (err) {
                        if (err) console.log(err);
                        draftModels.Draft.findOne({_id: draftId}).populate('Users._IdUser').populate('Users._IdPlayer').exec(function (err, draftActive) {
                            var users = [];
                            var emails = "";
                            for (i = 0; i < draftActive.Users.length; i++) {
                                var item = draftActive.Users[i];
                                if (emails === "") {
                                    emails = item._IdUser.Email;
                                }
                                else {
                                    emails += ',' + item._IdUser.Email;
                                }
                                if (item.Selected) {
                                    users.push({Username: item._IdUser.Username, PlayerName: item._IdPlayer.Name});
                                }
                                else {
                                    users.push({Username: item._IdUser.Username, PlayerName: ""});
                                }
                            }
                            jade.renderFile(path.join(__dirname, '../views/email/emailTemplate.jade'), {
                                draftRound: draftActive.RoundNumber,
                                draftPosition: draftActive.PlayerPosition,
                                users: users
                            }, function (err, htmlEmail) {
                                if (err) {
                                    console.log(err);
                                    callback(err, result);
                                }
                                emailHelper.sendEmail(emails, htmlEmail, 'Next Turn', function (err, info) {
                                    if (err)console.log(err);
                                    callback(err, result);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

dController.getPlayersByTextAndDraftFilter = function (searchTerm, callback) {
    var result = {
        success: true,
        message: "",
        players: []
    };
    draftModels.Draft.findOne({IsActive: true}).exec(function (err, draft) {
        if (err) {
            console.log(err);
        }
        if (draft) {
            mongoose.models.Player.find({
                IsAvailable: true,
                Position: draft.PlayerPosition,
                Name: new RegExp(searchTerm, "i")
            }).sort({Name: 1}).limit(20).exec(function (err, players) {
                if (err) console.log(err);

                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    result.players.push({
                        data: player._id,
                        value: player.Name + ' (' + player.Team + ' OR:' + player.OverallRating + ')'
                    });
                }
                callback(err, result);
            });
        }
        else {
            mongoose.models.Player.find({
                IsAvailable: true,
                Name: new RegExp(searchTerm, "i")
            }).sort({Name: 1}).limit(20).exec(function (err, players) {
                if (err) console.log(err);

                for (var i = 0; i < players.length; i++) {
                    var player = players[i];
                    result.players.push({
                        data: player._id,
                        value: player.Name + ' (' + player.Team + ' OR:' + player.OverallRating + ')'
                    });
                }
                callback(err, result);
            });
        }
    });
};

dController.getActiveDraft = function (callback) {
    var result = {
        success: true,
        message: "",
        draft: {}
    };
    draftModels.Draft.findOne({IsActive: true}).populate('Users._IdUser').populate('Users._IdPlayer').exec(function (err, draft) {
        if (err) {
            result = fireUnexpectedError(err);
        }
        if (draft) {
            result.draft = draft;
        }
        else {
            result.success = false;
            result.message = "There is no active draft";
        }
        callback(err, result);
    });
};

dController.getCurrentDraftResult = function(callback){
  draftModels.Draft.findOne({IsActive: true}).populate('Users._IdUser').populate('Users._IdPlayer').exec(function (err, draftActive) {
    callback(err, draftActive);
  });
};

dController.createNewDraft = function (callback) {
    var result = {
        success: true,
        message: "",
        users: []
    };
    //draftModels.Draft.remove({ }, function(err){
    draftModels.Draft.findOne({IsActive: true}, function (err, draft) {
        if (err) {
            result = fireUnexpectedError(err);
            callback(err, result);
        }
        if (draft) {
            //if(err){
            result.success = false;
            result.message = "There is a draft active";
            callback(err, result);
        }
        else {//new draft must be created

            //getting users that wasn't first
            mongoose.models.User.find({WasFirst: false}, function (err, noFirstUsers) {
                if (err) {
                    result = fireUnexpectedError(err);
                    callback(err, result);
                }

                if (noFirstUsers.length === 0) {
                    mongoose.models.User.update({WasFirst: true}, {WasFirst: false}, {multi: true}, function (err) {
                        if (err) {
                            result = fireUnexpectedError(err);
                            callback(err, result);
                        }
                        mongoose.models.User.find({WasFirst: false}, function (err, noFirstUsers) {
                            processNewDraft(callback, noFirstUsers);
                        });
                    });
                }
                else {
                    processNewDraft(callback, noFirstUsers);
                }
            });
        }
    });
};

dController.createNewDraftTeam = function (callback) {
    var result = {
        success: true,
        message: "",
        users: []
    };
    //draftModels.Draft.remove({ }, function(err){
    draftModels.Draft.update({IsActive: true}, {IsActive: false}, {multi: true}, function (err) {
        if (err) {
            result = fireUnexpectedError(err);
            callback(err, result);
        }
         mongoose.models.User.update({WasFirst: true}, {WasFirst: false}, {multi: true}, function (err) {
            if (err) {
                result = fireUnexpectedError(err);
                callback(err, result);
            }
            mongoose.models.User.find({WasFirst: false}, function (err, noFirstUsers) {
                processNewDraft(callback, noFirstUsers);
            });
        });
    });
};

function processNewDraft(callback, noFirstUsers) {
    var result = {
        success: true,
        message: "",
        users: []
    };

    //Droping TempUsers Collection
    draftModels.TempUser.remove({}, function (err) {
        if (err) console.log(err);

        var userIds = [];
        for (var i = 0; i < noFirstUsers.length; i++) {
            var user = noFirstUsers[i];
            var tempUser = new draftModels.TempUser();
            tempUser._IdUser = user._id;
            tempUser.RandomOrder = Math.random();
            userIds.push(tempUser);
        }

        //Inserting all user ids
        async.mapLimit(userIds, 10, function (document, next) {
            document.save(next);
        }, function (err) {
            if (err) {
                result = fireUnexpectedError(err);
                callback(err, result);
            }

            //Get one user order by dynamic _id
            draftModels.TempUser.findOne({}).sort({RandomOrder: 1}).exec(function (err, firstUser) {
                if (err) {
                    result = fireUnexpectedError(err);
                    callback(err, result);
                }

                mongoose.models.User.update({'_id': firstUser._IdUser}, {'WasFirst': true}, function (err) {
                    if (err) console.log(err);

                    //Get all the user except of the first
                    mongoose.models.User.find({_id: {'$ne': firstUser._IdUser}}, function (err, restOfUsers) {
                        if (err) {
                            result = fireUnexpectedError(err);
                            callback(err, result);
                        }

                        userIds = [];
                        for (var i = 0; i < restOfUsers.length; i++) {
                            var user = restOfUsers[i];
                            var tempUser = new draftModels.TempUser();
                            tempUser._IdUser = user._id;
                            tempUser.RandomOrder = Math.random();
                            userIds.push(tempUser);
                        }

                        //Droping TempUsers Collection again
                        draftModels.TempUser.remove({}, function (err) {
                            if (err) console.log(err); //ignore the error because the collection doesn't exists

                            //Inserting rest of users
                            async.mapLimit(userIds, 10, function (document, next) {
                                document.save(next);
                            }, function (err) {
                                if (err) {
                                    result = fireUnexpectedError(err);
                                    callback(err, result);
                                }

                                //Get users order by dynamic _id
                                draftModels.TempUser.find({}).sort({RandomOrder: 1}).exec(function (err, restTempUsers) {
                                    if (err) {
                                        result = fireUnexpectedError(err);
                                        callback(err, result);
                                    }

                                    draftModels.Draft.findOne({}).sort({RoundNumber: -1}).exec(function (err, draft) {
                                        if (err) {
                                            result = fireUnexpectedError(err);
                                            callback(err, result);
                                        }

                                        var draftPosition = "Arquero";//first round
                                        var roundNumber = 1;
                                        if (draft) {
                                            roundNumber = draft.RoundNumber + 1;
                                            draftPosition = getDraftPosition(roundNumber);
                                        }
                                        var newDraft = new draftModels.Draft();
                                        newDraft.RoundNumber = roundNumber;
                                        newDraft.PlayerPosition = draftPosition;
                                        newDraft.IsActive = true;

                                        var usersInDraft = [];
                                        var orderUsersInDraft = 1;
                                        usersInDraft.push({
                                            _IdUser: firstUser._IdUser,
                                            Order: orderUsersInDraft,
                                            Selected: false
                                        });
                                        for (var i = 0; i < restTempUsers.length; i++) {
                                            var user = restTempUsers[i];
                                            orderUsersInDraft++;
                                            usersInDraft.push({
                                                _IdUser: user._IdUser,
                                                Order: orderUsersInDraft,
                                                Selected: false
                                            });
                                        }

                                        newDraft.Users = usersInDraft;
                                        newDraft.save(function (err) {
                                            if (err) {
                                                result = fireUnexpectedError(err);
                                                callback(err, result);
                                            }
                                            else {
                                                draftModels.Draft.findOne({IsActive: true}).populate('Users._IdUser').populate('Users._IdPlayer').exec(function (err, draftActive) {
                                                    var users = [];
                                                    var emails = "";
                                                    for (i = 0; i < draftActive.Users.length; i++) {
                                                        var item = draftActive.Users[i];
                                                        if (emails === "") {
                                                            emails = item._IdUser.Email;
                                                        }
                                                        else {
                                                            emails += ',' + item._IdUser.Email;
                                                        }
                                                        if (item.Selected) {
                                                            users.push({
                                                                Username: item._IdUser.Username,
                                                                PlayerName: item._IdPlayer.Name
                                                            });
                                                        }
                                                        else {
                                                            users.push({
                                                                Username: item._IdUser.Username,
                                                                PlayerName: ""
                                                            });
                                                        }
                                                    }
                                                    jade.renderFile(path.join(__dirname, '../views/email/emailTemplate.jade'), {
                                                        draftRound: draftActive.RoundNumber,
                                                        draftPosition: draftActive.PlayerPosition,
                                                        users: users
                                                    }, function (err, htmlEmail) {
                                                        emailHelper.sendEmail(emails, htmlEmail, 'New Round', function (err, info) {
                                                            if (err)console.log(err);
                                                            result.users = users;
                                                            result.message = "New Draft round created";
                                                            callback(err, result);
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function getDraftPosition(count) {
    switch (count) {
        case 1:
        case 12:
            return "Arquero";
        case 2:
        case 5:
        case 8:
        case 10:
        case 13:
        case 16:
            return "Defensor";
        case 3:
        case 6:
        case 9:
        case 11:
        case 14:
        case 17:
            return "Medio";
        case 4:
        case 7:
        case 15:
        case 18:
            return "Delantero";
        default:
            return "Any";
    }
}

function fireUnexpectedError(err) {
    var result = {
        success: false,
        message: "Unexpected error",
        users: []
    };
    console.log(err);
    return result;
}
