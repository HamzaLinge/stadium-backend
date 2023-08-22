const mongoose = require("mongoose");
const Grid = require("gridfs-stream");

const conn = mongoose.connection;
let gfs, gridfsBucket;
conn.once("open", () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "images",
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("images");
});

const filesController = {
  filename: async (req, res) => {
    try {
      if (!req.params.filename) {
        return res
          .status(400)
          .send({ success: false, msg: "Filename parameter is missing" });
      }
      const file = await gfs.files.findOne({ filename: req.params.filename });
      if (!file)
        return res.status(404).send({
          success: false,
          msg: `There's no image found for filename: ${req.params.filename}`,
        });
      const readStream = gridfsBucket.openDownloadStream(file._id);
      readStream.pipe(res);
    } catch (errorGettingFileByFilename) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting file by filename",
      });
    }
  },
  delete: async (req, res) => {
    try {
      if (!req.params.filename) {
        return res
          .status(400)
          .send({ success: false, msg: "Filename parameter is missing" });
      }
      const file = await gfs.files.findOne({ filename: req.params.filename });
      if (!file)
        return res({
          success: false,
          msg: `There's no image found for filename: ${req.params.filename}`,
        });
      res.status(200).send({ success: true });
    } catch (errorGettingFileByFilename) {
      return res.status(500).send({
        success: false,
        msg: "Something went wrong during getting file by filename",
      });
    }
  },
};

module.exports = filesController;
