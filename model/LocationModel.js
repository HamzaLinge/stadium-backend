const { Schema, models, model } = require("mongoose");

const locationSchema = new Schema({
  city: { type: String, required: true },
  population: { type: Number, required: false },
});

module.exports = models.locations || model("locations", locationSchema);
