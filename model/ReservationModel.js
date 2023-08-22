const { Schema, models, model } = require("mongoose");

const ObjectId = Schema.Types.ObjectId;

const reservationSchema = new Schema(
  {
    team_name: { type: String, required: true },
    date: { type: Date, required: true },
    // time_duration: { type: Number, required: true }, // Per Hour
    time: {
      type: {
        from: {
          type: String,
          validate: {
            validator: function (v) {
              return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: (props) => `${props.value} is not a valid time!`,
          },
        },
        to: {
          type: String,
          validate: {
            validator: function (v) {
              return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: (props) => `${props.value} is not a valid time!`,
          },
        },
      },
      required: true,
    }, // Per Hour
    status: {
      type: String,
      required: true,
      default: "HOLD",
      enum: ["HOLD", "ACCEPTED", "DECLINED"],
    },
    player: { type: ObjectId, ref: "users", required: true },
    stadium: { type: ObjectId, ref: "stadiums", required: true },
  },
  { timestamps: true }
);

module.exports =
  models.reservations || model("reservations", reservationSchema);
