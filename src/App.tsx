import { useState, useCallback } from "react";
import type { Requirement, ModelConfig } from "@/domain/types";
import { loadConfig, saveConfig } from "@/store/storage";
import { ScoringPage } from "@/pages/ScoringPage";
import { ListPage } from "@/pages/ListPage";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function App() {
  /* ─── Config state (App 级) ─── */
  const [config, setConfig] = useState<ModelConfig>(loadConfig);

  /* ─── Tab 切换 ─── */
  const [activeTab, setActiveTab] = useState<string>("scoring");

  /* ─── 待复核需求 (列表点行 → 打分页) ─── */
  const [editTarget, setEditTarget] = useState<Requirement | undefined>(
    undefined
  );

  /* ─── 列表刷新计数器 (保存后自增触发 ListPage 重载) ─── */
  const [refreshKey, setRefreshKey] = useState(0);

  /* ─── 设置 Dialog ─── */
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ─── Handlers ─── */
  const handleConfigChange = useCallback((newConfig: ModelConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const handleEditRequirement = useCallback(
    (req: Requirement) => {
      setEditTarget(req);
      setActiveTab("scoring");
    },
    []
  );

  const handleSaved = useCallback(() => {
    setEditTarget(undefined);
    setRefreshKey((k) => k + 1);
    setActiveTab("list");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── 顶部导航 ─── */}
      <header className="border-b border-neutral-200 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <h1 className="text-base font-semibold tracking-tight text-neutral-900">
            HyperOS 需求价值评估
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-sm p-0 text-neutral-500 hover:text-neutral-900"
            onClick={() => setSettingsOpen(true)}
            aria-label="设置"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        </div>
      </header>

      {/* ─── 主体 Tabs ─── */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-sm">
            <TabsTrigger value="scoring" className="rounded-sm text-xs">
              单条打分
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-sm text-xs">
              批量清单
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scoring">
            <ScoringPage
              key={editTarget?.id ?? "new"}
              config={config}
              initial={editTarget}
              onSaved={handleSaved}
            />
          </TabsContent>

          <TabsContent value="list">
            <ListPage
              key={refreshKey}
              onEditRequirement={handleEditRequirement}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── 设置 Dialog ─── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              评估模型设置
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              调整维度权重与等级阈值
            </DialogDescription>
          </DialogHeader>
          <SettingsPanel config={config} onChange={handleConfigChange} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
