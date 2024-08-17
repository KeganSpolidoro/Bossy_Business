import React, { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";

const Dialogue = ({
  dialogVisible,
  hideDialog,
  dialogType,
  employee,
  handleInputChange,
  createEmployee,
  employeeList,
  updateEmployee,
}) => {
  const [validationErrors, setValidationErrors] = useState({});

  const dialogClass = dialogType === "create" ? "bg-[#afb9d0]" : "bg-[#c6bfd9]";
  const buttonClass = dialogType === "create" ? "bg-[#6e80aa]" : "bg-[#9b8fbd]";
  const defualt = { label: "No Manager", value: null };

  const managerOptions = [
    { label: "No Manager", value: null },
    ...employeeList.map((emp) => ({
      label: `${emp.name} ${emp.surname} (ID: ${emp.id})`,
      value: emp.id,
    })),
  ];

  // Validate fields
  const validateFields = () => {
    console.log("MANAGER FIELDS", managerOptions);
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex

    if (!employee.name) errors.name = "Name is required.";
    if (!employee.surname) errors.surname = "Surname is required.";
    if (!employee.email || !emailRegex.test(employee.email))
      errors.email = "A valid email is required.";
    if (!employee.birth_date) errors.birth_date = "Birth date is required.";
    if (!employee.salary || typeof employee.salary !== "number")
      errors.salary = "Salary is required and must be a number.";
    if (!employee.position) errors.position = "Position is required.";

    console.log("ManagerID: " + JSON.stringify(employee.managerID));
    // Check if managerID is null (No Manager) or a valid number
    if (
      employee.managerID === "No Manager" ||
      employee.managerID?.label === "No Manager"
    ) {
      employee.managerID = null;
    } else if (typeof employee.managerID !== "number") {
      errors.managerID = "Manager ID must be a number.";
    }

    return errors;
  };

  const handleDropdownChange = (e) => {
    const { value } = e.target;
    handleInputChange({
      target: { name: "managerID", value: value?.value ?? value }, // Ensure value is set properly
    });
  };

  const handleSubmit = () => {
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
    } else {
      setValidationErrors({});
      if (dialogType === "create") {
        createEmployee();
      } else {
        updateEmployee();
      }
    }
  };

  return (
    <Dialog
      visible={dialogVisible}
      onHide={hideDialog}
      header={`${
        dialogType.charAt(0).toUpperCase() + dialogType.slice(1)
      } Employee`}
      className={`${dialogClass} p-4 rounded-lg font-medium`}
    >
      <div className={`p-4 ${dialogClass} rounded-md`}>
        {dialogType === "update" && (
          <div className="flex justify-center mb-4">
            <img
              src={employee.image}
              alt={employee.name}
              className="w-24 h-24 rounded-full"
            />
          </div>
        )}

        <div className="flex flex-col p-2">
          <label htmlFor="name">Name</label>
          <InputText
            id="name"
            name="name"
            value={employee.name}
            onChange={handleInputChange}
            className={`w-full ${validationErrors.name ? "p-invalid" : ""}`}
          />
          {validationErrors.name && (
            <small className="p-error text-red-600">
              {validationErrors.name}
            </small>
          )}
        </div>
        <div className="flex flex-col p-2">
          <label htmlFor="surname">Surname</label>
          <InputText
            id="surname"
            name="surname"
            value={employee.surname}
            onChange={handleInputChange}
            className={`w-full ${validationErrors.surname ? "p-invalid" : ""}`}
          />
          {validationErrors.surname && (
            <small className="p-error text-red-600">
              {validationErrors.surname}
            </small>
          )}
        </div>
        <div className="flex flex-col p-2">
          <label htmlFor="email">Email</label>
          <InputText
            id="email"
            name="email"
            value={employee.email}
            onChange={handleInputChange}
            className={`w-full ${validationErrors.email ? "p-invalid" : ""}`}
          />
          {validationErrors.email && (
            <small className="p-error text-red-600">
              {validationErrors.email}
            </small>
          )}
        </div>
        <div className="flex flex-col p-2">
          <label htmlFor="birth_date">Birth Date</label>
          <Calendar
            value={employee.birth_date}
            onChange={(e) =>
              handleInputChange({
                target: { name: "birth_date", value: e.value },
              })
            }
            className={`w-full ${
              validationErrors.birth_date ? "p-invalid" : ""
            }`}
          />
          {validationErrors.birth_date && (
            <small className="p-error text-red-600">
              {validationErrors.birth_date}
            </small>
          )}
        </div>
        <div className="flex flex-col p-2">
          <label htmlFor="salary">Salary</label>
          <InputNumber
            id="salary"
            name="salary"
            value={employee.salary}
            onValueChange={handleInputChange}
            mode="currency"
            currency="ZAR"
            className={`w-full ${validationErrors.salary ? "p-invalid" : ""}`}
          />
          {validationErrors.salary && (
            <small className="p-error text-red-600">
              {validationErrors.salary}
            </small>
          )}
        </div>
        <div className="flex flex-col p-2">
          <label htmlFor="position">Position</label>
          <InputText
            id="position"
            name="position"
            value={employee.position}
            onChange={handleInputChange}
            className={`w-full ${validationErrors.position ? "p-invalid" : ""}`}
          />
          {validationErrors.position && (
            <small className="p-error text-red-600">
              {validationErrors.position}
            </small>
          )}
        </div>
        <div className="flex flex-col p-2">
          <label htmlFor="managerID">Manager ID</label>
          <Dropdown
            id="managerID"
            name="managerID"
            value={employee.managerID}
            options={managerOptions}
            onChange={handleDropdownChange}
            className={`w-full ${
              validationErrors.managerID ? "p-invalid" : ""
            }`}
          />
          {validationErrors.managerID && (
            <small className="p-error text-red-600">
              {validationErrors.managerID}
            </small>
          )}
        </div>
      </div>
      <Button
        label={dialogType === "create" ? "Create" : "Update"}
        onClick={handleSubmit}
        className={`w-full p-2 text-black ${buttonClass}`}
      />
    </Dialog>
  );
};

export default Dialogue;
