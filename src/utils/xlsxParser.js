import * as XLSX from "xlsx";

// Helper to format date as 'dd mmm yyyy'
const formatDate = (date) => {
    if (!(date instanceof Date)) return date;
    return date.toLocaleDateString("en-GB");
};

// Function to convert serialized Excel date (number) to JavaScript Date
const convertExcelDateToJSDate = (serial) => {
    const epoch = new Date(1900, 0, 1); // Excel's epoch is 1900-01-01
    const date = new Date(epoch.getTime() + (serial - 2) * 86400000); // Adjust for Excel's serial number system
    return date;
};

// Function to handle parsing Excel files
export const parseExcelFile = (file, callback) => {
    const reader = new FileReader();

    reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "array", cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });

        // Process the rows, formatting only columns that contain 'date' in their name
        const newData = jsonData.map((row) => {
            const newRow = { ...row };

            for (let key in newRow) {
                const value = newRow[key];

                // Check if the column name contains the word "date" (case-insensitive) or "on"
                if (key.toLowerCase().includes("date") || key.toLowerCase().includes(" on") || key.toLowerCase().includes("dob")) {
                    // If it's a serialized Excel date (numeric value), convert it to JavaScript Date
                    if (typeof value === "number" && !isNaN(value)) {
                        const parsedDate = convertExcelDateToJSDate(value);
                        newRow[key] = formatDate(parsedDate);
                    }
                    // If it's a Date object, format it
                    else if (value instanceof Date) {
                        newRow[key] = formatDate(value);
                    }
                    // Handle date strings that may need to be parsed into a Date
                    else if (typeof value === "string" && !isNaN(Date.parse(value))) {
                        const parsedDate = new Date(value);
                        if (!isNaN(parsedDate)) {
                            newRow[key] = formatDate(parsedDate);
                        }
                    }
                } else {
                    // For other columns, just leave the value as is
                    newRow[key] = value;
                }
            }

            return newRow;
        });

        // Send the processed data to the callback
        callback(newData);
    };

    reader.readAsArrayBuffer(file); // Read the file as ArrayBuffer for binary data
};

