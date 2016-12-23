var express = require('express');
var path = require('path');
var draftController = require('../controller/draftController');
var settingsController = require('../controller/settingsController');

var router = express.Router();

router.get('/currentDraftOrder', function(req, res, next){
    draftController.getCurrentDraftResult(function(err, result){
        res.render(path.join(__dirname, '../views/draft/currentDraftOrder'), { draftResult: result });
    });
});

router.get('/cancel', function(req, res, next){
    draftController.cancelCurrentDraftRound(function(err, result){
        res.render(path.join(__dirname, '../views/draft/cancel'));
    });
});

router.get('/allTeams', function(req, res, next){
    draftController.getAllUsersTeams(function(err, result){
        res.render(path.join(__dirname, '../views/draft/allTeams'), { users: result });
    });
});

router.get('/draftTeam', requireAdminLogin, function(req, res, next) {
    draftController.createNewDraftTeam(function(err, result){
        res.render(path.join(__dirname, '../views/draft/newDraft'), { draftResult: result });
    });
});

router.get('/newDraft', requireAdminLogin, function(req, res, next) {
    draftController.createNewDraft(function(err, result){
        res.render(path.join(__dirname, '../views/draft/newDraft'), { draftResult: result });
    });
});

router.get('/resetDraft', requireAdminLogin, function(req, res, next) {
    draftController.resetAll(function(err, result){
        res.render(path.join(__dirname, '../views/draft/resetConfirm'), { draftResult: result });
    });
});

router.get('/autocompletePlayers', requireLogin, function(req, res, next){
    draftController.getPlayersByTextAndDraftFilter(req.query.query, function(err, result){
        res.jsonp({ query: req.query.query, suggestions: result.players });
    });
});

router.get('/selectPlayer', requireLoginAndTurn, function(req, res, next){
    res.render(path.join(__dirname, '../views/draft/selectPlayer'), {error: ""});
});

router.post('/selectPlayer', requireLoginAndTurn, function(req, res, next){
    draftController.confirmPlayerSelectionAndContinue(req.body.selectedPlayerId, function(err, result){
        res.redirect('/users/myTeam');
    })
});

router.get('/addPlayer', requireLogin, function(req, res, next){
    settingsController.getCurrentSettings(function(err, settings){
        res.render(path.join(__dirname, '../views/draft/addPlayer'), {settings: settings});
    });
});

router.post('/addPlayer', requireLogin, function(req, res, next){
    draftController.addNewPlayer(req.body.selectedPlayerId, req.session.user._id, function(err){
        res.redirect('/users/myTeam');
    })
});

function requireLogin (req, res, next) {
    if (!req.user && !req.session.user) {
        res.redirect('/users/login');
    } else {
        next();
    }
}

function requireLoginAndTurn (req, res, next) {
    if (!req.user && !req.session.user) {
        res.redirect('/users/login');
    } else {
        if(req.session.IsUserTurn){
            next();
        }
        else{
            res.redirect('/users');
        }
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