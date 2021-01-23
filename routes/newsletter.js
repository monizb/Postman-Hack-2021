const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("../mailer");
const uniqid = require("uniqid");

//checkAuth import 
const chechAuth = require('../middleware/checkauth');

router.get('/check', (req, res) => {
    let body = req.body;
    let email = body.email;
    let code = body.code;
    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "pratheek.p.shetty@gmail.com",//monish2.basaniwal@gmail.com//address
        subject: "", // Subject line
        html: "", // plain text body
    };

    if(code === undefined){
        mailOptions.subject = "Daily Digest included",
        mailOptions.html = "<h2>Daily Digest</h2><p> Here is your Daily Digest to access dependancy tracker you must become a user.</p>";
        admin.database().ref('/temp/' + email).once('value', function(snapshot){
            if(snapshot.val ===null)
            {
                res.status(400).send({
                    status: "user does not exist",
                    error: "you aren't subscribed to the mailist, subscribe now with" + req.get('host')+'/api/news/subscribe'
                });
            }
            else{
                transporter.sendMail(mailOptions).then(() => {
                    res.status(201).send({
                        status: "email sent with daily digest",
                        email: email
                    });
                })
            }
        })
        

    }
    else{
        if(admin.database().ref(`/users/${email}/code`).isEqual(code)){
            admin.database().ref(`/users/${email}/dependancies`).once("value")
                    .then(function(snapshot){
                        if(snapshot.val()===null){
                            mailOptions.subject = "Daily Digest Newsletter";
                            mailOptions.html = "<h2>Daily Digest</h2><br><p>if you want to be able to track dependancies Add depednacies to your tracker. Dependacy information will be available in this exact mail</p>" //daiky digest template with no dependacy information
                            transporter.sendMail(mailOptions).then(() =>{
                                res.status(201).send({
                                    status: "email sent without dependancy updates",
                                    email: email
                                });
                            })
                        }
                        else{
                            let dependURL = [];
                            let dependObj = snapshot.exportVal();
                            for (const key in dependObj) {
                               dependURL.push(key);
                            }
                            mailOptions.subject = "Daily Digest ++ dependancy updates";
                            mailOptions.html = `<h2>Daily Digest</h2><p>HIS DAILY DIGEST</p><h2>Dependancies</h2>`;
                            transporter.sendMail(mailOptions).then(() =>{
                                res.status(201).send({
                                    status: "email sent with dependancy updates",
                                    email: email
                                });
                            })
                        }
                    });

        }
        else{
            res.status(406).send({
                status: "not sent, re-enter code",
                error: "incorrect code"
            });
        }
        

    }

});

router.post('/subscribe', ( req, res) => {

    let email = req.body.email.split(".").join("_")

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "pratheek.p.shetty@gmail.com",//monish2.basaniwal@gmail.com//address
        subject: "", // Subject line
        html: "", // plain text body
    };

    try{
    admin.database().ref(`/users/${email}/dependancies`).once("value")
                    .then(function(snapshot){
                        if(snapshot.val()===null){
                            mailOptions.subject = "Daily Digest Newsletter";
                            mailOptions.html = "<h2>Subscribed to Daily Digest</h2><br><p>if you want to be able to track dependancies Add depednacies to your tracker. Dependacy information will be available in this exact mail</p>" //daiky digest template with no dependacy information
                            transporter.sendMail(mailOptions).then(() => {
                                res.status(201).send({
                                    status: "Subcribed! to Daily digest",
                                    email: email
                                });
                            });
                        }
                        else{
                            let dependURL = [];
                            let dependObj = snapshot.exportVal();
                            for (const key in dependObj) {
                               dependURL.push(key);
                            }
                            mailOptions.subject = "Daily Digest ++ dependancy updates";
                            mailOptions.html = `<h2>Daily Digest</h2><p>HIS DAILY DIGEST</p><h2>Dependancies</h2>`;
                            transporter.sendMail(mailOptions).then(() => {
                                res.status(201).send({
                                    status: "subcribed to Maillist with dependancy updates",
                                    email: email
                                });
                            })
                        }
                    });
                }
                catch{
                    
                    mailOptions.subject = "Subscribed to Mail list Daily Digest ",
                    mailOptions.html = "<h2>Daily Digest</h2><p> You have been subscribed to the maillist but to access dependancy tracker you must become a user.</p>";
                    transporter.sendMail(mailOptions).then((err,info) => {
                        admin.database().ref(`/temp/`).push({email: email}).then(() => {
                            res.status(200).send({
                                status: "suscribed",
                                user: "non user"
                            });
                        })
                    })

                }
    
});



module.exports = router;