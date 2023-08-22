const mongoose = require("mongoose");

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI_LOCAL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Successful connecting to the database");
    } catch (error) {
        console.log(`Error connecting to Mongoose: ${error.message}`);
    }
}

module.exports = connectToDatabase;
