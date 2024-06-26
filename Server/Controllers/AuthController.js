import fs from 'fs';
import csv from 'csv-parser';
import Joi from 'joi';
import mongoose from 'mongoose';

const { ObjectId } = mongoose.Types;

import AdminModel from '../Models/AdminModel.js'
import DepartmentModel from '../Models/DepartmentModel.js';
import EmployeeModel from '../Models/EmployeeModel.js';
import PositionModel from '../Models/PositionModel.js';
import errorHandler from '../utils/errorHandler.js';
import schemaValidate from '../utils/validateEmployee.js';

const addDepartment = async (req, res) => {
    const { department } = req.body;

    // Define schema
    const schemaValidate = Joi.object({
        department: Joi.string()
            .trim()
            .min(1)
            .required()
    })

    const { error } = schemaValidate.validate(req.body);

    if (error) {
        console.log("Validation error: ", error.details[0].message);

        return res.status(400).json({
            status: "error",
            message: "Invalid input data. Please check and try again.",
        });
    }

    try {
        const isExistingDepartment = await DepartmentModel.findOne({ name: department });

        if (isExistingDepartment) {
            return res.status(409).json({
                status: "error",
                message: "Department already exists"
            })
        }

        await DepartmentModel.create({ name: department });

        return res.status(201).json({
            status: "success",
            message: "Department created successfully",
        });
    } catch (error) {
        return errorHandler(res, error);
    }
}

const fetchDepartment = async (req, res) => {
    try {
        const results = await DepartmentModel.find();

        if (!results || results.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Department not found"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Get department successfully",
            data: results
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const addEmployee = async (req, res) => {

    // Validate data
    const { error } = schemaValidate.validate(req.body);

    if (error) {
        console.log("Validation error: ", error.details[0].message);

        return res.status(400).json({
            status: "error",
            message: "Invalid input data. Please check and try again.",
        });
    }

    try {
        const existingEmployee = await EmployeeModel.findOne({ email: req.body.email });
        if (existingEmployee) {
            return res.status(409).json({
                status: "error",
                message: "Email already exists, try another one"
            });
        }

        const results = await EmployeeModel.create(req.body);
        if (!results) {
            return res.status(500).json({
                status: "error",
                message: "Failed to create employee",
            });
        }

        return res.status(201).json({
            status: "success",
            message: "Created employee successfully",
        });
    } catch (error) {
        return errorHandler(res, error);
    }
}

const fetchEmployee = async (req, res) => {
    const { itemsPerPage, itemOffset } = req.query;

    try {
        const query = EmployeeModel.aggregate([
            {
                $lookup: {
                    from: "departments",
                    localField: "department_id",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $lookup: {
                    from: "positions",
                    localField: "position_id",
                    foreignField: "_id",
                    as: "position"
                }
            },
            {
                $unwind: "$department"
            },
            {
                $unwind: "$position"
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    dob: 1,
                    address: 1,
                    department_name: "$department.name",
                    position_name: "$position.name",
                    start_date: 1,
                    salary: 1
                }
            },
            {
                $sort: {
                    department_name: 1,
                    position_name: 1,
                    name: 1
                }
            }
        ]);

        if (!+itemsPerPage && !+itemOffset) {
            const results = await query.exec();

            return res.status(200).json({
                status: "success",
                message: "Get employee successfully",
                data: results
            });
        }

        const totalCount = await EmployeeModel.countDocuments({});
        const totalPage = Math.ceil(totalCount / itemsPerPage);

        const results = await query.skip(+itemOffset).limit(+itemsPerPage).exec();

        return res.status(200).json({
            status: "success",
            message: "Get employee successfully",
            data: {
                data: results,
                totalPage
            }
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const fetchEmployeeById = async (req, res) => {
    let _id = req.params._id;

    try {
        const results = await EmployeeModel.findById(_id, '-id -__v');

        return res.status(200).json({
            status: "success",
            message: "Get employee successfully",
            data: results
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const editEmployee = async (req, res) => {
    const _id = req.params._id;

    // Validate data
    const { error } = schemaValidate.validate(req.body);

    if (error) {
        console.log("Validation error: ", error.details[0].message);

        return res.status(400).json({
            status: "error",
            message: "Invalid input data. Please check and try again.",
        });
    }

    try {
        const results = await EmployeeModel.findByIdAndUpdate(_id, req.body);

        if (!results) {
            return res.status(500).json({
                status: "error",
                message: "Failed to update employee",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Updated employee successfully",
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const deleteEmployee = async (req, res) => {
    const _id = req.params._id;

    try {
        const results = await EmployeeModel.findByIdAndDelete(_id);

        if (!results) {
            return res.status(404).json({
                status: "error",
                message: "Failed to delete employee",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Deleted employee successfully",
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const getAdminCount = async (req, res) => {
    try {
        const results = await AdminModel.countDocuments();

        return res.status(200).json({
            status: "success",
            message: "Get adminCount successful",
            data: results
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const getEmployeeCount = async (req, res) => {
    try {
        const results = await EmployeeModel.countDocuments();

        return res.status(200).json({
            status: "success",
            message: "Get EmployeeCount successful",
            data: results
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const getSalaryTotal = async (req, res) => {
    try {
        const results = await EmployeeModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalSalary: { $sum: "$salary" }
                }
            }
        ]);

        return res.status(200).json({
            status: "success",
            message: "Get salary total successfully",
            data: results[0].totalSalary
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const getListAdmin = async (req, res) => {
    try {
        const results = await AdminModel.find();

        return res.status(200).json({
            status: "success",
            message: "Get AdminList successfully",
            data: results
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const uploadFile = async (req, res) => {
    try {
        const employeeData = [];
        let hasError = false;

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => employeeData.push(data))
            .on('end', async () => {
                for (const item of employeeData) {
                    const check = await EmployeeModel.findOne({ email: item.email });

                    if (check) {
                        hasError = true;
                        break; // Skip creating duplicate employee
                    }
                    else {
                        await EmployeeModel.create(item);
                    }
                }
                fs.unlinkSync(req.file.path); // Delete temporary file
            });


        if (hasError) {
            return res.status(409).json({
                status: "error",
                message: "Data import is invalid",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Created employee successfully",
        });
    } catch (error) {
        return errorHandler(res, error);
    }
}

const searchEmployee = async (req, res) => {
    const { name, position_id, department_id, itemsPerPage, itemOffset } = req.query;
    const queryCondition = {};

    if (name) {
        // regex to find correct names and approximate names
        queryCondition.name = { $regex: `${name}`, $options: 'i' };
    }

    if (position_id) {
        queryCondition.position_id = position_id;
    }

    if (department_id) {
        queryCondition.department_id = department_id;
    }

    try {
        // count total page
        const dataCount = await EmployeeModel.countDocuments(queryCondition);
        const totalPage = Math.ceil(dataCount / itemsPerPage);
        
        // convert to ObjectId if available for departmentId & positionId
        for (const key in queryCondition) {
            if (key !== 'name') {
                queryCondition[key] = new ObjectId(queryCondition[key]);
            }
        }
        
        const query = EmployeeModel.aggregate([
            {
                $match: queryCondition
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "department_id",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $lookup: {
                    from: "positions",
                    localField: "position_id",
                    foreignField: "_id",
                    as: "position"
                }
            },
            {
                $unwind: "$department"
            },
            {
                $unwind: "$position"
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    dob: 1,
                    address: 1,
                    department_name: "$department.name",
                    position_name: "$position.name",
                    start_date: 1,
                    salary: 1
                }
            },
            {
                $sort: {
                    department_name: 1,
                    position_name: 1,
                    name: 1
                }
            }
        ]);

        const results = await query.skip(+itemOffset).limit(+itemsPerPage).exec();

        return res.status(200).json({
            status: "success",
            message: "Search employee successfully",
            data: {
                data: results,
                totalPage
            }
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const fetchDepartmentAndCountEmployee = async (req, res) => {
    const { itemsPerPage, itemOffset } = req.query;

    try {
        const query = DepartmentModel.aggregate([
            {
                $lookup: {
                    from: "employees",
                    localField: "_id",
                    foreignField: "department_id",
                    as: "employee"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    employeeCount: { $size: "$employee" },
                }
            },
            {
                $sort: {
                    name: 1
                }
            }
        ]);
        const responseDB = await query.skip(+itemOffset).limit(+itemsPerPage).exec();

        const totalCount = await DepartmentModel.countDocuments({});
        const totalPage = Math.ceil(totalCount / itemsPerPage);

        return res.status(200).json({
            status: "success",
            message: "Get department and count employee successfully",
            data: {
                data: responseDB,
                totalPage
            }
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const deleteDepartment = async (req, res) => {
    const _id = req.params._id;

    try {
        const results = await DepartmentModel.findByIdAndDelete(_id);

        if (!results) {
            return res.status(404).json({
                status: "error",
                message: "Department not found",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Deleted department successfully",
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const fetchPosition = async (req, res) => {
    try {
        const results = await PositionModel.find();

        if (!results || results.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Position not found"
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Get position successfully",
            data: results
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const fetchPositionAndCountEmployee = async (req, res) => {
    const { itemsPerPage, itemOffset } = req.query;

    try {
        const query = PositionModel.aggregate([
            {
                $lookup: {
                    from: "employees",
                    localField: "_id",
                    foreignField: "position_id",
                    as: "employees"
                }
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "department_id",
                    foreignField: "_id",
                    as: "department"
                }
            },
            {
                $unwind: "$department"
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    department: "$department.name",
                    employeeCount: { $size: "$employees" },
                }
            },
            {
                $sort: {
                    department: 1,
                    name: 1
                }
            }
        ]);

        const responseDB = await query.skip(+itemOffset).limit(+itemsPerPage).exec();

        const totalCount = await PositionModel.countDocuments({});
        const totalPage = Math.ceil(totalCount / itemsPerPage);

        return res.status(200).json({
            status: "success",
            message: "Get position and count employee successfully",
            data: {
                data: responseDB,
                totalPage
            }
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const deletePosition = async (req, res) => {
    const _id = req.params._id;

    try {
        const results = await PositionModel.findByIdAndDelete(_id);

        if (!results) {
            return res.status(404).json({
                status: "error",
                message: "Position not found",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Deleted position successfully",
        })
    } catch (error) {
        return errorHandler(res, error);
    }
}

const addPosition = async (req, res) => {
    const { position, department_id } = req.body;

    // Define schema
    const schemaValidate = Joi.object({
        position: Joi.string()
            .trim()
            .min(1)
            .required(),
        department_id: Joi.string()
            .trim()
            .min(1)
            .required(),
    })

    const { error } = schemaValidate.validate(req.body);

    if (error) {
        console.log("Validation error: ", error.details[0].message);

        return res.status(400).json({
            status: "error",
            message: "Invalid input data. Please check and try again.",
        });
    }

    try {
        const isExistingPosition = await PositionModel.findOne({ name: position });

        if (isExistingPosition) {
            return res.status(409).json({
                status: "error",
                message: "Position already exists"
            })
        }

        const isExistingDepartment = await DepartmentModel.findById(department_id);

        if (!isExistingDepartment) {
            return res.status(404).json({
                status: "error",
                message: "Department does not exist"
            })
        }

        await PositionModel.create({
            name: position,
            department_id: department_id
        });

        return res.status(201).json({
            status: "success",
            message: "Position created successfully",
        });
    } catch (error) {
        return errorHandler(res, error);
    }
}

const AuthController = {
    addDepartment,
    fetchDepartment,
    deleteDepartment,

    fetchPosition,
    fetchPositionAndCountEmployee,
    deletePosition,
    addPosition,

    addEmployee,
    fetchEmployee,
    fetchEmployeeById,
    editEmployee,
    deleteEmployee,
    getAdminCount,
    getEmployeeCount,
    getSalaryTotal,
    getListAdmin,
    uploadFile,
    searchEmployee,
    fetchDepartmentAndCountEmployee
}

export default AuthController;