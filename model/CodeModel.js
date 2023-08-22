const { Schema, models, model } = require("mongoose");

const ObjectId = Schema.Types.ObjectId;

const codeSchema = new Schema(
  {
    user: { type: ObjectId, ref: "users", required: true },
    code: { type: Number, required: true },
    expireAt: { type: Number },
    consumed: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

codeSchema.pre("save", async function (next) {
  this.expireAt = new Date(new Date().getTime() + 60 * 60 * 1000);
  next();
});

module.exports = models.codes || model("codes", codeSchema);
