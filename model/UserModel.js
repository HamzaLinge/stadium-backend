const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ObjectId = mongoose.Schema.Types.ObjectId;

const userSchema = new mongoose.Schema(
  {
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    birthday: { type: Date, required: true },
    role: {
      type: String,
      required: true,
      enum: ["PLAYER", "OWNER", "ADMIN"],
      default: "PLAYER",
    },
    picture: { type: String, required: true, default: "" },
    code: { type: ObjectId, ref: "codes", default: undefined },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  this.password = bcrypt.hashSync(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compareSync(enteredPassword, this.password);
};

module.exports = mongoose.models.users || mongoose.model("users", userSchema);
