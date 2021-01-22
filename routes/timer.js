const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const schedule = require("node-schedule");

//chechauth import
const chechAuth = require('../middleware/checkauth');

router.get("/", chechAuth, (req, res) => {
    
})

router.post("/", (req, res) => {
    let email = req.query.email;
    email = email.split(".").join("_");
    admin.database().ref("/users/"+ email).push({
        email: email,
        value: "placeholder value"
    });
    res.status(200).send({
        info: "I will set a reminder"
    })
});

module.exports = router;