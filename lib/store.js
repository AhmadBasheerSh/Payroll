"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppStore = void 0;
var zustand_1 = require("zustand");
var middleware_1 = require("zustand/middleware");
var mock_data_1 = require("./mock-data");
var utils_1 = require("./utils");
exports.useAppStore = (0, zustand_1.create)()((0, middleware_1.persist)(function (set, get) { return ({
    // Auth
    currentUser: null,
    isAuthenticated: false,
    login: function (employeeId, password) {
        var employee = get().employees.find(function (e) { return e.employeeId === employeeId &&
            (e.password === password || password === e.employeeId.slice(-4)); });
        if (employee && employee.status !== 'terminated') {
            set({
                currentUser: {
                    id: employee.id,
                    employeeId: employee.employeeId,
                    fullName: employee.fullName,
                    role: employee.role,
                    department: employee.department
                },
                isAuthenticated: true
            });
            (0, utils_1.setAuthCookies)(employee.role || 'employee', employee.employeeId);
            return true;
        }
        return false;
    },
    logout: function () {
        (0, utils_1.clearAuthCookies)();
        set({ currentUser: null, isAuthenticated: false });
    },
    // Employees
    employees: mock_data_1.mockEmployees,
    addEmployee: function (employeeData) {
        var remaining = employeeData.baseSalary - employeeData.withdrawals;
        var newEmployee = __assign(__assign({}, employeeData), { id: crypto.randomUUID(), remaining: remaining, createdAt: new Date(), updatedAt: new Date() });
        set(function (state) { return ({ employees: __spreadArray(__spreadArray([], state.employees, true), [newEmployee], false) }); });
        // Update department count
        var dept = get().departments.find(function (d) { return d.id === employeeData.departmentId; });
        if (dept) {
            set(function (state) { return ({
                departments: state.departments.map(function (d) {
                    return d.id === employeeData.departmentId
                        ? __assign(__assign({}, d), { employeeCount: d.employeeCount + 1 }) : d;
                })
            }); });
        }
    },
    updateEmployee: function (id, data) {
        set(function (state) { return ({
            employees: state.employees.map(function (emp) {
                if (emp.id === id) {
                    var updated = __assign(__assign(__assign({}, emp), data), { updatedAt: new Date() });
                    updated.remaining = updated.baseSalary - updated.withdrawals;
                    return updated;
                }
                return emp;
            })
        }); });
    },
    deleteEmployee: function (id) {
        var employee = get().employees.find(function (e) { return e.id === id; });
        if (employee) {
            set(function (state) { return ({
                employees: state.employees.filter(function (e) { return e.id !== id; }),
                departments: state.departments.map(function (d) {
                    return d.id === employee.departmentId
                        ? __assign(__assign({}, d), { employeeCount: Math.max(0, d.employeeCount - 1) }) : d;
                })
            }); });
        }
    },
    getEmployeeById: function (id) { return get().employees.find(function (e) { return e.id === id; }); },
    getEmployeeByEmployeeId: function (employeeId) { return get().employees.find(function (e) { return e.employeeId === employeeId; }); },
    updateEmployeeStatus: function (id, status) {
        set(function (state) { return ({
            employees: state.employees.map(function (emp) {
                return emp.id === id ? __assign(__assign({}, emp), { status: status, updatedAt: new Date() }) : emp;
            })
        }); });
    },
    // Branches
    branches: mock_data_1.mockBranches,
    addBranch: function (name) {
        var newBranch = {
            id: crypto.randomUUID(),
            name: name,
            createdAt: new Date()
        };
        set(function (state) { return ({ branches: __spreadArray(__spreadArray([], state.branches, true), [newBranch], false) }); });
    },
    updateBranch: function (id, name) {
        set(function (state) { return ({
            branches: state.branches.map(function (b) {
                return b.id === id ? __assign(__assign({}, b), { name: name }) : b;
            }),
            employees: state.employees.map(function (e) {
                return e.branchId === id ? __assign(__assign({}, e), { branch: name }) : e;
            })
        }); });
    },
    deleteBranch: function (id) {
        set(function (state) { return ({
            branches: state.branches.filter(function (b) { return b.id !== id; })
        }); });
    },
    // Departments
    departments: mock_data_1.mockDepartments,
    addDepartment: function (name) {
        var newDept = {
            id: crypto.randomUUID(),
            name: name,
            employeeCount: 0,
            createdAt: new Date()
        };
        set(function (state) { return ({ departments: __spreadArray(__spreadArray([], state.departments, true), [newDept], false) }); });
    },
    updateDepartment: function (id, name) {
        set(function (state) { return ({
            departments: state.departments.map(function (d) {
                return d.id === id ? __assign(__assign({}, d), { name: name }) : d;
            }),
            employees: state.employees.map(function (e) {
                return e.departmentId === id ? __assign(__assign({}, e), { department: name }) : e;
            })
        }); });
    },
    deleteDepartment: function (id) {
        set(function (state) { return ({
            departments: state.departments.filter(function (d) { return d.id !== id; })
        }); });
    },
    // Payroll Sheets
    payrollSheets: mock_data_1.mockPayrollSheets,
    addPayrollSheet: function (month, year) {
        var _a;
        var newSheet = {
            id: crypto.randomUUID(),
            month: month,
            year: year,
            status: 'draft',
            entries: [],
            totalGrossSalary: 0,
            totalWithdrawals: 0,
            totalNetSalary: 0,
            totalCashReceived: 0,
            totalTransferReceived: 0,
            totalRemaining: 0,
            createdAt: new Date(),
            approvedAt: null,
            closedAt: null,
            createdBy: ((_a = get().currentUser) === null || _a === void 0 ? void 0 : _a.employeeId) || 'admin'
        };
        set(function (state) { return ({ payrollSheets: __spreadArray(__spreadArray([], state.payrollSheets, true), [newSheet], false) }); });
        return newSheet;
    },
    updatePayrollSheet: function (id, data) {
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.map(function (sheet) {
                return sheet.id === id ? __assign(__assign({}, sheet), data) : sheet;
            })
        }); });
    },
    deletePayrollSheet: function (id) {
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.filter(function (sheet) { return sheet.id !== id; })
        }); });
    },
    getPayrollSheet: function (id) { return get().payrollSheets.find(function (sheet) { return sheet.id === id; }); },
    updatePayrollStatus: function (id, status) {
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.map(function (sheet) {
                if (sheet.id === id) {
                    return __assign(__assign({}, sheet), { status: status, approvedAt: status === 'approved' ? new Date() : sheet.approvedAt, closedAt: status === 'closed' ? new Date() : sheet.closedAt });
                }
                return sheet;
            })
        }); });
    },
    addPayrollEntry: function (sheetId, entry) {
        var newEntry = __assign(__assign({}, entry), { id: crypto.randomUUID() });
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.map(function (sheet) {
                if (sheet.id === sheetId) {
                    var entries = __spreadArray(__spreadArray([], sheet.entries, true), [newEntry], false);
                    return __assign(__assign(__assign({}, sheet), { entries: entries }), calculatePayrollTotals(entries));
                }
                return sheet;
            })
        }); });
    },
    updatePayrollEntry: function (sheetId, entryId, data) {
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.map(function (sheet) {
                if (sheet.id === sheetId) {
                    var entries = sheet.entries.map(function (entry) {
                        return entry.id === entryId ? __assign(__assign({}, entry), data) : entry;
                    });
                    return __assign(__assign(__assign({}, sheet), { entries: entries }), calculatePayrollTotals(entries));
                }
                return sheet;
            })
        }); });
    },
    deletePayrollEntry: function (sheetId, entryId) {
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.map(function (sheet) {
                if (sheet.id === sheetId) {
                    var entries = sheet.entries.filter(function (entry) { return entry.id !== entryId; });
                    return __assign(__assign(__assign({}, sheet), { entries: entries }), calculatePayrollTotals(entries));
                }
                return sheet;
            })
        }); });
    },
    importPayrollEntries: function (sheetId, entries) {
        var newEntries = entries.map(function (entry) { return (__assign(__assign({}, entry), { id: crypto.randomUUID() })); });
        set(function (state) { return ({
            payrollSheets: state.payrollSheets.map(function (sheet) {
                if (sheet.id === sheetId) {
                    var allEntries = __spreadArray(__spreadArray([], sheet.entries, true), newEntries, true);
                    return __assign(__assign(__assign({}, sheet), { entries: allEntries }), calculatePayrollTotals(allEntries));
                }
                return sheet;
            })
        }); });
    },
    // Review Requests
    reviewRequests: mock_data_1.mockReviewRequests,
    addReviewRequest: function (request) {
        var newRequest = __assign(__assign({}, request), { id: crypto.randomUUID(), status: 'pending', adminResponse: null, createdAt: new Date(), updatedAt: new Date() });
        set(function (state) { return ({ reviewRequests: __spreadArray(__spreadArray([], state.reviewRequests, true), [newRequest], false) }); });
    },
    updateReviewRequest: function (id, data) {
        set(function (state) { return ({
            reviewRequests: state.reviewRequests.map(function (req) {
                return req.id === id ? __assign(__assign(__assign({}, req), data), { updatedAt: new Date() }) : req;
            })
        }); });
    },
    updateReviewRequestStatus: function (id, status, response) {
        set(function (state) { return ({
            reviewRequests: state.reviewRequests.map(function (req) {
                return req.id === id ? __assign(__assign({}, req), { status: status, adminResponse: response || req.adminResponse, updatedAt: new Date() }) : req;
            })
        }); });
    },
    deleteReviewRequest: function (id) {
        set(function (state) { return ({
            reviewRequests: state.reviewRequests.filter(function (req) { return req.id !== id; })
        }); });
    },
    // Salary History
    salaryHistory: mock_data_1.mockSalaryHistory,
    addSalaryHistory: function (history) {
        var newHistory = __assign(__assign({}, history), { id: crypto.randomUUID(), createdAt: new Date() });
        set(function (state) { return ({ salaryHistory: __spreadArray(__spreadArray([], state.salaryHistory, true), [newHistory], false) }); });
    },
    // Notifications
    notifications: [],
    addNotification: function (notification) {
        var newNotification = __assign(__assign({}, notification), { id: crypto.randomUUID(), read: false, createdAt: new Date() });
        set(function (state) { return ({ notifications: __spreadArray([newNotification], state.notifications, true) }); });
    },
    markAsRead: function (id) {
        set(function (state) { return ({
            notifications: state.notifications.map(function (n) {
                return n.id === id ? __assign(__assign({}, n), { read: true }) : n;
            })
        }); });
    },
    markAllAsRead: function () {
        set(function (state) { return ({
            notifications: state.notifications.map(function (n) { return (__assign(__assign({}, n), { read: true })); })
        }); });
    },
    // Settings
    cashDaysDefault: 3,
    setCashDaysDefault: function (days) { return set({ cashDaysDefault: days }); },
    // Import
    importEmployees: function (importedEmployees) {
        var newEmployees = importedEmployees.map(function (emp) {
            var _a, _b, _c, _d, _e;
            var dept = get().departments.find(function (d) { return d.name === emp.department; });
            var branch = get().branches.find(function (b) { return b.name === emp.branch; });
            var baseSalary = emp.baseSalary || 0;
            var withdrawals = emp.withdrawals || 0;
            return {
                id: crypto.randomUUID(),
                nationalId: emp.nationalId || '',
                fullName: emp.fullName || 'غير معروف',
                phoneNumber: emp.phoneNumber || '',
                password: emp.password || ((_a = emp.employeeId) === null || _a === void 0 ? void 0 : _a.slice(-4)) || '0000',
                employeeId: emp.employeeId || "E".concat(Date.now()),
                branchId: (branch === null || branch === void 0 ? void 0 : branch.id) || ((_b = get().branches[0]) === null || _b === void 0 ? void 0 : _b.id) || '',
                branch: emp.branch || ((_c = get().branches[0]) === null || _c === void 0 ? void 0 : _c.name) || '',
                departmentId: (dept === null || dept === void 0 ? void 0 : dept.id) || ((_d = get().departments[0]) === null || _d === void 0 ? void 0 : _d.id) || '',
                department: emp.department || ((_e = get().departments[0]) === null || _e === void 0 ? void 0 : _e.name) || '',
                workType: emp.workType || 'hourly',
                hourlyRate: emp.hourlyRate || 15,
                dailyRate: emp.dailyRate || 120,
                wallet: emp.wallet || { phoneNumber: '', ownerName: '', ownerId: '' },
                status: emp.status || 'active',
                role: emp.role || 'employee',
                baseSalary: baseSalary,
                workHours: emp.workHours || 0,
                withdrawals: withdrawals,
                remaining: baseSalary - withdrawals,
                paymentStatus: emp.paymentStatus || 'processing',
                cashDays: emp.cashDays || get().cashDaysDefault,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        });
        set(function (state) { return ({ employees: __spreadArray(__spreadArray([], state.employees, true), newEmployees, true) }); });
    }
}); }, {
    name: 'o2-payroll-storage-v2',
    partialize: function (state) { return ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        employees: state.employees,
        branches: state.branches,
        departments: state.departments,
        payrollSheets: state.payrollSheets,
        reviewRequests: state.reviewRequests,
        salaryHistory: state.salaryHistory,
        notifications: state.notifications,
        cashDaysDefault: state.cashDaysDefault
    }); }
}));
// Helper function to calculate payroll totals
function calculatePayrollTotals(entries) {
    return {
        totalGrossSalary: entries.reduce(function (sum, e) { return sum + e.grossSalary; }, 0),
        totalWithdrawals: entries.reduce(function (sum, e) { return sum + e.withdrawals; }, 0),
        totalNetSalary: entries.reduce(function (sum, e) { return sum + e.netSalary; }, 0),
        totalCashReceived: entries.reduce(function (sum, e) { return sum + e.cashReceived; }, 0),
        totalTransferReceived: entries.reduce(function (sum, e) { return sum + e.transferReceived; }, 0),
        totalRemaining: entries.reduce(function (sum, e) { return sum + e.remaining; }, 0)
    };
}
