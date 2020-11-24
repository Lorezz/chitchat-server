const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: String,
    description: String,
    people: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    connected: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Room", schema);
