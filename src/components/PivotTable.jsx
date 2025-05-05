import React from "react";
import { generatePivotData } from "../utils/pivotData";

function buildColumnTree(columns, values) {
  const tree = {};

  columns.forEach(colKey => {
   
    const parts = colKey.split(" | ");
    let current = tree;
    

    parts.forEach((part, index) => {
      
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];

      if (index === parts.length - 1) {
        values.forEach(val => {
          current[val] = null;
        });
      }
    });
  });

  return tree;
}

function getMaxDepth(tree) {
  if (!tree || typeof tree !== 'object') return 0;
  return 1 + Math.max(0, ...Object.values(tree).map(getMaxDepth));
}

function renderHeaderRows(tree, depth, values, aggregations) {
  const rows = Array.from({ length: depth }, () => []);

  function traverse(node, level) { //traverse(product,1)
    for (const label in node) {
      const child = node[label];

      if (child && typeof child === "object" && Object.keys(child).length > 0) {
        const colSpan = countLeafNodes(child);
        rows[level].push({ label, colSpan, rowSpan: 1 });
        traverse(child, level + 1);
      } else {
        // leaf nodes (values like Units Sold, Price etc.)
        if (values.length === 0) {
          rows[level].push({ label: label, colSpan: 0, rowSpan: depth - level });
        } else {
          const aggregationType = aggregations[label] || "sum";
          rows[level].push({ label: `${label} (${aggregationType})`, colSpan: 1, rowSpan: depth - level });
        }
      }
    }
  }

  traverse(tree, 0);
  return rows;
}

function countLeafNodes(node) {
  if (!node || typeof node !== 'object') return 1;
  let count = 0;
  for (const key in node) {
    count += countLeafNodes(node[key]);
  }
  return count;
}

export default function PivotTable({ data, rows, columns, values, aggregations }) {
  if (!data.length) return <div>No data to display</div>;

  if (rows.length === 0 && columns.length === 0) {
    return (
      <table className="table-auto border-collapse border border-gray-300 text-sm" >
        <thead className="bg-[#c0e4f59a]">
          <tr>
            {Object.keys(data[0]).map((key) => (
              <th key={key} className="border p-2">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              {Object.keys(row).map((key, i) => (
                <td key={i} className="border p-2">{String(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const { pivotRows, pivotColumns, pivotMatrix, rowTotals, columnTotals } = generatePivotData({
    data,
    rows,
    columns,
    values,
    aggregations
  });

  const columnTree = buildColumnTree(pivotColumns, values);
  const maxDepth = getMaxDepth(columnTree);
  const headerRows = renderHeaderRows(columnTree, maxDepth, values, aggregations);

  return (
    <div className="overflow-auto" id="scroll">
      <table className="table-auto w-full border-collapse border border-gray-300 text-sm" >
        <thead className="bg-[#c0e4f59a]">
          {headerRows.map((headerRow, rowIdx) => (
            <tr key={rowIdx}>
              {rowIdx === 0 && rows.map((r, idx) => (
                <th
                  key={"row_" + idx}
                  className="border p-2"
                  rowSpan={maxDepth}
                >
                  {r}
                </th>
              ))}
              {headerRow.map((header, idx) => (
                <th
                  key={`header_${rowIdx}_${idx}`}
                  className="border p-2"
                  colSpan={header.colSpan}
                  rowSpan={header.rowSpan}
                >
                  {header.label}
                </th>
              ))}
              {rowIdx === 0 && values.length > 0 && (
                values.map((val, valIdx) => {
                  const agg = (aggregations[val] || 'sum');
                  const aggLabel =
                    agg === 'sum' ? 'Sum'
                    : agg === 'avg' ? 'Avg'
                    : agg === 'min' ? 'Min'
                    : agg === 'max' ? 'Max'
                    : agg === 'count' ? 'Count'
                    : agg;
                  return (
                    <th key={`rowtotal_header_${valIdx}`} rowSpan={maxDepth} className="border p-2 font-bold text-gray-700">
                      {`Total ${aggLabel} of ${val}`}
                    </th>
                  );
                })
              )}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pivotRows.map((rowKey, rowIdx) => {
            const rowParts = rowKey.split(" | ");
            return (
              <tr key={rowIdx} className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                {rowParts.map((part, idx) => (
                  <td key={`rowpart_${rowIdx}_${idx}`} className="border p-2">{part}</td>
                ))}
                {pivotMatrix[rowIdx].map((cell, cellIdx) => (
                  values.map((val, valIdx) => (
                    <td key={`cell_${rowIdx}_${cellIdx}_${valIdx}`} className="border p-2">
                      {cell[val] != 0 ? cell[val] : null}
                    </td>
                  ))
                ))}
                {values.length > 0 && (
                  values.map((val, valIdx) => (
                    <td key={`rowtotal_${rowIdx}_${valIdx}`} className="border p-2 font-bold text-gray-700">
                      {pivotMatrix[rowIdx].reduce((acc, cell) => acc + Number(cell[val] || 0), 0)}
                    </td>
                  ))
                )}
              </tr>
            );
          })}
        </tbody>
        {values.length > 0 && (
          <tfoot className="text-gray-700 font-semibold">
            <tr>
              <td className="border p-2 font-bold" colSpan={rows.length}>Column Totals</td>
              {columnTotals.map((total, idx) => (
                values.map((val, valIdx) => (
                  <td key={`${idx}_${valIdx}`} className="border p-2 font-bold">
                    {total[val]}
                  </td>
                ))
              ))}
              {values.map((val, valIdx) => (
                <td key={`grandtotal_${valIdx}`} className="border p-2 font-bold">
                  {Number(columnTotals.reduce((acc, total) => acc + Number(total[val] || 0), 0)).toFixed(2)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
