const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const path = require("path");

const storage = new GridFsStorage({
  url: process.env.MONGODB_URI_LOCAL,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const matchImage = ["image/png", "image/jpeg", "image/jpg"];
    if (matchImage.indexOf(file.mimetype) !== -1) {
      return {
        bucketName: "images",
        filename: `image-${Date.now()}${path.extname(file.originalname)}`,
      };
    }
    return undefined;
  },
});

module.exports = multer({ storage });
