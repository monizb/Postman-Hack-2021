const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("./mailer");
const uniqid = require("uniqid"); 


const rollout = () => {

    admin.database().ref('/maillist/').once("value").then(function(snapshot){
        try{
            console.log(snapshot.val());
            let mailObj = snapshot.exportVal();
            console.log(mailObj);
            
            
            for (const key in mailObj) {
                console.log(key);
                admin.database().ref(`/maillist/${key}/status`).once("value").then(function(snapshot) {
                    let email = key.split("_").join(".");
                        const mailOptions = {
                            from: "postman.hack@techstax.co", // sender address
                            to: email,//monish2.basaniwal@gmail.com//address
                            subject: "", // Subject line
                            html: "", // plain text body
                        };
                    if(snapshot.val() ==="user"){
                        mailOptions.subject = "DAILY DIGEST",
                        mailOptions.html = `<h2>Daily Digest</h2><p>HIS DAILY DIGEST <br> Dependancies`;
                        var rollOut = schedule.scheduleJob(" 0 18 * * 1-6", function(){
                            transporter.sendMail(mailOptions).then(()=>{
                                console.log("Email sent to : "+ email);
                            });

                        })
                        
                    }
                    else{
                        mailOptions.subject = "DAILY DIGEST",
                        mailOptions.html = `<h2>Daily Digest</h2><p>HIS DAILY DIGEST <br> No depedency tracking cause you are not a user`;
                        var rollOut = schedule.scheduleJob(" 0 18 * * 1-6", function(){
                            transporter.sendMail(mailOptions).then(()=>{
                                console.log("Email sent to : "+ email);
                            });

                        })
                        
                    }
                });
            }
        }
        catch{

        console.log({
            status: "mail not sent",
            error: "Either no subs or couldn't send mails"
        });
        }
    });

}


module.exports = rollout;