const mongoose = require('mongoose');

const connectDatabase = () => {
  mongoose.connect(process.env.MONGODB_LOCAL).then(() => {
    console.log('Database connected!');
  });
};

// Exporting the function
module.exports = connectDatabase;
