import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AppLayout } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Shield, Edit, Trash2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";
import type { Employee } from "@shared/schema";

const roleColors: Record<string, string> = {
  admin: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  manager: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  staff: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  cashier: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const roleLabels: Record<string, string> = {
  admin: "ผู้ดูแล",
  manager: "ผู้จัดการ",
  staff: "พนักงาน",
  cashier: "แคชเชียร์",
};

export default function EmployeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<Employee[]>({ queryKey: ["/api/employees"] });

  const createMut = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/employees", { name, email, role, pin: pin || undefined });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setShowForm(false);
      setName(""); setEmail(""); setRole("staff"); setPin("");
      toast({ title: "เพิ่มพนักงานสำเร็จ" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/employees/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/employees"] }); toast({ title: "ลบพนักงานสำเร็จ" }); },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const r = await apiRequest("PUT", `/api/employees/${id}`, { active });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/employees"] }); },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-sky-300 to-blue-300 bg-clip-text text-transparent">พนักงาน</h1>
            <p className="text-sm text-white/50">จัดการพนักงานและสิทธิ์การเข้าถึง</p>
          </div>
          <Button data-testid="add-employee" onClick={() => setShowForm(!showForm)} className="bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30">
            <Plus className="w-4 h-4 mr-1" /> เพิ่มพนักงาน
          </Button>
        </div>

        {showForm && (
          <Card className="bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <Input data-testid="emp-name" value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อพนักงาน" className="bg-white/[0.03] border-white/[0.08]" />
              <div className="flex gap-3">
                <Input data-testid="emp-email" value={email} onChange={e => setEmail(e.target.value)} placeholder="อีเมล" className="bg-white/[0.03] border-white/[0.08] flex-1" />
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-40 bg-white/[0.03] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ผู้ดูแล</SelectItem>
                    <SelectItem value="manager">ผู้จัดการ</SelectItem>
                    <SelectItem value="staff">พนักงาน</SelectItem>
                    <SelectItem value="cashier">แคชเชียร์</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input data-testid="emp-pin" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN สำหรับ POS (4 หลัก)" maxLength={4} className="bg-white/[0.03] border-white/[0.08] w-40" />
              <Button data-testid="save-employee" onClick={() => createMut.mutate()} disabled={!name || createMut.isPending} className="bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30">
                บันทึก
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map(emp => (
            <Card key={emp.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl hover:border-sky-500/20 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white/90">{emp.name}</h3>
                    <p className="text-xs text-white/40">{emp.email || "-"}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", roleColors[emp.role] || roleColors.staff)}>
                    {roleLabels[emp.role] || emp.role}
                  </Badge>
                  <Switch checked={emp.active !== false} onCheckedChange={(active) => toggleMut.mutate({ id: emp.id, active })} />
                  <button data-testid={`del-emp-${emp.id}`} onClick={() => deleteMut.mutate(emp.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400/40" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {employees.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30">ยังไม่มีพนักงาน</p>
            </div>
          )}
        </div>
      </div>
      <PerplexityAttribution />
    </AppLayout>
  );
}
