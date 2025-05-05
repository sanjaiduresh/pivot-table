import React from "react";
import { parseExcelFile } from "../utils/xlsxParser";
import "../styles/fileUploader.css"

export default function FileUploader({ onDataParsed }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseExcelFile(file, (parsedData) => {
        onDataParsed(parsedData);
      });
    }
  };

  return (
<div className="file-uploader">
      <label className="upload-label">
        Import File
        <input
          type="file"
          onChange={handleFileChange}
          className="file-input"
        />
      </label>
    </div>
  );
}
