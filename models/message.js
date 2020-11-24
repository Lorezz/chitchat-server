const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    text: String,
    pic: String,
    video: String,
    audio: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Message", schema);
