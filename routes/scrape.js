var express = require('express');
var path = require('path');
var scrapeController = require('../controller/scrapeController');

var router = express.Router();

/* GET home page. */
router.get('/', requireAdminLogin, function(req, res, next) {
    res.render(path.join(__dirname, '../views/scrape/scrape'), { });
});

router.get('/export', requireAdminLogin, function(req, res, next) {
    scrapeController.exportPlayer();
    res.json({ message: "Export Started" });
});

router.get('/start', requireAdminLogin, function(req, res, next) {
    scrapeController.processScraping();
    res.render(path.join(__dirname, '../views/scrape/scraping-process'), { });
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