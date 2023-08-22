const LocationModel = require("../model/LocationModel");
const tunisianCities = require("./tn.json");

async function addTunisianCities() {
  try {
    for (let i = 0; i < tunisianCities.length; i++) {
      await LocationModel.create({
        city: tunisianCities[i].city,
        population: tunisianCities[i].population,
      });
    }
    console.log("The Tunisian Cities have been added");
  } catch (errorAddingTunisianCities) {
    console.log("Something went wrong when adding TUNISIAN CITIES");
    console.log(errorAddingTunisianCities);
  }
}
module.exports = addTunisianCities;
