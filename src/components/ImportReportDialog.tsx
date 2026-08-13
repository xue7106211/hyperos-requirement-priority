import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImportReport {
  success: number;
  skipped: number;
  reasons: string[];
}

interface ImportReportDialogProps {
  open: boolean;
  onClose: () => void;
  report: ImportReport;
}

export function ImportReportDialog({ open, onClose, report }: ImportReportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>CSV 导入报告</DialogTitle>
          <DialogDescription>
            导入完成，以下是处理结果摘要。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex gap-4">
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-2xl bg-muted px-4 py-2">
              <span className="text-lg font-semibold tabular-nums">{report.success}</span>
              <span className="text-xs text-muted-foreground">成功导入</span>
            </div>
            <div className="flex min-w-[5.5rem] flex-col items-center rounded-2xl bg-muted px-4 py-2">
              <span className="text-lg font-semibold tabular-nums">{report.skipped}</span>
              <span className="text-xs text-muted-foreground">跳过</span>
            </div>
          </div>

          {report.reasons.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">跳过原因：</p>
              <ul className="max-h-40 space-y-0.5 overflow-y-auto rounded-xl bg-muted/60 p-2">
                {report.reasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button size="sm" onClick={onClose}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
