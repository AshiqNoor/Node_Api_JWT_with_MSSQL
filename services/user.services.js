const config = require('../config/dbconfig');
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth.js");
const otpGenerator = require("otp-generator");

const sql = require('mssql/msnodesqlv8');
const crypto = require("crypto");
var msg91 = require("msg91")("1", "1", "1");

async function login({ username, password }, callback) {
  try {

    var con = await sql.connect(config);

    sql.connect(config, err => {
      if (err) {
        return callback(err.message);
      }
      else {

        let selectQuery = 'UserLogin';
        con.request().input('username', sql.VarChar, username).execute(selectQuery, (err, data) => {

          if (err) {
            console.log(err.message);
            return callback(err.message);
          }
          else {
            if (data.recordset[0].total == 0) {
              return callback({ message: "Invalid Username/Password!" });
            }
            else {
              try {
                if (bcrypt.compareSync(password, data.recordset[0].password)) {
                  const token = auth.generateAccessToken(username);
                  return callback(null, { token });
                }
                else {
                  return callback({ message: "Invalid Password" });
                }
              }

              catch (err) {
                return callback({ message: "Invalid Username/Password!" });
              }
            }
          }

        });
      }
    });
  }
  catch (err) {
    return callback(err.message);
  }

}

async function register(params, callback) {


  if (params.username === undefined) {
    console.log(params.username);
    return callback(
      {
        message: "Username Required",
      },

    );
  }
  if (params.password === undefined) {
    console.log(params.password);
    return callback(
      {
        message: "password Required",
      },

    );
  }
  if (params.roll === undefined) {
    console.log(params.roll);
    return callback(
      {
        message: "Roll Required",
      },

    );
  }
  var con = await sql.connect(config);
  let selectQuery = 'select count(*) as "total" from Login where username=@username';
  con.request().input('username', sql.VarChar, params.username).query(selectQuery, (err, data) => {
    if (err) {
      return callback(err.message);
    }
    else {
      if (data.recordset[0].total > 0) {
        return callback({ message: "Username already exist!" });;
      }
      else {
        let insertQuery = 'insert into Login (username, password, roll) values (@username, @password, @roll)';
        con.request().input('username', sql.VarChar, params.username).input('password', sql.VarChar, params.password).input('roll', sql.VarChar, params.roll).query(insertQuery, (err, data) => {
          if (err) {
            return callback(err.message);
          }
          else {
            return callback(null, { message: "User Register Successfully" });
          }
        });


      }
    }
  });

}


async function getstock(callback) {
  var con = await sql.connect(config);
  let selectQuery = 'SELECT * FROM Stock';
  con.request().query(selectQuery, (err, data) => {
    if (err) {
      return callback(err.message);
    }
    else {
      return callback(null, data.recordset);
    }
  })

}














async function createNewOTP(params, callback) {
  // Generate a 4 digit numeric OTP
  const otp = otpGenerator.generate(4, {
    alphabets: false,
    upperCase: false,
    specialChars: false,
  });
  const ttl = 5 * 60 * 1000; //5 Minutes in miliseconds
  const expires = Date.now() + ttl; //timestamp to 5 minutes in the future
  const data = `${params.phone}.${otp}.${expires}`; // phone.otp.expiry_timestamp
  const hash = crypto.createHmac("sha256", process.env.KEY).update(data).digest("hex"); // creating SHA256 hash of the data
  const fullHash = `${hash}.${expires}`; // Hash.expires, format to send to the user
  // you have to implement the function to send SMS yourself. For demo purpose. let's assume it's called sendSMS
  //sendSMS(phone, `Your OTP is ${otp}. it will expire in 5 minutes`);

  console.log(`Your OTP is ${otp}. it will expire in 5 minutes`);

  var otpMessage = `Dear Customer, ${otp} is the One Time Password ( OTP ) for your login.`;

  msg91.send(`+91${params.phone}`, otpMessage, function (err, response) {
    console.log(response);
  });

  return callback(null, fullHash);
}

async function verifyOTP(params, callback) {
  // Separate Hash value and expires from the hash returned from the user
  let [hashValue, expires] = params.hash.split(".");
  // Check if expiry time has passed
  let now = Date.now();
  if (now > parseInt(expires)) return callback("OTP Expired");
  // Calculate new hash with the same key and the same algorithm
  let data = `${params.phone}.${params.otp}.${expires}`;
  let newCalculatedHash = crypto
    .createHmac("sha256", process.env.KEY)
    .update(data)
    .digest("hex");
  // Match the hashes
  if (newCalculatedHash === hashValue) {
    return callback(null, "Success");
  }
  return callback("Invalid OTP");
}

module.exports = {
  login,
  register, getstock,
  createNewOTP,
  verifyOTP,
};
