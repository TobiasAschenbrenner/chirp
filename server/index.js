const express = require("express");
const { connect } = require("mongoose");
require("dotenv").config();

const configureApp = require("./app");

const app = configureApp(express());
const port = process.env.PORT || 3000;

connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(port, () => console.log(`Server running on port ${port}`));
  })
  .catch((error) => console.error(error));
