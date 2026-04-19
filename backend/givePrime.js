const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to DB");
    
    // Find user by name ignoring case
    let user = await User.findOne({ name: new RegExp('^vishwa$', 'i') });
    
    if (user) {
      user.isPremium = true;
      user.primeTier = "platinum";
      user.premiumSince = new Date();
      await user.save();
      console.log(`Successfully granted Prime Membership (Platinum) to user: ${user.name} (${user.email}).`);
    } else {
      console.log(`User 'vishwa' not found. Please ensure they have registered an account.`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
