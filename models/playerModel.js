module.exports = function(mongoose) {
    var PlayerSchema = mongoose.Schema({
        ID: String,
        Link: String,
        Name: String,
        FullName: String,
        Nationality: String,
        Team: String,
        Age: String,
        Weight: String,
        Height: String,
        Foot: String,
        Position: String,
        OverallRating: String,
        IsAvailable: Boolean,
        Attacking: {
            Crossing: Number,
            Finishing: Number,
            HeadingAccuracy: Number,
            ShortPassing: Number,
            Volleys: Number
        },
        Skill: {
            Dribbling: Number,
            Curve: Number,
            FreeKickAccuracy: Number,
            LongPassing: Number,
            BallControl: Number
        },
        Movement: {
            Acceleration: Number,
            SprintSpeed: Number,
            Agility: Number,
            Reactions: Number,
            Balance: Number
        },
        Power: {
            ShotPower: Number,
            Jumping: Number,
            Stamina: Number,
            Strength: Number,
            LongShots: Number
        },
        Mentality: {
            Aggression: Number,
            Interceptions: Number,
            Positioning: Number,
            Vision: Number,
            Penalties: Number
        },
        Defending: {
            Marking: Number,
            StandingTackle: Number,
            SlidingTackle: Number
        },
        GoalKeeping:{
            GKDiving: Number,
            GKHandling: Number,
            GKKicking: Number,
            GKPositioning: Number,
            GKReflexes: Number
        }
    });

    var models = { Player: mongoose.model('Player', PlayerSchema) };
    return models;
}