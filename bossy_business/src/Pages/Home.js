import React, { useState, useEffect } from "react";
import { OrganizationChart } from "primereact/organizationchart";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import Dialogue from "../components/Dialogue";
import CryptoJS from "crypto-js";

export default function Home() {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [orgChartData, setOrgChartData] = useState([]);
  const [selection, setSelection] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [filteredOrgChartData, setFilteredOrgChartData] = useState(null); // State for filtered data
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [employee, setEmployee] = useState({
    id: "",
    name: "",
    surname: "",
    email: "",
    birth_date: "",
    salary: "",
    position: "",
    managerID: "",
    image: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (orgChartData) {
      if (searchTerm === "") {
        setFilteredOrgChartData(orgChartData);
      } else {
        const filteredData = filterOrgChartData(orgChartData, searchTerm);
        setFilteredOrgChartData(filteredData.length > 0 ? filteredData : []);
      }
    } else {
      setFilteredOrgChartData([]);
    }
  }, [searchTerm, orgChartData]);

  const invokeEdgeFunction = async (type, data) => {
    try {
      const response = await fetch(
        "https://loxpufmdwbaabitgzkmj.supabase.co/functions/v1/CRUD",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ type: type, data: data }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const getGravatarAvatar = (email) => {
    const hashedEmail = CryptoJS.SHA256(email).toString(CryptoJS.enc.Hex);
    const gravatarUrl = `https://www.gravatar.com/avatar/${hashedEmail}`;
    return gravatarUrl;
  };

  const fetchEmployees = async () => {
    try {
      const response = await invokeEdgeFunction("getEmployees");
      const data = response.data;

      if (!data || data.length === 0) {
        setOrgChartData([]);
        setFilteredOrgChartData([]);
        return;
      }

      setEmployeeList(data);

      const createNode = (emp) => ({
        key: emp.id,
        type: "person",
        styleClass: "bg-[#afb9d0] text-white",
        style: { borderRadius: "12px" },
        data: {
          id: emp.id,
          image: getGravatarAvatar(emp.email),
          name: emp.name,
          surname: emp.surname,
          position: emp.position,
        },
        expanded: true,
        children: [],
      });

      const employeeMap = new Map(data.map((emp) => [emp.id, createNode(emp)]));

      data.forEach((emp) => {
        if (emp.managerID) {
          const managerNode = employeeMap.get(emp.managerID);
          const employeeNode = employeeMap.get(emp.id);
          if (managerNode && employeeNode) {
            managerNode.children.push(employeeNode);
          }
        }
      });

      const rootNodes = Array.from(employeeMap.values()).filter(
        (node) => !data.find((emp) => emp.id === node.data.id && emp.managerID)
      );

      setOrgChartData(rootNodes);
      setFilteredOrgChartData(rootNodes);
    } catch (error) {
      console.error("Error processing employee data:", error);
    }
  };

  const showDialog = (type, selectedEmployee = null) => {
    if (type === "update" && selectedEmployee) {
      setEmployee({
        id: selectedEmployee.id,
        name: selectedEmployee.name,
        surname: selectedEmployee.surname,
        email: selectedEmployee.email,
        birth_date: new Date(selectedEmployee.birth_date),
        salary: selectedEmployee.salary,
        position: selectedEmployee.position,
        managerID: selectedEmployee.managerID,
        image: getGravatarAvatar(selectedEmployee.email),
      });
    } else if (type === "create") {
      setEmployee({
        id: "",
        name: "",
        surname: "",
        email: "",
        birth_date: "",
        salary: "",
        position: "",
        managerID: "",
        image: "",
      });
    }

    setDialogType(type);
    setDialogVisible(true);
  };

  const hideDialog = () => {
    setDialogVisible(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const removeFields = (employeeData) => {
    const { image, ...sanitizedData } = employeeData;
    return sanitizedData;
  };
  const removeFieldsCreate = (employeeData) => {
    const { image, id, ...sanitizedData } = employeeData;
    return sanitizedData;
  };

  const isCircularReference = (managerID, employeeID) => {
    if (managerID === employeeID) {
      return true;
    }

    const checkSubordinates = (currentID) => {
      const subordinates = employeeList.filter(
        (e) => e.managerID === currentID
      );
      for (const subordinate of subordinates) {
        if (subordinate.id === employeeID) {
          return true;
        }
        // Recursively check the subordinates' hierarchy
        if (checkSubordinates(subordinate.id)) {
          return true;
        }
      }
      return false;
    };

    return checkSubordinates(managerID);
  };

  const createEmployee = async () => {
    if (employee.managerID === employee.id) {
      alert("An employee cannot be their own manager.");
      return;
    }

    try {
      const updatedEmployeeObject = {
        ...removeFieldsCreate(employee),
        birth_date: employee.birth_date?.value || employee.birth_date,
      };

      const { data, error } = await invokeEdgeFunction(
        "createEmployee",
        updatedEmployeeObject
      );

      if (error) {
        alert("Error Creating employee", error);
      } else {
        alert("Successfully Created employee");
        fetchEmployees();
        hideDialog();
      }
    } catch (error) {
      console.error("Error creating employee:", error);
    }
  };

  const updateEmployee = async () => {
    if (employee.managerID === employee.id) {
      alert("An employee cannot be their own manager.");
      return;
    }
    const originalEmployee = employeeList.find((emp) => emp.id === employee.id);

    if (originalEmployee && originalEmployee.managerID !== employee.managerID) {
      if (isCircularReference(employee.managerID, employee.id)) {
        alert("Circular management structure detected.");
        return;
      }
    }

    try {
      const updatedEmployeeObject = removeFields(employee);
      const { data, error } = await invokeEdgeFunction(
        "updateEmployee",
        updatedEmployeeObject
      );
      if (error) {
        alert("Error Updating employee");
        console.error("Error details:", error);
        console.log("Updated employee object:", updatedEmployeeObject);
      } else {
        alert("Successfully Updated employee");
        fetchEmployees();
        hideDialog();
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const deleteEmployee = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const employeeToDelete = employeeList.find((emp) => emp.id === id);
      if (!employeeToDelete) {
        alert("Employee not found");
        return;
      }

      const subordinates = employeeList.filter((emp) => emp.managerID === id);

      const manager = employeeList.find(
        (emp) => emp.id === employeeToDelete.managerID
      );

      const { data, error } = await invokeEdgeFunction("deleteEmployee", {
        id,
      });
      if (error) {
        alert("Error deleting employee");
        console.error("Error details:", error);
        return;
      }

      for (const subordinate of subordinates) {
        const updateData = {
          ...subordinate,
          managerID: manager ? manager.id : null,
        };

        const { error: updateError } = await invokeEdgeFunction(
          "updateEmployee",
          updateData
        );
        if (updateError) {
          console.error(
            `Error updating subordinate ${subordinate.id}:`,
            updateError
          );
        }
      }

      alert("Successfully deleted employee and reassigned subordinates");
      fetchEmployees();
    } catch (error) {
      console.error("Error in delete operation:", error);
      alert("An error occurred during the delete operation");
    }
  };

  const filterOrgChartData = (data, searchTerm) => {
    if (!data || !Array.isArray(data)) return [];
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();

    const filterNode = (node) => {
      if (!node || !node.data) return null;

      const nameMatch = node.data?.name?.toLowerCase().includes(term);
      const surnameMatch = node.data?.surname?.toLowerCase().includes(term);
      const positionMatch = node.data?.position?.toLowerCase().includes(term);

      const childMatches = node.children?.map(filterNode).filter(Boolean) || [];

      if (
        nameMatch ||
        surnameMatch ||
        positionMatch ||
        childMatches.length > 0
      ) {
        return {
          ...node,
          children: childMatches,
          expanded: node.expanded !== undefined ? node.expanded : true,
          type: node.type || "person",
          className: node.className || "",
          style: node.style || {},
        };
      }

      return null;
    };

    return data.map(filterNode).filter(Boolean);
  };

  const nodeTemplate = (node) => {
    if (!node || !node.data) {
      console.error("Invalid node structure:", node);
      return null;
    }
    const isRootNode = !node.data.managerID;
    return (
      <div
        className={`flex flex-col align-items-center rounded-lg p-4 ${
          isRootNode ? "bg-[#6e80aa]" : ""
        }`}
      >
        <div className="flex flex-row justify-center">
          <img
            src={node.data.image}
            alt={node.data.name || "Employee"}
            className="w-16 h-16 rounded-full"
          />
        </div>
        <div className="font-bold text-xl text-white mt-2">
          {node.data.name || "N/A"} {node.data.surname || ""}
        </div>
        <div className="text-white">{node.data.position || "N/A"}</div>
        <Button
          icon="pi pi-pencil"
          iconPos="right"
          label="Edit"
          className="bg-[#e2dfec] text-black mt-2 p-2 rounded-md text-sm"
          onClick={() =>
            showDialog(
              "update",
              employeeList.find((e) => e.id === node.data.id)
            )
          }
        />
        <Button
          icon="pi pi-trash"
          iconPos="right"
          className="bg-[#998cbc] text-white mt-2 p-2 rounded-md text-sm"
          label="Delete"
          onClick={() => deleteEmployee(node.data.id)}
        />
      </div>
    );
  };

  return (
    <div
      className={`w-full h-lvh ${
        dialogVisible ? "blur-background" : ""
      } text-[#0e1712]`}
    >
      <div className="flex flex-col items-center">
        <div className="w-full mb-4">
          <div className="flex justify-between items-center">
            <Button
              label="Add Employee"
              icon="pi pi-plus"
              onClick={() => showDialog("create")}
              className="bg-[#6e80aa] w-full rounded-none h-4 p-4"
              iconPos="right"
            />
            <InputText
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Employees"
              className="w-80 h-8 border-[#6e80aa] rounded-none border-2"
            />
          </div>
        </div>

        <Dialogue
          dialogVisible={dialogVisible}
          hideDialog={hideDialog}
          dialogType={dialogType}
          employee={employee}
          employeeList={employeeList}
          handleInputChange={handleInputChange}
          createEmployee={createEmployee}
          updateEmployee={updateEmployee}
        />
        <div className="w-full">
          <div className="card overflow-x-auto">
            <div className="card overflow-x-auto">
              {filteredOrgChartData && filteredOrgChartData.length > 0 ? (
                filteredOrgChartData.map((rootNode, index) => (
                  <div key={rootNode.key} className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">{`Organization Chart ${
                      index + 1
                    }`}</h2>
                    <div className="card overflow-x-auto">
                      <OrganizationChart
                        value={[rootNode]}
                        nodeTemplate={nodeTemplate}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p>No matching employees found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
