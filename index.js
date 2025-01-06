// Importing the packages (express)
const express = require('express');
const connectDatabase = require('./database/database');
const dotenv = require('dotenv');
const cors = require('cors');
const accessFromData = require('express-fileupload');

// Creating an express app
const app = express();

// Express Json Config
app.use(express.json());

app.use(express.static('./public'));

// express fileupload
app.use(accessFromData());

//  cors configuration
const corsOptions = {
  origin: true,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// dotenv Configuration
dotenv.config();

// Connecting to database
connectDatabase();

// Defining the port
const PORT = process.env.PORT;

// Making a test endpoint
// Endpoints : POST, GET, PUT , DELETE
app.get('/test', (req, res) => {
  res.send('Test API is Working!....');
});

// Configuring Routes of User
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/project', require('./routes/projectRoutes'));
app.use('/api/list', require('./routes/listRoutes'));
app.use('/api/task', require('./routes/taskRoutes'));

// http://localhost:5000/api/user
// http://localhost:5000/test

// Starting the server (always at the last)
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}....`);
});

// testing

module.exports = app;
