const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    let user = await User.findOne({ email: "krupa.nagendra423@gmail.com" });
    if (user) {
      console.log("User ALREADY EXISTS in the database!");
      console.log(user);
    } else {
      console.log("User does NOT exist in the database.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
