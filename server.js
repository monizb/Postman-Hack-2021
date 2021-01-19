////////////////// Imports //////////////////

require('dotenv').config()
const express = require("express");
const body = require("body-parser");
const admin = require("firebase-admin");
var serviceAccount = require("./firebase-admin-key.json");

const timerRouter = require("./routes/timer.js");

/////////////////////////////////////////////

////////////////// Configs //////////////////

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://postman-10943-default-rtdb.firebaseio.com"
});

const app = express();
app.use(body.json());

/////////////////////////////////////////////

///////////// Global Constants /////////////

const PORT = process.env.PORT

/////////////////////////////////////////////

app.use("/api/timer", timerRouter);

app.listen(PORT, () => { console.log(`Server listening on port: ${PORT}`) });




