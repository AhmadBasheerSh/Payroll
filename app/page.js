'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var store_1 = require("@/lib/store");
var supabase_1 = require("@/lib/supabase");
var utils_1 = require("@/lib/utils");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var card_1 = require("@/components/ui/card");
var sonner_1 = require("sonner");
var lucide_react_1 = require("lucide-react");
function LoginPage() {
    var _this = this;
    var router = (0, navigation_1.useRouter)();
    var login = (0, store_1.useAppStore)().login;
    var _a = (0, react_1.useState)(''), employeeId = _a[0], setEmployeeId = _a[1];
    var _b = (0, react_1.useState)(''), password = _b[0], setPassword = _b[1];
    var _c = (0, react_1.useState)(false), showPassword = _c[0], setShowPassword = _c[1];
    var _d = (0, react_1.useState)(false), isLoading = _d[0], setIsLoading = _d[1];
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var normalizedEmployeeId, _a, data, error, validPassword, employeeIdValue, normalizedRole, role;
        var _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    e.preventDefault();
                    setIsLoading(true);
                    normalizedEmployeeId = employeeId.trim();
                    return [4 /*yield*/, supabase_1.supabase
                            .from('employees')
                            .select('id, full_name, employee_id, role, department_id, status, password')
                            .eq('employee_id', normalizedEmployeeId)
                            .maybeSingle()];
                case 1:
                    _a = _e.sent(), data = _a.data, error = _a.error;
                    if (error || !data) {
                        sonner_1.toast.error('بيانات الدخول غير صحيحة');
                        setIsLoading(false);
                        return [2 /*return*/];
                    }
                    validPassword = data.password === password || password === normalizedEmployeeId.slice(-4);
                    if (!validPassword || data.status === 'terminated') {
                        sonner_1.toast.error('بيانات الدخول غير صحيحة');
                        setIsLoading(false);
                        return [2 /*return*/];
                    }
                    employeeIdValue = String((_b = data.employee_id) !== null && _b !== void 0 ? _b : '').trim();
                    if (!employeeIdValue) {
                        sonner_1.toast.error('بيانات الدخول غير صحيحة');
                        setIsLoading(false);
                        return [2 /*return*/];
                    }
                    normalizedRole = String((_c = data.role) !== null && _c !== void 0 ? _c : 'employee').trim().toLowerCase();
                    role = normalizedRole === 'admin' || normalizedRole === 'hr' || normalizedRole === 'employee'
                        ? normalizedRole
                        : 'employee';
                    store_1.useAppStore.setState({
                        currentUser: {
                            id: data.id,
                            employeeId: employeeIdValue,
                            fullName: data.full_name,
                            role: role,
                            department: (_d = data.department_id) !== null && _d !== void 0 ? _d : ''
                        },
                        isAuthenticated: true
                    });
                    (0, utils_1.setAuthCookies)(role, employeeIdValue);
                    sonner_1.toast.success("\u0645\u0631\u062D\u0628\u0627\u064B ".concat(data.full_name));
                    if (role === 'admin' || role === 'hr') {
                        router.replace('/admin');
                    }
                    else {
                        router.replace("/employee/".concat(encodeURIComponent(employeeIdValue)));
                    }
                    setIsLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"/>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"/>
      </div>

      {/* ✅ Replaced framer-motion.div with CSS animation */}
      <div className="w-full max-w-md relative z-10 animate-fade-slide-up">
        <card_1.Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <card_1.CardHeader className="text-center pb-2">
            {/* Logo - CSS animation instead of motion.div */}
            <div className="mx-auto mb-4 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                <span className="text-3xl font-bold text-primary-foreground">O2</span>
              </div>
            </div>

            <card_1.CardTitle className="text-2xl font-bold">O2 Payroll System</card_1.CardTitle>
            <card_1.CardDescription>نظام إدارة رواتب الموظفين</card_1.CardDescription>
          </card_1.CardHeader>

          <card_1.CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label_1.Label htmlFor="employeeId">الرقم الوظيفي</label_1.Label>
                <div className="relative">
                  <lucide_react_1.User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                  <input_1.Input id="employeeId" placeholder="الرقم الوظيفي" value={employeeId} onChange={function (e) { return setEmployeeId(e.target.value); }} className="pr-10" required/>
                </div>
              </div>

              <div className="space-y-2">
                <label_1.Label htmlFor="password">كلمة المرور</label_1.Label>
                <div className="relative">
                  <lucide_react_1.Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                  <input_1.Input id="password" type={showPassword ? 'text' : 'password'} placeholder="  كلمة المرور" value={password} onChange={function (e) { return setPassword(e.target.value); }} className="pr-10 pl-10" required/>
                  <button type="button" onClick={function () { return setShowPassword(!showPassword); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth">
                    {showPassword ? <lucide_react_1.EyeOff className="h-5 w-5"/> : <lucide_react_1.Eye className="h-5 w-5"/>}
                  </button>
                </div>
              </div>

              <button_1.Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                {isLoading ? (<div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" style={{
                animation: 'spin 1s linear infinite',
            }}/>) : ('تسجيل الدخول')}
              </button_1.Button>
            </form>

            {/* Demo Credentials
        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <p className="text-sm font-medium text-muted-foreground mb-2">بياناتك:</p>
          <div className="space-y-1 text-sm">

            <p><span className="text-muted-foreground">موظف:</span> رقم الهوية  / 0003</p>
          </div>
        </div> */}
          </card_1.CardContent>
        </card_1.Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          © 2026 O2 Restaurant. جميع الحقوق محفوظة
        </p>
      </div>
    </div>);
}
