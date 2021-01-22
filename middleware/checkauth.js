const express = require("express");
const admin = require("firebase-admin");

module.exports = (req, res, next) => {
    try {
            let email = req.query.email;
            let code = req.query.code;
            if (email === undefined || code === undefined) {
                res.status(401).send({
                    success: false,
                    error: "'email' and 'code' parameters are required"
                });
            }
        
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
    catch{
        return res.status(401).json({
            message: 'Auth failed!'
    });

    }
}