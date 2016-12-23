var express = require('express');
var path = require('path');
var router = express.Router();
var fs = require("fs");

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Fifa 16'});
});

router.get('/download', function (req, res, next) {
    try {
        var mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        res.writeHead(200, {'Content-Type': mimeType});

        var fileStream = fs.createReadStream(path.join(__dirname, '../public/downloads/fifa16_players.xlsx'));
        fileStream.pipe(res);
		//res.download(path.join(__dirname, '../public/downloads/fifa16_players.xlsx'));
    }
    catch (err) {
        console.log(err);
    }
});

router.get('/forbidden', function (req, res, next) {
    res.render('forbidden', {title: 'Fifa 16'});
});

module.exports = router;
