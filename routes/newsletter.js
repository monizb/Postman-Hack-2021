const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

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
                    res.status(201).send({
                        success: true,
                        message: `${email}, has been subscribed to the maillist!`
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
                admin.database().ref("/maillist/" + data.email).remove().then(() => {
                    res.status(200).send({
                        success: true,
                        message: "You have been unsubscribed from the mail list, sorry to see you go :("
                    })
                })

            }
        })
    }
})



module.exports = router;