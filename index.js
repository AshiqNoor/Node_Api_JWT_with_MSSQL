const express = require("express");
const app = express();
require('dotenv').config(); 

const auth = require("./middlewares/auth.js");
const errors = require("./middlewares/errors.js");
const router = require("./routes/users.routes")
const unless = require("express-unless");

auth.authenticateToken.unless = unless;
app.use(
  auth.authenticateToken.unless({
    path: [
      { url: "/api/v1/login", methods: ["POST"] },
      { url: "/api/v1/register", methods: ["POST"] },
      { url: "/api/v1/otpLogin", methods: ["POST"] },
      { url: "/api/v1/verifyOTP", methods: ["POST"] },
    ],
  })
);

app.use(express.json());

app.use("/api/v1", router);

app.use(errors.errorHandler);


const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log('Server started at port:' +port);
});