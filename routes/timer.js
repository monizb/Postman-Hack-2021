const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("../mailer");
const uniqid = require("uniqid");

//chechauth import
const chechAuth = require('../middleware/checkauth');

router.get("/", chechAuth, (req, res) => {
    let data = req.body;
    data.email = data.email.split(".").join("_");
    admin.database().ref("/users/" + data.email).once('value', function (snapshot) {
        if (snapshot.val() === null) {
            res.status(404).send({
                success: false,
                error: "This user does not exist"
            })
        } else if (snapshot.val().code === data.code) {
            admin.database().ref("/reminders/" + data.email).once('value').then(function (snapshot) {
                res.status(201).send({
                    success: true,
                    meggae: "",
                    reminders: snapshot.val()
                })
            })

        } else {
            res.status(500).send({
                success: false,
                error: "'code' paramenter is missing or invalid"
            })
        }
    })
})

router.post("/", chechAuth, (req, res) => {
    let data = req.body;
    const email = data.email;
    data.email = data.email.split(".").join("_");
    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };
    admin.database().ref(`users/${data.email}/code`).once("value").then(function (snapshot) {
        if (snapshot.val() === null) {
            let code = uniqid();
            mailOptions.subject = "Secret Code To Set Reminders"
            mailOptions.html = "<p>Hey,please use the below given code everytime this email id is used to set a reminder</p><br/><h2>" + code + "</h2>"
            mailOptions.to = email;
            transporter.sendMail(mailOptions).then((err, info) => {
                admin.database().ref(`users/${data.email}`).update({ code: code }).then(() => {
                    res.status(200).send({
                        success: true,
                        message: "We have sent a unique code to your email, please pass that code as a 'code' parameter"
                    })
                })
            })
        } else {
            if (data.code === undefined || snapshot.val() !== data.code) {
                res.status(401).send({
                    success: false,
                    error: "'code' is either missing or invalid"
                })
            } else {
                if (data.time === undefined || data.date === undefined) {
                    res.status(500).send({
                        success: false,
                        error: "'date' and 'time' parameters are required"
                    })
                } else {
                    const dates = data.date.split("/");
                    const time = data.time.split(":");
                    var datereg = /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|(([1][26]|[2468][048]|[3579][26])00))))$/g;
                    var timereg = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
                    if (!(datereg.test(data.date))) {
                        res.status(500).send({
                            success: false,
                            error: "Invalid date provided, use the format: dd/mm/yyyy"
                        })
                    } else if (!(timereg.test(data.time))) {
                        res.status(500).send({
                            success: false,
                            error: "Invalid time provided, use the format: hh:mm"
                        })
                    } else {
                        var date = new Date(Number(dates[2]), Number(dates[1]) - 1, Number(dates[0]), Number(time[0]), Number(time[1]), 0);
                        if ((Date.parse(date) - Date.parse(new Date())) > 0) {
                            let job_id = uniqid();
                            global['job' + job_id] = schedule.scheduleJob(date, function () {
                                console.log("job started");
                                mailOptions.subject = data.purpose === undefined ? "Alert: A reminder has been triggered" : "Alert: " + data.purpose + " reminder has been triggered"
                                mailOptions.html = "<h2>Reminder!</h2>"
                                mailOptions.to = email;
                                transporter.sendMail(mailOptions).then((err, info) => {
                                    admin.database().ref(`reminders/${data.email}/${job_id}`).update({
                                        passed: true,
                                    })
                                    console.log("done!");
                                })
                            });
                            admin.database().ref(`reminders/${data.email}/${job_id}`).set({
                                job_id: job_id,
                                date: date,
                                time: time,
                                passed: false,
                                email: email
                            })
                            res.status(200).send({
                                success: true,
                                message: "Reminder Set",
                                job_id: job_id,
                                date: date,
                                time: time,
                                purpose: data.purpose || null
                            })
                        } else {
                            res.status(500).send({
                                success: false,
                                error: "You cannot set a reminder for a past date"
                            })
                        }
                    }
                }
                // res.status(200).send({
                //     success: true,
                //     message: "Awesome, correct code provided"
                // })
            }
        }
    })

});

module.exports = router;