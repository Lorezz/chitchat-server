const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    nick: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pic: String,
    first_name: {
      type: String,
    },
    last_name: {
      type: String,
    },
    hash: {
      type: String,
      unique: true,
    },
    pin: {
      type: String,
    },
    verifyed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", schema);
