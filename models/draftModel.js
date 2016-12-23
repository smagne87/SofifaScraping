module.exports = function(mongoose) {
    var DraftSchema = mongoose.Schema({
        RoundNumber: Number,
        IsActive: Boolean,
        PlayerPosition: String,
        Users: [{
            _IdUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            _IdPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
            Order: Number,
            Selected: Boolean
        }]
    });

    var TempUserSchema = mongoose.Schema({
        _IdUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        RandomOrder: Number
    });

    var models = {
        Draft: mongoose.model('Draft', DraftSchema),
        TempUser: mongoose.model('TempUser', TempUserSchema)
    };
    return models;
}