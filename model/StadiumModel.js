const { Schema, models, model } = require("mongoose");

const ObjectId = Schema.Types.ObjectId;

const stadiumSchema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: ObjectId, ref: "users", required: true },
    price: { type: Number, required: true }, // The Tunisian currency : Tunisian Dinar
    description: { type: String, required: true },
    location: { type: ObjectId, ref: "locations", required: true },
    opening_hours: {
      type: {
        from: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: (props) => `${props.value} is not a valid time!`,
          },
        },
        to: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: (props) => `${props.value} is not a valid time!`,
          },
        },
      },
      required: true,
    },
    opening_days: {
      type: {
        monday: { type: Boolean, required: true, default: false },
        tuesday: { type: Boolean, required: true, default: false },
        wednesday: { type: Boolean, required: true, default: false },
        thursday: { type: Boolean, required: true, default: false },
        friday: { type: Boolean, required: true, default: false },
        saturday: { type: Boolean, required: true, default: false },
        sunday: { type: Boolean, required: true, default: false },
      },
      required: true,
    },
    thumbnail: { type: String, required: true },
    likes: {
      type: [{ type: ObjectId, ref: "users" }],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = models.stadiums || model("stadiums", stadiumSchema);
