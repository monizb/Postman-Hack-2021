const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/checkauth");
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const transporter = require("../mailer");
var npmpackage = require('npm-package-info');
const uniqid = require("uniqid");
const createTemplate = require("../htmltemplate");


router.get('/track', checkAuth, (req, res) => {
    let data = req.body;
    data.email = data.email.split(".").join("_");
    admin.database().ref("/users/" + data.email).once('value', function (snapshot) {
        if (snapshot.val() === null) {
            res.status(404).send({
                success: false,
                error: "This user does not exist"
            })
        } else if (snapshot.val().code === data.code) {
            admin.database().ref("/dependencies/" + data.email).once('value').then(function (snapshot) {
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

router.get('/info', checkAuth, (req, res) => {
    const data = req.body;
    if (data.pkgName === undefined) {
        res.status(500).send({
            success: false,
            error: "'pkgName' parameter is required to get details"
        });
    } else {
        npmpackage(data.pkgName, function (err, pkg) {
            if (err) {
                res.status(500).send({
                    success: false,
                    error: err.message
                });
            } else {
                res.status(200).send({
                    success: true,
                    info: pkg
                });
            }

        })
    }
})

router.post('/track', checkAuth, (req, res) => {
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
            mailOptions.subject = "Secret Code To Set Dependency Tracking"
            mailOptions.html = createTemplate(`Secret Code`, `Hey,please use the below given code everytime this email id is used to set a reminder/dependancy tracking <br /><br /> <h2>${code}</h2>`)
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
                if (data.pkgName === undefined) {
                    res.status(500).send({
                        success: false,
                        error: "'pkgName' parameter is required to set a tracker"
                    });
                } else {
                    npmpackage(data.pkgName, function (err, pkg) {
                        const job_id = uniqid();
                        global['job' + job_id] = schedule.scheduleJob('*/5 * * * *', function () {
                            const id = job_id;
                            npmpackage(data.pkgName, function (err, pkg) {
                                admin.database().ref("dependencies/" + data.email + "/" + id).once('value').then(function (snapshot) {
                                    if (pkg["dist-tags"].latest === snapshot.val().latestVer) {
                                        mailOptions.subject = `ALERT: ${data.pkgName} has undergone a change in version`
                                        mailOptions.html = createTemplate(`Dependency Alert`, `Hey, the package ${data.pkgName} has undergone a change in version, please find all the details below <br/><br/><h3>${snapshot.val().latestVer} ======> ${pkg["dist-tags"].latest}</h3><br /> <br /> Check out this package here: https://npmjs.org/package/${data.pkgName}`)
                                        mailOptions.to = email
                                        transporter.sendMail(mailOptions).then((err, info) => {
                                            admin.database().ref(`users/${data.email}`).update({ latestVer: pkg["dist-tags"].latest }).then(() => {
                                                console.log("dependency alert gone");
                                            })
                                        })
                                    }
                                })
                            })
                        });
                        admin.database().ref("dependencies/" + data.email + "/" + job_id).set({
                            job_id: job_id,
                            email: email,
                            pkgName: data.pkgName,
                            latestVer: pkg["dist-tags"].latest
                        }).then(() => {
                            res.status(200).send({
                                success: true,
                                message: "",
                                job_id: job_id,
                                email: email,
                                pkgName: data.pkgName,
                            })
                        })
                    })
                }
            }
        }
    });
});


module.exports = router;