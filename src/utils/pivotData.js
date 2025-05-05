export function generatePivotData({ data, rows, columns, values, aggregations }) {
    if (!data.length || (!rows.length && !columns.length)) {
        return { pivotRows: [], pivotColumns: [], pivotMatrix: [], rowTotals: [], columnTotals: [] };
    }

    const pivotMap = new Map();
    const allColumnValues = new Set();

    // Helper function to parse dd-mm-yyyy or dd/mm/yyyy
    function parseDMY(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split(/[-\/]/);
        if (parts.length !== 3) return null;
        const [day, month, year] = parts.map(Number);
        if (!day || !month || !year) return null;
        return new Date(year, month - 1, day);
    }

    // Helper function to get date hierarchy value
    const getDateHierarchyValue = (dateStr, hierarchyType) => {
        if (!dateStr) return "N/A";
        let date = parseDMY(dateStr);
        if (!date || isNaN(date)) return "N/A";
        switch (hierarchyType) {
            case "Year":
                return date.getFullYear().toString();
            case "Quarter":
                return `Q${Math.floor(date.getMonth() / 3) + 1}`;
            case "Month":
                return date.toLocaleString('default', { month: 'long' });
            default:
                return dateStr;
        }
    };

    data.forEach(item => {
        const rowKey = rows.map(r => {
            if (r.includes("_Year")) {
                const baseField = r.replace("_Year", "");
                return getDateHierarchyValue(item[baseField], "Year");
            } else if (r.includes("_Quarter")) {
                const baseField = r.replace("_Quarter", "");
                return getDateHierarchyValue(item[baseField], "Quarter");
            } else if (r.includes("_Month")) {
                const baseField = r.replace("_Month", "");
                return getDateHierarchyValue(item[baseField], "Month");
            }
            return item[r] ?? "N/A";
        }).join(" | ");

        const columnKey = columns.map(c => {
            if (c.includes("_Year")) {
                const baseField = c.replace("_Year", "");
                return getDateHierarchyValue(item[baseField], "Year");
            } else if (c.includes("_Quarter")) {
                const baseField = c.replace("_Quarter", "");
                return getDateHierarchyValue(item[baseField], "Quarter");
            } else if (c.includes("_Month")) {
                const baseField = c.replace("_Month", "");
                return getDateHierarchyValue(item[baseField], "Month");
            }
            return item[c] ?? "N/A";
        }).join(" | ");

        allColumnValues.add(columnKey);

        const pivotKey = rowKey + "||" + columnKey;
        if (!pivotMap.has(pivotKey)) {
            pivotMap.set(pivotKey, {});
        }

        values.forEach(val => {
            const fieldVal = item[val];
            if (typeof fieldVal === "number") {
                if (!pivotMap.get(pivotKey)[val]) {
                    pivotMap.get(pivotKey)[val] = [];
                }
                pivotMap.get(pivotKey)[val].push(fieldVal);
            }
        });
    });

    const pivotRows = Array.from(new Set(
        data.map(item => rows.map(r => {
            if (r.includes("_Year")) {
                const baseField = r.replace("_Year", "");
                return getDateHierarchyValue(item[baseField], "Year");
            } else if (r.includes("_Quarter")) {
                const baseField = r.replace("_Quarter", "");
                return getDateHierarchyValue(item[baseField], "Quarter");
            } else if (r.includes("_Month")) {
                const baseField = r.replace("_Month", "");
                return getDateHierarchyValue(item[baseField], "Month");
            }
            return item[r] ?? "N/A";
        }).join(" | "))
    )).sort();

    const pivotColumns = Array.from(allColumnValues).sort();

    const pivotMatrix = pivotRows.map(rowKey => {
        return pivotColumns.map(colKey => {
            const pivotKey = rowKey + "||" + colKey;
            const fieldAggs = pivotMap.get(pivotKey) || {};
            const result = {};
            values.forEach(val => {
                const nums = fieldAggs[val] || [];
                const aggregationType = aggregations[val] || "sum";
                switch (aggregationType) {
                    case "sum":
                        result[val] = nums.reduce((a, b) => a + b, 0);
                        result[val] = !Number.isInteger(result[val]) ? Number(result[val].toFixed(2)) : result[val];
                        break;
                    case "avg":
                        result[val] = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
                        result[val] = !Number.isInteger(result[val]) ? Number(result[val].toFixed(2)) : result[val];
                        break;
                    case "count":
                        result[val] = nums.length;
                        break;
                    case "min":
                        result[val] = nums.length ? Math.min(...nums) : 0;
                        break;
                    case "max":
                        result[val] = nums.length ? Math.max(...nums) : 0;
                        break;
                    default:
                        result[val] = 0;
                }
            });
            return result;
        });
    });

    // Calculate row totals and column totals
    const rowTotals = pivotMatrix.map(row => {
        const total = row.reduce((acc, cell) => {
          return acc + values.reduce((subAcc, val) => subAcc + Number(cell[val] || 0), 0);
        }, 0);
        return Number.isInteger(total) ? total : Number(total.toFixed(2));
      });
      
    let columnTotals = pivotColumns.map((_, colIdx) => {
        const totals = {};
        values.forEach(val => {
            const aggregationType = aggregations[val] || "sum";
            const nums = pivotMatrix.map(row => Number(row[colIdx][val] || 0));
            const length = (nums.filter(num => num != 0)).length;
            switch (aggregationType) {
                case "sum":
                    totals[val] = nums.reduce((a, b) => a + b, 0);
                    totals[val] = !Number.isInteger(totals[val]) ? Number(totals[val].toFixed(2)) : totals[val];
                    break;
                case "avg":
                    console.log("nums",nums);
                    // console.log("length",length);
                    totals[val] = nums.length ? (nums.reduce((a, b) => a + b, 0) / length).toFixed(2): 0;
                    break;
                case "count":
                    totals[val] = nums.reduce((a, b) => a + b, 0);
                    break;
                case "min":
                    const validNums = pivotMatrix
                        .map(row => row[colIdx][val])
                        .filter(x => x !== null && x !== undefined && x !== '' && x!==0)
                        .map(Number);
                    totals[val] = validNums.length ? Math.min(...validNums) : 0;
                    break;

                case "max":
                    totals[val] = nums.length ? Math.max(...nums) : 0;
                    break;
                default:
                    totals[val] = 0;
            }
        });
        return totals;
    });

    return { pivotRows, pivotColumns, pivotMatrix, rowTotals, columnTotals };
}
