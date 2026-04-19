const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    
    // Find all users who might have been given prime manually. e.g. vishwa
    let user = await User.findOne({ name: new RegExp('^vishwa$', 'i') });
    
    if (user) {
      user.isPremium = false;
      user.primeTier = null;
      user.premiumSince = null;
      await user.save();
      console.log(`Successfully removed manual Prime Membership from user: ${user.name} (${user.email}). They will now have to earn it via orders.`);
    } else {
      console.log(`User 'vishwa' not found.`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
