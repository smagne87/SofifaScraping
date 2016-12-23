module.exports = function(mongoose) {
    var SettingSchema = mongoose.Schema({
        AddPlayers: Boolean
    });

    var models = { Setting: {} };
    if(!mongoose.model.Setting){
        models.Setting = mongoose.model('Setting', SettingSchema);
    }
    return models;
}