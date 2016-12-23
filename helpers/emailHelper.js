var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var emailHelper = module.exports = {};

emailHelper.sendEmail = function(emails, body, subject, callback){
    var transporter = nodemailer.createTransport(smtpTransport({
        service: 'Gmail',
        auth: {
            user: 'smagne.87@gmail.com',
            pass: 'Seba871312*'
        }
    }));

    var mailOptions = {
        from: 'smagne.87@gmail.com', // sender address
        to: emails, // list of receivers
        subject: subject, // Subject line
        html: body // html body
    };

// send mail with defined transport object
    transporter.sendMail(mailOptions, function(err, info){
        if(err){
            console.log(err);
        }
        callback(err, info);
    });
};