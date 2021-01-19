////////////////// Imports //////////////////

const express = require("express");
const body = require("body-parser");
const firebase = require("firebase-admin");

/////////////////////////////////////////////

////////////////// Configs //////////////////

const firebaseConfig = {
    apiKey: process.env.KEY,
    authDomain: process.env.DOMAIN,
    projectId: process.env.ID,
    storageBucket: process.env.BUCKET,
    messagingSenderId: process.env.SENDER,
    appId: process.env.APPID,
    measurementId: process.env.MEASUREMENT,
    databaseURL: process.env.DBURL
};

const app = express();
app.use(body.json());
firebase.initializeApp(firebaseConfig);

/////////////////////////////////////////////

///////////// Global Constants /////////////

const PORT = process.env.PORT || 3000

/////////////////////////////////////////////


app.listen(PORT, () => { console.log(`Server listening on port: ${PORT}`) });


app.get("/", (req, res) => {
    res.status(200).send("Hello World");
})


