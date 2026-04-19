const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    const email = "krupa.ecommerce@gmail.com";
    let user = await User.findOne({ email });
    if (user) {
      user.role = "admin";
      user.name = "krupanagendra";
      await user.save();
      console.log(`Updated user ${email} to admin.`);
    } else {
      user = new User({
        name: "krupanagendra",
        email: email,
        password: "password123", // placeholder password
        role: "admin"
      });
      await user.save();
      console.log(`Created new admin user ${email} with password 'password123'.`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
