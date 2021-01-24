const express = require("express");
const admin = require("firebase-admin");
const schedule = require("node-schedule");
const createTemplate = require("./htmltemplate");
const transporter = require("./mailer");


const rollout = () => {
    var rollOut = schedule.scheduleJob(" 0 18 * * 1-6", function () {
        let mailOptions = {
            from: "postman.hack@techstax.co", // sender address
            to: "",
            subject: "", // Subject line
            html: "", // plain text body
        };
        const subscribed = [];
        admin.database().ref("/maillist").once("value").then(function (snapshot) {
            const emails = Object.values(snapshot.val());
            for (var email in emails) {
                subscribed.push(emails[email].email);
            }
            for (let email in subscribed) {
                let checked_email = subscribed[email].split(".").join("_");
                admin.database().ref("/users/" + checked_email).once("value").then(function (snapshot) {
                    if (snapshot.val() === null) {
                        mailOptions.subject = "Today's newsletter has arrived!"
                        mailOptions.to = subscribed[email];
                        mailOptions.html = createTemplate(`Daily Newsletter`, `Hey, this is your daily newsletter! Since you aren't a user and dont have any reminders or dependency alerts yet, this space is empty`)
                        transporter.sendMail(mailOptions).then(() => {
                            console.log("Email sent to : " + subscribed[email]);
                        });
                    } else {
                        admin.database().ref("/reminders/" + checked_email).once("value").then(function (reminders) {
                            admin.database().ref("/dependencies/" + checked_email).once("value").then(function (dependencies) {
                                mailOptions.subject = "Today's newsletter has arrived!"
                                mailOptions.to = subscribed[email];
                                let html = `Hey, this is your daily newsletter! Below you can also find all your pending reminders and tracked dependencies <br/><br/>`
                                if (reminders.val() !== null && dependencies.val() !== null) {
                                    html += ` <h3>Reminders</h3><br/>`
                                    const rem_arr = Object.values(reminders.val());
                                    const dep_arr = Object.values(dependencies.val());
                                    for (let rem in rem_arr) {
                                        if (rem_arr[rem].passed === false) {
                                            html += `${rem_arr[rem].date[0]}/${rem_arr[rem].date[1]}/${rem_arr[rem].date[2]} @ ${rem_arr[rem].time[0]}:${rem_arr[rem].time[1]} for: ${rem_arr[rem].purpose === undefined ? "No Purpose Given" : rem_arr[rem].purpose} <br/>`
                                        }
                                    }

                                    html += "<br/><h3>Dependencies Tracked</h3><br/>"
                                    for (let dep in dep_arr) {
                                        html += `${dep_arr[dep].pkgName}:${dep_arr[dep].latestVer} <br />`
                                    }
                                }
                                html += "<br/><br/>"
                                mailOptions.html = createTemplate(`Daily Newsletter`, html)
                                transporter.sendMail(mailOptions).then(() => {
                                    console.log("Email sent to : " + subscribed[email]);
                                });
                            })
                        })

                    }

                })
            }
        })
    })
}


module.exports = rollout;