"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addEmployee as apiAddEmployee,
  updateEmployee as apiUpdateEmployee,
} from "@/lib/api/employees";
import { listDepartments } from "@/lib/api/departments";
import { listBranches } from "@/lib/api/branches";
import type {
  Employee,
  WorkType,
  UserRole,
  EmployeeStatus,
  PaymentStatus,
} from "@/lib/types";
import { User, Briefcase, Wallet, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  mode: "add" | "edit" | "view";
  isAdminPage?: boolean;
}

interface EmployeeFormData {
  nationalId: string;
  fullName: string;
  phoneNumber: string;
  password: string;
  employeeId: string;
  branchId: string;
  departmentId: string;
  workType: WorkType;
  hourlyRate: number;
  dailyRate: number;
  walletPhone: string;
  walletOwnerName: string;
  walletOwnerId: string;
  status: EmployeeStatus;
  role: UserRole;
  baseSalary: number;
  workHours: number;
  withdrawals: number;
  paymentStatus: PaymentStatus;
  cashDays: number;
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  mode,
  isAdminPage = false,
}: EmployeeDialogProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const cashDaysDefault = 0;

  // Get current user from store or localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('o2_current_user');
      if (raw) setCurrentUser(JSON.parse(raw));
    } catch (e) {
      setCurrentUser(null);
    }
  }, []);

  const defaultFormData = useMemo<EmployeeFormData>(
    () => ({
      nationalId: "",
      fullName: "",
      phoneNumber: "",
      password: "",
      employeeId: "",
      branchId: "",
      departmentId: "",
      workType: "hourly",
      hourlyRate: 15,
      dailyRate: 120,
      walletPhone: "",
      walletOwnerName: "",
      walletOwnerId: "",
      status: "active",
      role: "employee",
      baseSalary: 0,
      workHours: 0,
      withdrawals: 0,
      paymentStatus: "processing",
      cashDays: cashDaysDefault,
    }),
    [cashDaysDefault],
  );

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    async function loadLookups() {
      const deps = await listDepartments();
      if (!deps.error && deps.data) setDepartments(deps.data);
      const brs = await listBranches();
      if (!brs.error && brs.data) setBranches(brs.data);
    }
    loadLookups();
  }, []);

  useEffect(() => {
    if (!open) return;

    if (employee && (mode === "edit" || mode === "view")) {
      setFormData({
        nationalId: employee.nationalId || "",
        fullName: employee.fullName || "",
        phoneNumber: employee.phoneNumber || "",
        password: employee.password || "",
        employeeId: employee.employeeId || "",
        branchId: employee.branchId || "",
        departmentId: employee.departmentId || "",
        workType: employee.workType,
        hourlyRate: employee.hourlyRate || 0,
        dailyRate: employee.dailyRate || 0,
        walletPhone: employee.wallet?.phoneNumber || "",
        walletOwnerName: employee.wallet?.ownerName || "",
        walletOwnerId: employee.wallet?.ownerId || "",
        status: employee.status,
        role: employee.role,
        baseSalary: employee.baseSalary || 0,
        workHours: employee.workHours || 0,
        withdrawals: employee.withdrawals || 0,
        paymentStatus: employee.paymentStatus,
        cashDays: employee.cashDays || 0,
      });
    } else if (mode === "add") {
      setFormData({
        ...defaultFormData,
        employeeId: `E${Date.now().toString().slice(-5)}`,
      });
    }
  }, [open, employee, mode, defaultFormData]);

  useEffect(() => {
    if (!open || mode !== "add") return;

    setFormData((prev) => ({
      ...prev,
      branchId: prev.branchId || branches[0]?.id || "",
      departmentId: prev.departmentId || departments[0]?.id || "",
    }));
  }, [open, mode, branches, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("يرجى إدخال اسم الموظف");
      return;
    }

    if (!formData.employeeId.trim()) {
      toast.error("ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ¸ÙŠÙÙŠ");
      return;
    }
    if (!formData.branchId) {
      toast.error("ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ÙØ±Ø¹");
      return;
    }
    if (!formData.departmentId) {
      toast.error("ÙŠØ±Ø¬Ù‰ Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù‚Ø³Ù…");
      return;
    }

    const employeeData = {
      nationalId: formData.nationalId,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      password: formData.password || formData.employeeId.slice(-4),
      employeeId: formData.employeeId,
      branchId: formData.branchId,
      departmentId: formData.departmentId,
      workType: formData.workType,
      hourlyRate: formData.hourlyRate,
      dailyRate: formData.dailyRate,
      wallet: {
        phoneNumber: formData.walletPhone,
        ownerName: formData.walletOwnerName,
        ownerId: formData.walletOwnerId,
      },
      status: formData.status,
      role: formData.role,
      baseSalary: formData.baseSalary,
      workHours: formData.workHours,
      withdrawals: formData.withdrawals,
      remaining: formData.baseSalary,
      paymentStatus: formData.paymentStatus,
      cashDays: formData.cashDays,
    };

    if (mode === "add") {
      const res = await apiAddEmployee(employeeData);

      if (res.error) {
        toast.error(res.error.message || "فشل إضافة الموظف");
        return;
      }
      toast.success("تم إضافة الموظف بنجاح");
    } else if (mode === "edit" && employee) {
      const res = await apiUpdateEmployee(employee.id, employeeData);
      if (res.error) {
        toast.error("فشل تحديث الموظف");
        return;
      }
      toast.success("تم تحديث بيانات الموظف");
    }

    onOpenChange(false);
    // Refresh the page to reflect changes (keeps UI code unchanged)
    location.reload();
  };

  const isReadOnly = mode === "view";
  const isAdmin = currentUser?.role === "admin";
  const canEditJobData = isAdminPage || mode === "add" || isAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "إضافة موظف جديد"}
            {mode === "edit" && "تعديل بيانات الموظف"}
            {mode === "view" && "عرض بيانات الموظف"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">أساسية</span>
              </TabsTrigger>
              <TabsTrigger value="job" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">وظيفية</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">المحفظة</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className=" sm:inline">الحالة</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Data Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">رقم الهوية</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nationalId: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="أدخل رقم الهوية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">اسم الموظف *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="أدخل الاسم الكامل"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">رقم الجوال</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة السر</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="أدخل كلمة السر"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Job Data Tab */}
            <TabsContent value="job" className="space-y-4">
              {!canEditJobData && mode === "edit" && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    البيانات الوظيفية غير قابلة للتعديل إلا من قبل الأدمن
                    الرئيسي
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">الرقم الوظيفي</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        employeeId: e.target.value,
                      }))
                    }
                    disabled={isReadOnly || !canEditJobData}
                    placeholder="E20001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">الفرع</Label>
                  <Select
                    value={formData.branchId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, branchId: value }))
                    }
                    disabled={isReadOnly || !canEditJobData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">القسم</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, departmentId: value }))
                    }
                    disabled={isReadOnly || !canEditJobData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workType">نوع الدوام</Label>
                  <Select
                    value={formData.workType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        workType: value as WorkType,
                      }))
                    }
                    disabled={isReadOnly || !canEditJobData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الدوام" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">ساعات</SelectItem>
                      <SelectItem value="daily">يومية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.workType === "hourly" ? (
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">سعر الساعة (₪)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hourlyRate: Number(e.target.value),
                        }))
                      }
                      disabled={isReadOnly || !canEditJobData}
                      min={0}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="dailyRate">سعر اليومية (₪)</Label>
                    <Input
                      id="dailyRate"
                      type="number"
                      value={formData.dailyRate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          dailyRate: Number(e.target.value),
                        }))
                      }
                      disabled={isReadOnly || !canEditJobData}
                      min={0}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Wallet Data Tab */}
            <TabsContent value="wallet" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="walletPhone">رقم جوال المحفظة</Label>
                  <Input
                    id="walletPhone"
                    value={formData.walletPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        walletPhone: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="walletOwnerName">اسم صاحب المحفظة</Label>
                  <Input
                    id="walletOwnerName"
                    value={formData.walletOwnerName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        walletOwnerName: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="أدخل الاسم"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="walletOwnerId">رقم هوية صاحب المحفظة</Label>
                  <Input
                    id="walletOwnerId"
                    value={formData.walletOwnerId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        walletOwnerId: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    placeholder="أدخل رقم الهوية"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">حالة الموظف</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as EmployeeStatus,
                      }))
                    }
                    disabled={isReadOnly || (!isAdminPage && !isAdmin && mode === "edit")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="suspended">موقوف</SelectItem>
                      <SelectItem value="terminated">مفصول</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">الصلاحية</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: value as UserRole,
                      }))
                    }
                    disabled={isReadOnly || (!isAdminPage && !isAdmin && mode === "edit")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصلاحية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">موظف</SelectItem>
                      <SelectItem value="hr">موارد بشرية</SelectItem>
                      <SelectItem value="admin">مدير</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {mode !== "view" && (
            <div className="flex gap-3 justify-end pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button type="submit">
                {mode === "add" ? "إضافة الموظف" : "حفظ التغييرات"}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
