////////////////// Imports //////////////////

require('dotenv').config()
const express = require("express");
const body = require("body-parser");
const admin = require("firebase-admin");
var serviceAccount = require("./firebase-admin-key.json");

const timerRouter = require("./routes/timer.js");
const newsRoute = require("./routes/newsletter");
const dependRoute = require("./routes/dependancy");
<<<<<<< Updated upstream
const personRoute = require("./routes/persongenerator");
const mailRollOut = require("./mailrollout");
=======
const vaultRoute = require("./routes/vault");
const mailRollOut = require("./mailrollout"); 
>>>>>>> Stashed changes
const { urlencoded } = require('body-parser');

/////////////////////////////////////////////

////////////////// Configs //////////////////

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://postman-10943-default-rtdb.firebaseio.com"
});

const app = express();
app.use(body.json());
app.use(body.urlencoded({ extended: false }));

/////////////////////////////////////////////

///////////// Global Constants /////////////

const PORT = process.env.PORT

/////////////////////////////////////////////
mailRollOut();
app.use("/api/reminder", timerRouter);
app.use("/api/dependency", dependRoute);
app.use("/api/news", newsRoute);
<<<<<<< Updated upstream
app.use("/api/generator", personRoute);
=======
app.use("/api/vault", vaultRoute);
>>>>>>> Stashed changes

app.listen(PORT, () => { console.log(`Server listening on port: ${PORT}`) });




