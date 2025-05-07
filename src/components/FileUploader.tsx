import React, { ChangeEvent } from "react";
import { parseExcelFile } from "../utils/xlsxParser";
import "../styles/fileUploader.css";

interface FileUploaderProps {
  onDataParsed: (data: any[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataParsed }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Only CSV or Excel files are allowed.");
        return;
      }

      parseExcelFile(file, (parsedData: any[]) => {
        onDataParsed(parsedData);
      });
    }
  };

  return (
    <div className="file-uploader">
      <div className="file-upload-title">Upload a CSV/Excel File</div>
      <label className="upload-label">
        Import File
        <input
          type="file"
          accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          className="file-input"
        />
      </label>
    </div>
  );
};

export default FileUploader;
