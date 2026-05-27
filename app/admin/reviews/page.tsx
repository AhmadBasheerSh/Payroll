'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/header'
import { listReviewRequests, updateReviewRequest as apiUpdateReviewRequest, deleteReviewRequest as apiDeleteReviewRequest } from '@/lib/api/reviews'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  X,
  Filter,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { ReviewRequest, ReviewRequestStatus } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

const statusLabels: Record<ReviewRequestStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'مقبول',
  rejected: 'مرفوض'
}

const statusColors: Record<ReviewRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200'
}

export default function ReviewRequestsPage() {
  const [reviewRequests, setReviewRequests] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<ReviewRequestStatus | 'all'>('all')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseStatus, setResponseStatus] = useState<'approved' | 'rejected'>('approved')

  // Filter requests
  const filteredRequests = reviewRequests.filter(req => 
    statusFilter === 'all' || req.status === statusFilter
  )

  // Stats
  const pendingCount = reviewRequests.filter(r => r.status === 'pending').length
  const approvedCount = reviewRequests.filter(r => r.status === 'approved').length
  const rejectedCount = reviewRequests.filter(r => r.status === 'rejected').length

  const handleView = (request: ReviewRequest) => {
    setSelectedRequest(request)
    setViewDialogOpen(true)
  }

  const handleRespond = (request: ReviewRequest, status: 'approved' | 'rejected') => {
    setSelectedRequest(request)
    setResponseStatus(status)
    setResponseText('')
    setResponseDialogOpen(true)
  }

  const refreshRequests = async () => {
    const res = await listReviewRequests()
    if (!res.error && res.data) setReviewRequests(res.data)
  }

  const submitResponse = async () => {
    if (selectedRequest) {
      apiUpdateReviewRequest(selectedRequest.id, { status: responseStatus, admin_response: responseText });    
      //   toast.error(res.error.message || 'Failed to update review request')
      //   return
      // }
      toast.success(responseStatus === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب')
      setResponseDialogOpen(false)
      listReviewRequests().then(res => { if (!res.error && res.data) setReviewRequests(res.data) })
      // setSelectedRequest(null)
      // await refreshRequests()
    }
  }

  const quickAction = (request: ReviewRequest, status: 'approved' | 'rejected') => {
    apiUpdateReviewRequest(request.id, { status })
  // const quickAction = async (request: ReviewRequest, status: 'approved' | 'rejected') => {
  //   const res = await apiUpdateReviewRequest(request.id, { status })
  //   if (res.error) {
  //     toast.error(res.error.message || 'Failed to update review request')
  //     return
  //   }
    toast.success(status === 'approved' ? 'تم قبول الطلب' : 'تم رفض الطلب')
     listReviewRequests().then(res => { if (!res.error && res.data) setReviewRequests(res.data) })
    // await refreshRequests()
  }

  useEffect(() => {
    listReviewRequests().then(res => { if (!res.error && res.data) setReviewRequests(res.data) })
    // refreshRequests()
  }, [])

  return (
    <div className="min-h-screen">
      <AdminHeader 
        title="طلبات المراجعة" 
        description="إدارة طلبات مراجعة الرواتب"
      />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md text-right ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reviewRequests.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md text-right ${statusFilter === 'pending' ? 'ring-2 ring-amber-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md text-right ${statusFilter === 'approved' ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">مقبول</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`p-4 rounded-xl border bg-card transition-all hover:shadow-md text-right ${statusFilter === 'rejected' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                <p className="text-sm text-muted-foreground">مرفوض</p>
              </div>
            </div>
          </button>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>فلترة:</span>
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewRequestStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطلبات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="approved">مقبول</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        
        {/* Requests Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border bg-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="text-right font-semibold">الموظف</TableHead>
                <TableHead className="text-right font-semibold">الشهر</TableHead>
                <TableHead className="text-right font-semibold">سبب المراجعة</TableHead>
                <TableHead className="text-right font-semibold">الحالة</TableHead>
                <TableHead className="text-right font-semibold">التاريخ</TableHead>
                <TableHead className="text-right font-semibold">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-8 w-8 opacity-50" />
                      <p>لا توجد طلبات مراجعة</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((request, index) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{request.employeeNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {monthNames[request.month - 1]} {request.year}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate">{request.reason}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[request.status as ReviewRequestStatus]} border font-medium`}>
                          {statusLabels[request.status as ReviewRequestStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleView(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-100"
                                onClick={() => handleRespond(request, 'approved')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-600 hover:bg-red-100"
                                onClick={() => handleRespond(request, 'rejected')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>
      
      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب المراجعة</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedRequest.employeeName}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.employeeNumber}</p>
                </div>
                <Badge variant="outline" className={`${statusColors[selectedRequest.status]} border font-medium`}>
                  {statusLabels[selectedRequest.status]}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">الشهر</Label>
                <p className="font-medium">{monthNames[selectedRequest.month - 1]} {selectedRequest.year}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-muted-foreground">سبب المراجعة</Label>
                <div className="bg-muted rounded-lg p-4">
                  <p>{selectedRequest.reason}</p>
                </div>
              </div>
              
              {selectedRequest.adminResponse && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">رد الإدارة</Label>
                  <div className={`rounded-lg p-4 ${selectedRequest.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <p>{selectedRequest.adminResponse}</p>
                  </div>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                تم الإرسال: {formatDistanceToNow(new Date(selectedRequest.createdAt), { addSuffix: true, locale: ar })}
              </div>
              
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleRespond(selectedRequest, 'approved')
                    }}
                  >
                    <Check className="h-4 w-4 ml-2" />
                    قبول
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setViewDialogOpen(false)
                      handleRespond(selectedRequest, 'rejected')
                    }}
                  >
                    <X className="h-4 w-4 ml-2" />
                    رفض
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseStatus === 'approved' ? 'قبول الطلب' : 'رفض الطلب'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الرد (اختياري)</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="أضف رداً للموظف..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={submitResponse}
              className={responseStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              variant={responseStatus === 'rejected' ? 'destructive' : 'default'}
            >
              {responseStatus === 'approved' ? 'قبول' : 'رفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
