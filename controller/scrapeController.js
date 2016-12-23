var cheerio = require('cheerio');
var request = require('request');
var mongoose = require('mongoose');
var models = require('../models/playerModel')(mongoose);
var json2csv = require('json2csv');
var fs = require('fs-extra');
var iconv = require('iconv-lite');

var controller = module.exports = {};

controller.processScraping = function(){
    var baseUrl = 'http://sofifa.com/players?column=oa&sort=desc&offset=';
    var url = '';
    var playersUrlError = [];
    var offset = 0;
    var playerCount = 0;
    do{
        url = baseUrl + offset;
        request(url, function(error, response, html){
            if(!error){
                var $ = cheerio.load(html);
                var pageUrl = this.uri.path;
                $('table.main tr td:nth-child(4) a').each(function(){
                    var data = $(this);
                    var playerUrl = 'http://sofifa.com' + data.attr('href') + '?units=mks';
                    var playerName = data.text();
                    var _id = data.attr('href').replace("/player/", "");
                    var prefPos = data.parent().parent().find('td:nth-child(6) a').first().text();
                    var pos = "";
                    switch(prefPos){
                        case "GK":
                            pos = "Arquero";
                            break;
                        case "LWB":
                        case "LB":
                        case "CB":
                        case "RB":
                        case "RWB":
                        case "SW":
                            pos = "Defensor";
                            break;
                        case "CAM":
                        case "LM":
                        case "CM":
                        case "RM":
                        case "CDM":
                            pos = "Medio";
                            break;
                        case "LW":
                        case "ST":
                        case "RW":
                        case "LF":
                        case "CF":
                        case "RF":
                            pos = "Delantero";
                            break;
                    }
                    models.Player.findOne( { 'ID': _id }, "Name ID", function(err, player) {
                        if (err)
                            console.log(err);
                        if (player == null) {
                            request(playerUrl, function(error, response, html){
                                if(!error && response.statusCode == 200) {
                                    var $jquery = cheerio.load(html);
                                    $jquery('.minus').remove();
                                    $jquery('.plus').remove();
                                    var p = new models.Player();
                                    p.Link = "http://sofifa.com" + this.uri.pathname;
                                    p.ID = this.uri.pathname.replace("/player/", "");
                                    p.FullName = $jquery(".content div.header").text().substring(0, $jquery(".content div.header").text().indexOf('(')).trim();
                                    p.Name = playerName;
                                    p.Position = pos;
                                    p.OverallRating = $jquery("div.cards").eq(0).find("ul.pl").eq(0).find("span").eq(0).text();
                                    p.Nationality = $jquery(".content div.meta").first().find("i").attr("title");
                                    p.Team = $jquery("div.player-team").first().find('a').first().text();
                                    var generalInfo = $jquery(".content div.description").first().find("p").text().split(" ");
                                    p.Age = generalInfo[1];
                                    p.Height = generalInfo[5];
                                    p.Weight = generalInfo[6];
                                    p.Foot = $jquery('label:contains("Preferred Foot")').parent().text().replace($jquery('label:contains("Preferred Foot")').text(), "").trim();
                                    p.Attacking.Crossing = $jquery("div.cards").eq(1).find("ul.pl").eq(0).find("span").eq(0).text();
                                    p.Attacking.Finishing = $jquery("div.cards").eq(1).find("ul.pl").eq(0).find("span").eq(1).text();
                                    p.Attacking.HeadingAccuracy = $jquery("div.cards").eq(1).find("ul.pl").eq(0).find("span").eq(2).text();
                                    p.Attacking.ShortPassing = $jquery("div.cards").eq(1).find("ul.pl").eq(0).find("span").eq(3).text();
                                    p.Attacking.Volleys = $jquery("div.cards").eq(1).find("ul.pl").eq(0).find("span").eq(4).text();
                                    p.Skill.Dribbling = $jquery("div.cards").eq(1).find("ul.pl").eq(1).find("span").eq(0).text();
                                    p.Skill.Curve = $jquery("div.cards").eq(1).find("ul.pl").eq(1).find("span").eq(1).text();
                                    p.Skill.FreeKickAccuracy = $jquery("div.cards").eq(1).find("ul.pl").eq(1).find("span").eq(2).text();
                                    p.Skill.LongPassing = $jquery("div.cards").eq(1).find("ul.pl").eq(1).find("span").eq(3).text();
                                    p.Skill.BallControl = $jquery("div.cards").eq(1).find("ul.pl").eq(1).find("span").eq(4).text();
                                    p.Movement.Acceleration = $jquery("div.cards").eq(1).find("ul.pl").eq(2).find("span").eq(0).text();
                                    p.Movement.SprintSpeed = $jquery("div.cards").eq(1).find("ul.pl").eq(2).find("span").eq(1).text();
                                    p.Movement.Agility = $jquery("div.cards").eq(1).find("ul.pl").eq(2).find("span").eq(2).text();
                                    p.Movement.Reactions = $jquery("div.cards").eq(1).find("ul.pl").eq(2).find("span").eq(3).text();
                                    p.Movement.Balance = $jquery("div.cards").eq(1).find("ul.pl").eq(2).find("span").eq(4).text();
                                    p.Power.ShotPower = $jquery("div.cards").eq(1).find("ul.pl").eq(3).find("span").eq(0).text();
                                    p.Power.Jumping = $jquery("div.cards").eq(1).find("ul.pl").eq(3).find("span").eq(1).text();
                                    p.Power.Stamina = $jquery("div.cards").eq(1).find("ul.pl").eq(3).find("span").eq(2).text();
                                    p.Power.Strength = $jquery("div.cards").eq(1).find("ul.pl").eq(3).find("span").eq(3).text();
                                    p.Power.LongShots = $jquery("div.cards").eq(1).find("ul.pl").eq(3).find("span").eq(4).text();
                                    p.Mentality.Aggression = $jquery("div.cards").eq(1).find("ul.pl").eq(4).find("span").eq(0).text();
                                    p.Mentality.Interceptions = $jquery("div.cards").eq(1).find("ul.pl").eq(4).find("span").eq(1).text();
                                    p.Mentality.Positioning = $jquery("div.cards").eq(1).find("ul.pl").eq(4).find("span").eq(2).text();
                                    p.Mentality.Vision = $jquery("div.cards").eq(1).find("ul.pl").eq(4).find("span").eq(3).text();
                                    p.Mentality.Penalties = $jquery("div.cards").eq(1).find("ul.pl").eq(4).find("span").eq(4).text();
                                    p.Defending.Marking = $jquery("div.cards").eq(1).find("ul.pl").eq(5).find("span").eq(0).text();
                                    p.Defending.StandingTackle = $jquery("div.cards").eq(1).find("ul.pl").eq(5).find("span").eq(1).text();
                                    p.Defending.SlidingTackle = $jquery("div.cards").eq(1).find("ul.pl").eq(5).find("span").eq(2).text();
                                    p.GoalKeeping.GKDiving = $jquery("div.cards").eq(1).find("ul.pl").eq(6).find("span").eq(0).text();
                                    p.GoalKeeping.GKHandling = $jquery("div.cards").eq(1).find("ul.pl").eq(6).find("span").eq(1).text();
                                    p.GoalKeeping.GKKicking = $jquery("div.cards").eq(1).find("ul.pl").eq(6).find("span").eq(2).text();
                                    p.GoalKeeping.GKPositioning = $jquery("div.cards").eq(1).find("ul.pl").eq(6).find("span").eq(3).text();
                                    p.GoalKeeping.GKReflexes = $jquery("div.cards").eq(1).find("ul.pl").eq(6).find("span").eq(4).text();
                                    p.save(function(err){
                                        if (err)
                                            console.log('Error');
                                        else {
                                            playerCount++;
                                            console.log('New Player: ' + playerCount);
                                        }
                                    });
                                }
                                else{
                                    console.log("Request from url: " + this.uri.path);
                                    console.log(" Error: " + error);
                                }
                            });
                        }
                    });
                });
            }
            else{
                console.log("Request from url: " + this.uri.path);
                console.log(" Error: " + error);
            }
        });
        offset = offset + 50;
    }while(offset <= 17100)
}

controller.exportPlayer = function(){
    models.Player.find({ }).limit(10).sort( { OverallRating: -1 }).exec(function(err, players){
        if(err) console.log(err);

        if(players){
            var fields = ["Name", "Weight", "Height", "Foot", "Age", "Team", "Nationality", "Link", "OverallRating", "Movement.SprintSpeed", "Movement.Acceleration", "Movement.Balance", "Movement.Agility", "Movement.Reactions", "Skill.BallControl", "Skill.LongPassing", "Skill.FreeKickAccuracy", "Skill.Curve", "Skill.Dribbling", "Attacking.Volleys", "Attacking.ShortPassing", "Attacking.HeadingAccuracy", "Attacking.Finishing", "Attacking.Crossing", "Power.LongShots", "Power.Strength", "Power.Stamina", "Power.Jumping", "Power.ShotPower", "Mentality.Penalties", "Mentality.Vision", "Mentality.Positioning", "Mentality.Interceptions", "Mentality.Aggression", "Defending.SlidingTackle", "Defending.StandingTackle", "Defending.Marking", "GoalKeeping.GKReflexes", "GoalKeeping.GKPositioning", "GoalKeeping.GKKicking", "GoalKeeping.GKHandling", "GoalKeeping.GKDiving"];
            var fieldsName = ["Name", "Weight", "Height", "Foot", "Age", "Team", "Nationality", "Link", "OverallRating", "Sprint Speed", "Acceleration", "Balance", "Agility", "Reactions", "Ball Control", "Long Passing", "Free Kick Accuracy", "Curve", "Dribbling", "Volleys", "Short Passing", "Heading Accuracy", "Finishing", "Crossing", "Long Shots", "Strength", "Stamina", "Jumping", "Shot Power", "Penalties", "Vision", "Positioning", "Interceptions", "Aggression", "Sliding Tackle", "Standing Tackle", "Marking", "GK Reflexes", "GK Positioning", "GK Kicking", "GK Handling", "GK Diving"];
            json2csv({ data: players, fields: fields, fieldNames: fieldsName, nested: true  }, function(err, csv) {
                if (err) console.log(err);
                iconv.extendNodeEncodings();
                var buff = new Buffer(csv, 'binary');
                var buff1 = new Buffer(csv, 'ucs2');
                var buff2 = new Buffer(csv, 'base64');
                var buff3 = new Buffer(csv);
                console.log(buff.toString());
                console.log(buff1.toString());
                console.log(buff2.toString());
                console.log(buff3.toString());
                try{
                    fs.writeFile('c:\\seba\\test.csv', buff3.toString(), 'ucs2', function(err) {
                        if (err) console.log(err);
                        console.log('file saved');
                    });
                }
                catch(err){
                    console.log(err);
                }
            });
       }
    });
}