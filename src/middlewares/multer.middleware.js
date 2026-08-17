import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)  // user ne je file nu name rakhyu te
  }
})

export const upload = multer({
    storage, 
})