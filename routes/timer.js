const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");

router.get("/", (req, res) => {
    let email = req.query.email;
    const code = req.query.code;

    if (email === undefined || code === undefined) {
        res.status(401).send({
            success: false,
            error: "'email' and 'code' parameters are required"
        })
    } else {
        email = email.split(".").join("_");
        admin.database().ref("/users/" + email).once('value', function (snapshot) {
            if (snapshot.val() === null) {
                res.status(404).send({
                    success: false,
                    error: "This user does not exist"
                })
            } else if (snapshot.val().code === code) {
                res.status(201).send({
                    success: true,
                    error: "This user exists",
                    reminders: []
                })
            }
        })
    }
})

router.post("/", (req, res) => {
    res.status(200).send({
        info: "I will set a reminder"
    })
})

module.exports = router;