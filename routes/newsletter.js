const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const uniqid = require("uniqid");
const transporter = require("../mailer");
const createTemplate = require("../htmltemplate");

//checkAuth import 
const chechAuth = require('../middleware/checkauth');

router.get("/check", (req, res) => {
    const data = req.body;
    if (data.email === undefined) {
        res.status(500).send({
            success: false,
            error: "'email' parameter is required"
        })
    } else {
        const email = data.email;
        data.email = data.email.split(".").join("_");
        admin.database().ref("/maillist/" + data.email).once("value").then(function (snapshot) {
            if (snapshot.val() === null) {
                res.status(200).send({
                    success: true,
                    message: "You have not subscribed to the maillist, use the /subscribe route to subscribe!"
                })
            } else {
                res.status(200).send({
                    success: true,
                    message: "You are subscribed to the maillist, awesome!"
                })
            }
        })
    }
})

router.post("/subscribe", (req, res) => {
    const data = req.body;
    const mailOptions = {
        from: "postman.hack@techstax.co", // sender address
        to: "",
        subject: "", // Subject line
        html: "", // plain text body
    };
    if (data.email === undefined) {
        res.status(500).send({
            success: false,
            error: "'email' parameter is required"
        })
    } else {
        const email = data.email;
        data.email = data.email.split(".").join("_");
        admin.database().ref("/maillist/" + data.email).once("value").then(function (snapshot) {
            if (snapshot.val() === null) {
                admin.database().ref("/maillist/" + data.email).set({
                    email: email
                }).then(() => {
                    admin.database().ref(`users/${data.email}/code`).once("value").then(function (snapshot) {
                        const code = uniqid();
                        mailOptions.subject = "Secret Code To Unsubscribe"
                        mailOptions.html = createTemplate(`Secret Code`, `Hey,please use the below given code everytime this email id is used to set a reminder/dependancy tracking or to unsubscribe from the newsletters <br /><br /> <h2>${code}</h2>`)
                        mailOptions.to = email;
                        if (snapshot.val() === null) {
                            admin.database().ref(`users/${data.email}`).update({ code: code }).then(() => {
                                transporter.sendMail(mailOptions).then((err, info) => {
                                    res.status(201).send({
                                        success: true,
                                        message: `${email}, has been subscribed to the maillist!`
                                    })
                                })
                            })
                        } else {
                            res.status(201).send({
                                success: true,
                                message: `${email}, has been subscribed to the maillist!`
                            })
                        }
                    })
                }).catch(err => {
                    res.status(500).send({
                        success: false,
                        message: `${email}, could not be subscribed please retry`
                    })
                })
            } else {
                res.status(500).send({
                    success: false,
                    message: `${email}, is already subscribed to the list!`
                })
            }
        })
    }
})

router.post("/unsubscribe", (req, res) => {
    const data = req.body;
    if (data.email === undefined || data.code === undefined) {
        res.status(500).send({
            success: false,
            error: "'email' and 'code' parameters are required"
        })
    } else {
        const email = data.email;
        data.email = data.email.split(".").join("_");
        admin.database().ref("/users/" + data.email).once("value").then(function (user) {
            admin.database().ref("/maillist/" + data.email).once("value").then(function (snapshot) {
                if (snapshot.val() === null) {
                    res.status(200).send({
                        success: true,
                        message: "You have not subscribed to the maillist, use the /subscribe route to subscribe!"
                    })
                } else {
                    if (user.val().code === data.code) {
                        admin.database().ref("/maillist/" + data.email).remove().then(() => {
                            res.status(200).send({
                                success: true,
                                message: "You have been unsubscribed from the mail list, sorry to see you go :("
                            })
                        })
                    } else {
                        res.status(401).send({
                            success: false,
                            error: "Invalid Authorization Code Provided"
                        })
                    }


                }
            })
        })
    }
})



module.exports = router;