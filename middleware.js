"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
var server_1 = require("next/server");
var ADMIN_ROLES = ['admin', 'hr'];
var AUTH_COOKIE_NAME = 'complete_tasks_auth';
var ROLE_COOKIE_NAME = 'complete_tasks_role';
function middleware(request) {
    var _a, _b;
    var pathname = request.nextUrl.pathname;
    var authCookie = (_a = request.cookies.get(AUTH_COOKIE_NAME)) === null || _a === void 0 ? void 0 : _a.value;
    var roleCookie = (_b = request.cookies.get(ROLE_COOKIE_NAME)) === null || _b === void 0 ? void 0 : _b.value;
    if (!authCookie || authCookie !== '1') {
        return server_1.NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/admin') && !ADMIN_ROLES.includes(roleCookie !== null && roleCookie !== void 0 ? roleCookie : '')) {
        return server_1.NextResponse.redirect(new URL('/', request.url));
    }
    return server_1.NextResponse.next();
}
exports.config = {
    matcher: ['/admin/:path*', '/employee/:path*']
};
