var mongoose = require('mongoose');
var models = require('../models/settingModel')(mongoose);
var sController = module.exports = {};

sController.getCurrentSettings = function (callback) {
    models.Setting.findOne({ }, function (err, settings) {
        callback(err, settings);
    });
};

sController.saveSettings = function (addPlayers, callback) {
    models.Setting.findOne({ }, function (err, settings) {
        if(!settings)
        {
            settings = new models.Setting();
        }
        settings.AddPlayers = addPlayers;
        settings.save(function(err){
            callback(err, settings);
        });
    });
};