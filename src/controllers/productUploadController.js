export const uploadProductImageController = async (req, res, next) => {
  // Logic to save file information to the database and handle file path will go here
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file provided." });
  }

  res.status(200).json({
    success: true,
    message: "Product image uploaded successfully.",
    fileName: req.file.filename,
    filePath: req.file.path
  });
};