var express = require('express');
var path = require('path');
var settingsController = require('../controller/settingsController');

var router = express.Router();

/* Settings Home. */
router.get('/', requireAdminLogin, function (req, res, next) {
    settingsController.getCurrentSettings(function (err, result) {
        res.render(path.join(__dirname, '../views/setting/index'), {settings: result});
    });
});

router.post('/save', requireAdminLogin, function (req, res, next) {
    settingsController.saveSettings(req.body.addPlayers, function (err, result) {
        res.redirect('/setting/');
    });
});

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
