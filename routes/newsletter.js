const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("../mailer");
const uniqid = require("uniqid");

//checkAuth import 
const chechAuth = require('../middleware/checkauth');

router.get('/check', (req, res) => {
    let data = req.body;
    const email = data.email;
    data.email = data.email.split(".").join("_");
    let code = data.code;
    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: email,//monish2.basaniwal@gmail.com//address
        subject: "", // Subject line
        html: "", // plain text body
    };

   admin.database().ref(`/maillist/${data.email}/status`).once("value").then((snapshot) => {
        if(snapshot.val()==="user"){
            admin.database().ref(`/dependencies/${data.email}/${code}`).once("value").then((snapshot) => {
                if(snapshot.val()===null){
                    mailOptions.subject = "Daily Digest";
                    mailOptions.html = `<h2>Daily Digest</h2><p>HIS DAILY DIGEST <br> Dependancies : 0 No dependencies Tracked</p>`; // add latest dependency updates
                    transporter.sendMail(mailOptions).then(() => {
                        res.status(201).send({
                            status: "You are a subcriber!",
                            email: email
                        });
                    });
                }
                else {
                    let dependURL = [];

                    let dependObj = snapshot.exportVal();
                    var dependNum = new Number;
                    for (const key in dependObj) {
                        dependNum = dependURL.push(key);
                    }
                    mailOptions.subject = "Daily Digest";
                    mailOptions.html = `<h2>Daily Digest</h2><p>HIS DAILY DIGEST <br> Dependancies : ${dependNum} <br> ${dependObj}No dependencies Tracked</p>`; // add latest dependency updates
                    transporter.sendMail(mailOptions).then(() => {
                        res.status(201).send({
                            status: "You are a subcriber!",
                            email: email
                        });
                    });
                }
                
            });
        }
        else{
            mailOptions.to = databody.email;
            mailOptions.subject= "Daily Digest";
            mailOptions.html = `<h2>Daily Digest</h2><p> DAILY DIGEST <br>Daily digest and latest dependancy news every day at time: {integrate time}</p>`;
            transporter.sendMail(mailOptions).then(function(){
                            res.status(201).send({
                                status: "Daily digest sent to mail",
                                email: email
                            });
                        });

        }
   });



});

router.delete('/subscribe', chechAuth, (req,res) => {   
        const data = req.body;
        let email = data.email.split(".").join("_");

        const mailOptions = {
            from: "postman.hack@techstax.co", // sender address
            to: data.email,//monish2.basaniwal@gmail.com//address
            subject: "", // Subject line
            html: "", // plain text body
        };
        try{
            admin.database().ref(`/maillist/${email}`).set({}).then(() => {
                mailOptions.subject = "Removed from maillist";
                mailOptions.html = "<h2>We're sorry to see you GO!</h2><p> Unscribed from maillist </p>";
                transporter.sendMail(mailOptions).then(() => {
                    res.status(200).send({
                        status: "unsubcribed",
                        message: "sad to see you go"
                    });
                })
            });
        }
        catch{
            res.status(404).send({
                status: "not removed",
                error: "user doesn't exist in our maillist, Maybe Subscribe"
            });

        }

})

router.post('/subscribe', ( req, res) => {
    const databody = req.body;

    let email = req.body.email.split(".").join("_");

    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",//monish2.basaniwal@gmail.com//address
        subject: "", // Subject line
        html: "", // plain text body
    };



    admin.database().ref(`/users/${email}`).once("value")
                    .then(function(snapshot) {
                         if(snapshot.val()===null){
                             admin.database().ref(`/maillist/${email}`).set({
                                 email: email,
                                 status: "non-user"
                             });
                        mailOptions.to = databody.email;
                        mailOptions.subject= "Subscribed to Maillist";
                        mailOptions.html = `<h2>Welcome to maillist</h2><p>you will have Daily digest and latest dependancy news every day at time: {integrate time}</p>`;
                        transporter.sendMail(mailOptions).then(function(){
                            res.status(201).send({
                                status: "Subcribed! to Daily digest",
                                email: email
                            });
                        });
        }
        else{
                admin.database().ref(`/maillist/${email}`).set({
                    email: email,
                    status: "user"
                });
                admin.database().ref(`/dependencies/${email}`).once("value").then((data) => {
                   if(data.val()===null){
                       mailOptions.to = databody.email;
                       mailOptions.subject = "Subscribed to Maillist";
                       mailOptions.html= "<h2>Welcome to the mailist</h2><p>You will get daily digest without dependency updates because you haven't tracked any dependencies. add dependencies to your tracker to have it updated on your mailist</p>";
                        transporter.sendMail(mailOptions).then(() => {
                            res.status(201).send({
                                status: "subcribed to Maillist without dependancy updates",
                                email: email
                            });
                        });                       
                   }
                   else{
                    let dependURL = [];

                    let dependObj = data.exportVal();
                    var dependNum = new Number;
                    for (const key in dependObj) {
                        dependNum = dependURL.push(key);
                    }
                    mailOptions.to = databody.email;
                    mailOptions.subject = "Daily Digest ++ dependancy updates";
                    mailOptions.html = `<h2>Daily Digest</h2><h2>Dependancies: ${dependNum}</h2><p>HIS DAILY DIGEST <br> Dependancies : ${dependObj}</p>`; // add latest dependency updates
                    transporter.sendMail(mailOptions).then(() => {
                        res.status(201).send({
                            status: "subcribed to Maillist with dependancy updates",
                            email: email
                        });
                    });
                   }
                });


        }
    });


    
});



module.exports = router;