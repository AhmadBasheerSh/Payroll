"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/header";
import {
  listPayrollSheets,
  addPayrollSheet as apiAddPayrollSheet,
  updatePayrollSheet as apiUpdatePayrollSheet,
  deletePayrollSheet as apiDeletePayrollSheet,
} from "@/lib/api/payroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileSpreadsheet,
  Upload,
  Check,
  X,
  Calendar,
  DollarSign,
  Users,
  TrendingDown,
  Wallet,
  Eye,
  Pencil,
  Trash2,
  FileText,
  MoreHorizontal,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { PayrollSheet, PayrollEntry, PayrollStatus } from "@/lib/types";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const statusLabels: Record<PayrollStatus, string> = {
  draft: "مسودة",
  approved: "معتمد",
  closed: "مغلق",
};

const statusColors: Record<PayrollStatus, string> = {
  draft:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
  closed:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200",
};

export default function PayrollPage() {
  const [payrollSheets, setPayrollSheets] = useState<PayrollSheet[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<PayrollSheet | null>(null);
  const [newMonth, setNewMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    async function load() {
      const res = await listPayrollSheets();
      if (!res.error && res.data) setPayrollSheets(res.data as PayrollSheet[]);
    }
    load();
  }, []);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleCreateSheet = async () => {
    const month = parseInt(newMonth);
    const year = parseInt(newYear);

    // Check if sheet already exists
    const exists = payrollSheets.some(
      (s) => s.month === month && s.year === year,
    );
    if (exists) {
      toast.error("كشف الرواتب لهذا الشهر موجود بالفعل");
      return;
    }

    const res = await apiAddPayrollSheet({
      month,
      year,
      status: "draft",
      total_gross_salary: 0,
      total_withdrawals: 0,
      total_net_salary: 0,
    });
    if (res.error) {
      toast.error("فشل إنشاء الكشف");
      return;
    }
    toast.success(`تم إنشاء كشف رواتب ${monthNames[month - 1]} ${year}`);
    setCreateDialogOpen(false);
    location.reload();
  };

  const handleDeleteSheet = async () => {
    if (selectedSheet) {
      const res = await apiDeletePayrollSheet(selectedSheet.id);

      if (res.error) {
        toast.error("فشل حذف الكشف");
        return;
      }

      toast.success("تم حذف الكشف");
      setDeleteDialogOpen(false);
      setSelectedSheet(null);
      location.reload();
    }
  };

  // const handleDeleteSheet = () => {
  //   if (selectedSheet) {
  //     const res = await apiDeletePayrollSheet(selectedSheet.id)
  //     if (res.error) {
  //       toast.error('فشل حذف الكشف')
  //       return
  //     }
  //     toast.success('تم حذف كشف الرواتب')
  //     setDeleteDialogOpen(false)
  //     setSelectedSheet(null)
  //     location.reload()
  //   }
  // }

  const handleApprove = async (sheet: PayrollSheet) => {
    const res = await apiUpdatePayrollSheet(sheet.id, { status: "approved" });
    if (res.error) return toast.error("فشل تحديث الحالة");
    toast.success("تم اعتماد كشف الرواتب");
    location.reload();
  };

  const handleClose = async (sheet: PayrollSheet) => {
    const res = await apiUpdatePayrollSheet(sheet.id, { status: "closed" });
    if (res.error) return toast.error("فشل تحديث الحالة");
    toast.success("تم إغلاق كشف الرواتب");
    location.reload();
  };

  // Stats
  const totalSheets = payrollSheets.length;
  const draftSheets = payrollSheets.filter((s) => s.status === "draft").length;
  const approvedSheets = payrollSheets.filter(
    (s) => s.status === "approved",
  ).length;
  const totalSalaries = payrollSheets.reduce(
    (sum, s) => sum + (Number(s.totalGrossSalary) || 0),
    0,
  );

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="إثبات الرواتب"
        description="إدارة كشوفات الرواتب الشهرية"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSheets}</p>
                  <p className="text-sm text-muted-foreground">
                    إجمالي الكشوفات
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {draftSheets}
                  </p>
                  <p className="text-sm text-muted-foreground">مسودة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {approvedSheets}
                  </p>
                  <p className="text-sm text-muted-foreground">معتمد</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {totalSalaries.toLocaleString()} ₪
                  </p>
                  <p className="text-sm text-muted-foreground">
                    إجمالي الرواتب
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-between items-center"
        >
          <h2 className="text-lg font-semibold">كشوفات الرواتب</h2>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إنشاء كشف جديد
          </Button>
        </motion.div>

        {/* Payroll Sheets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-semibold">
                  الشهر
                </TableHead>
                <TableHead className="text-right font-semibold">
                  السنة
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الحالة
                </TableHead>
                <TableHead className="text-right font-semibold">
                  عدد الموظفين
                </TableHead>
                <TableHead className="text-right font-semibold">
                  إجمالي الرواتب
                </TableHead>
                <TableHead className="text-right font-semibold">
                  إجمالي السحوبات
                </TableHead>
                <TableHead className="text-right font-semibold">
                  صافي الرواتب
                </TableHead>
                <TableHead className="text-right font-semibold">
                  إجراءات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollSheets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 opacity-50" />
                      <p>لا توجد كشوفات رواتب</p>
                      <Button
                        variant="link"
                        onClick={() => setCreateDialogOpen(true)}
                      >
                        إنشاء كشف جديد
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payrollSheets
                  .sort((a, b) => b.year - a.year || b.month - a.month)
                  .map((sheet, index) => (
                    <motion.tr
                      key={sheet.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        {monthNames[sheet.month - 1]}
                      </TableCell>
                      <TableCell>{sheet.year}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusColors[sheet.status]} border font-medium`}
                        >
                          {statusLabels[sheet.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{sheet.entries?.length || 0}</TableCell>
                      <TableCell>
                        {(sheet.totalGrossSalary || 0).toLocaleString()} ₪
                      </TableCell>
                      <TableCell className="text-destructive">
                        {(sheet.totalWithdrawals || 0).toLocaleString()} ₪
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {(sheet.totalNetSalary || 0).toLocaleString()} ₪
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/payroll/${sheet.id}`}
                                className="flex items-center"
                              >
                                <Eye className="h-4 w-4 ml-2" />
                                عرض الكشف
                              </Link>
                            </DropdownMenuItem>
                            {sheet.status === "draft" && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/payroll/${sheet.id}`}
                                    className="flex items-center"
                                  >
                                    <Pencil className="h-4 w-4 ml-2" />
                                    تعديل الكشف
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(sheet)}
                                >
                                  <Check className="h-4 w-4 ml-2" />
                                  اعتماد الكشف
                                </DropdownMenuItem>
                              </>
                            )}
                            {sheet.status === "approved" && (
                              <DropdownMenuItem
                                onClick={() => handleClose(sheet)}
                              >
                                <Lock className="h-4 w-4 ml-2" />
                                إغلاق الكشف
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {sheet.status === "draft" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedSheet(sheet);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف الكشف
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء كشف رواتب جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الشهر</Label>
                <Select value={newMonth} onValueChange={setNewMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السنة</Label>
                <Select value={newYear} onValueChange={setNewYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              سيتم إنشاء كشف رواتب شهر {monthNames[parseInt(newMonth) - 1]}{" "}
              {newYear}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreateSheet}>
              <Plus className="h-4 w-4 ml-2" />
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف كشف رواتب{" "}
              {selectedSheet && monthNames[selectedSheet.month - 1]}{" "}
              {selectedSheet?.year} نهائياً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSheet}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
