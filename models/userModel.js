module.exports = function(mongoose) {
    var UserSchema = mongoose.Schema({
        Username: String,
        Password: String,
        Email: String,
        Team: {
            TeamName: String,
            Players: [{
                _IdPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
                RoundSelected: Number,
                OrderSelected: Number
            }]
        },
        IsAdmin: Boolean,
        WasFirst: Boolean
    });

    var models = { User: {} };
    if(!mongoose.model.User){
        models.User = mongoose.model('User', UserSchema);
    }
    return models;
}