import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { RowIcon, ColumnIcon } from "../assets/icons";
import reset from "../assets/images/reset.png";
import "../styles/fieldSelector.css";

const FieldItem = ({ field, type, onDrop, onRemove, isDateHierarchy, isNumerical, aggregations, setAggregations }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "FIELD",
    item: { field, sourceType: type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`field-item ${isDragging ? "dragging" : ""}`}
    >
      <div className={`field-item-left ${isDateHierarchy ? "date-hierarchy" : ""}`}>
        {isNumerical && <span className="summation">Σ</span>}
        <span>{field}</span>
      </div>
      <div className="field-item-right">
        {type === "values" && (
          <select
            className="aggregation-select"
            value={aggregations[field] || "sum"}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setAggregations((prev) => ({ ...prev, [field]: e.target.value }))}
          >
            <option value="sum">Sum</option>
            <option value="avg">Avg</option>
            <option value="count">Count</option>
            <option value="min">Min</option>
            <option value="max">Max</option>
          </select>
        )}
        {type !== "available" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(field);
            }}
            className="remove-btn"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

const DropZone = ({ type, fields, onDrop, onRemove, title, icon, aggregations, setAggregations }) => {
  const [{ isOver }, drop] = useDrop({
    accept: "FIELD",
    drop: (item) => onDrop(item.field, type),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div className="dropzone-container">
      <div className="dropzone-header">
        <span className="dropzone-icon">{icon}</span>
        <span className="dropzone-title">{title}</span>
      </div>
      <div
        ref={drop}
        className={`dropzone-box ${isOver ? "over" : ""}`}
      >
        <div className="dropzone-scroll">
          {fields.map((field) => (
            <FieldItem
              key={field}
              field={field}
              type={type}
              onDrop={onDrop}
              onRemove={onRemove}
              isDateHierarchy={field.includes("_Year") || field.includes("_Quarter") || field.includes("_Month")}
              isNumerical={type === "values"}
              aggregations={aggregations}
              setAggregations={setAggregations}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function FieldSelector({
  fields,
  rows,
  setRows,
  columns,
  setColumns,
  values,
  setValues,
  aggregations,
  setAggregations,
  numericalFields,
}) {
  const [dateFields, setDateFields] = useState([]);
  const [dateHierarchyFields, setDateHierarchyFields] = useState([]);

  useEffect(() => {
    const dateCols = fields.filter(field =>
      field.toLowerCase().includes(" on") ||
      field.toLowerCase().includes("date") ||
      field.toLowerCase().includes("dob")
    );

    const hierarchyFields = dateCols.flatMap(dateField => [
      `${dateField}_Year`,
      `${dateField}_Quarter`,
      `${dateField}_Month`
    ]);

    setDateFields(dateCols);
    setDateHierarchyFields(hierarchyFields);
  }, [fields]);

  const handleDrop = (field, targetType) => {
    let newRows = [...rows];
    let newColumns = [...columns];
    let newValues = [...values];
    let newAggregations = { ...aggregations };

    if (newRows.includes(field)) newRows = newRows.filter((f) => f !== field);
    if (newColumns.includes(field)) newColumns = newColumns.filter((f) => f !== field);
    if (newValues.includes(field)) {
      newValues = newValues.filter((f) => f !== field);
      delete newAggregations[field];
    }

    if (targetType === "rows" && !newRows.includes(field)) newRows.push(field);
    if (targetType === "columns" && !newColumns.includes(field)) newColumns.push(field);
    if (targetType === "values" && !newValues.includes(field)) newValues.push(field);

    setRows(newRows);
    setColumns(newColumns);
    setValues(newValues);
    setAggregations(newAggregations);
  };

  const handleRemove = (field) => {
    if (rows.includes(field)) setRows(rows.filter((f) => f !== field));
    if (columns.includes(field)) setColumns(columns.filter((f) => f !== field));
    if (values.includes(field)) {
      setValues(values.filter((f) => f !== field));
      const newAggregations = { ...aggregations };
      delete newAggregations[field];
      setAggregations(newAggregations);
    }
  };

  const handleReset = () => {
    setRows([]);
    setColumns([]);
    setValues([]);
    setAggregations({});
  };

  const allAvailableFields = [
    ...fields.filter(f => !rows.includes(f) && !columns.includes(f) && !values.includes(f)),
    ...dateHierarchyFields.filter(f => !rows.includes(f) && !columns.includes(f) && !values.includes(f))
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="field-selector-container">
        <div className="field-selector-header">
          <h2 className="header-title">PivotTable Fields</h2>
          <button 
            className="reset-btn" 
            onClick={handleReset}
          >
            <img
              src={reset}
              alt="reset"
              width="20"
              height="20"
            />
          </button>
        </div>

        <div className="available-fields" id="scroll">
          {allAvailableFields.map((field) => (
            <FieldItem
              key={field}
              field={field}
              type="available"
              onDrop={handleDrop}
              onRemove={handleRemove}
              isDateHierarchy={field.includes("_Year") || field.includes("_Quarter") || field.includes("_Month")}
              isNumerical={numericalFields.includes(field)}
              aggregations={aggregations}
              setAggregations={setAggregations}
            />
          ))}
        </div>

        <div className="dropzones">
          <div className="dropzones-top">
            <DropZone
              type="rows"
              fields={rows}
              onDrop={handleDrop}
              onRemove={handleRemove}
              title="Rows"
              icon={<RowIcon />}
              aggregations={aggregations}
              setAggregations={setAggregations}
            />
            <DropZone
              type="columns"
              fields={columns}
              onDrop={handleDrop}
              onRemove={handleRemove}
              title="Columns"
              icon={<ColumnIcon />}
              aggregations={aggregations}
              setAggregations={setAggregations}
            />
          </div>
          <DropZone
            type="values"
            fields={values}
            onDrop={handleDrop}
            onRemove={handleRemove}
            title="Values"
            icon="Σ"
            aggregations={aggregations}
            setAggregations={setAggregations}
          />
        </div>
      </div>
    </DndProvider>
  );
}
