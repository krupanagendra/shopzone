require('dotenv').config();
const { reportQueue } = require('../queues');

const triggerReport = async () => {
  console.log("🚀 Triggering AI Daily Report manually...");
  
  try {
    const job = await reportQueue.add({});
    console.log(`✅ Success! Job #${job.id} added to the queue.`);
    console.log("Check your terminal for [AGENT-START] AI Report Agent logs.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to trigger report:", err.message);
    process.exit(1);
  }
};

triggerReport();
