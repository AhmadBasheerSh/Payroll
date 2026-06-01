"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.setAuthCookies = setAuthCookies;
exports.clearAuthCookies = clearAuthCookies;
var clsx_1 = require("clsx");
var tailwind_merge_1 = require("tailwind-merge");
function cn() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
var AUTH_COOKIE_NAME = 'complete_tasks_auth';
var ROLE_COOKIE_NAME = 'complete_tasks_role';
var EMPLOYEE_COOKIE_NAME = 'complete_tasks_employee';
var COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day
function setAuthCookies(role, employeeId) {
    if (typeof document === 'undefined')
        return;
    document.cookie = "".concat(AUTH_COOKIE_NAME, "=1; path=/; max-age=").concat(COOKIE_MAX_AGE);
    document.cookie = "".concat(ROLE_COOKIE_NAME, "=").concat(encodeURIComponent(role), "; path=/; max-age=").concat(COOKIE_MAX_AGE);
    document.cookie = "".concat(EMPLOYEE_COOKIE_NAME, "=").concat(encodeURIComponent(employeeId), "; path=/; max-age=").concat(COOKIE_MAX_AGE);
}
function clearAuthCookies() {
    if (typeof document === 'undefined')
        return;
    document.cookie = "".concat(AUTH_COOKIE_NAME, "=; path=/; max-age=0");
    document.cookie = "".concat(ROLE_COOKIE_NAME, "=; path=/; max-age=0");
    document.cookie = "".concat(EMPLOYEE_COOKIE_NAME, "=; path=/; max-age=0");
}
