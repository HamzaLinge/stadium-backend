const { Schema, models, model } = require("mongoose");

const ObjectId = Schema.Types.ObjectId;

const adSchema = new Schema(
  {
    reservation: { type: ObjectId, ref: "reservations", required: true },
    team_number: { type: Number, required: true },
    team_phone: { type: String, required: true },
    status: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

module.exports = models.ads || model("ads", adSchema);
