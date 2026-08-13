import { useState, useCallback } from "react";
import { List, PenLine, Settings } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { Requirement, ModelConfig } from "@/domain/types";
import { loadConfig, saveConfig } from "@/store/storage";
import { useSessionIntro } from "@/hooks/useSessionIntro";
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
  const skipIntro = useSessionIntro();
  const reduceMotion = useReducedMotion();
  const [config, setConfig] = useState<ModelConfig>(loadConfig);
  const [activeTab, setActiveTab] = useState<string>("scoring");
  const [editTarget, setEditTarget] = useState<Requirement | undefined>(
    undefined
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const playIntro = !skipIntro && !reduceMotion;

  const handleConfigChange = useCallback((newConfig: ModelConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const handleEditRequirement = useCallback((req: Requirement) => {
    setEditTarget(req);
    setActiveTab("scoring");
  }, []);

  const handleCreateNew = useCallback(() => {
    setEditTarget(undefined);
    setActiveTab("scoring");
  }, []);

  const handleSaved = useCallback(() => {
    setEditTarget(undefined);
    setRefreshKey((k) => k + 1);
    setActiveTab("list");
  }, []);

  return (
    <div className="min-h-dvh bg-background px-3 py-3 md:px-5 md:py-5">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-6xl flex-col gap-3 md:min-h-[calc(100dvh-2.5rem)] md:flex-row md:gap-4"
      >
        <motion.nav
          aria-label="主导航"
          className="flex shrink-0 flex-col gap-3 md:sticky md:top-5 md:h-[calc(100dvh-2.5rem)] md:w-52 md:py-2"
          initial={playIntro ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="flex min-w-0 items-start gap-2.5 px-1">
            <span
              className="mt-1.5 size-2.5 shrink-0 rounded-full bg-mark"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground">
                HyperOS Design System
              </p>
              <h1 className="text-[1.05rem] font-medium leading-snug tracking-tight text-foreground text-balance">
                系统组件需求价值评估
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 md:min-h-0 md:flex-1 md:flex-col md:items-stretch">
            <TabsList className="h-auto min-h-0 flex-1 flex-row gap-1 rounded-2xl bg-transparent p-0 shadow-none md:mt-5 md:w-full md:flex-none md:flex-col">
              <TabsTrigger
                value="scoring"
                className="h-10 flex-1 gap-2 rounded-xl px-3 data-[state=active]:bg-card md:flex-none md:w-full md:justify-start"
              >
                <PenLine className="size-4 shrink-0" aria-hidden="true" />
                单条打分
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="h-10 flex-1 gap-2 rounded-xl px-3 data-[state=active]:bg-card md:flex-none md:w-full md:justify-start"
              >
                <List className="size-4 shrink-0" aria-hidden="true" />
                批量清单
              </TabsTrigger>
            </TabsList>

            <Button
              variant="ghost"
              size="icon"
              className="bg-card text-muted-foreground shadow-raised hover:text-foreground md:mt-auto"
              onClick={() => setSettingsOpen(true)}
              aria-label="设置"
            >
              <Settings />
            </Button>
          </div>
        </motion.nav>

        <div className="min-w-0 flex-1 rounded-shell bg-card shadow-raised">
          <div className="px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-7 md:py-8">
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
                onCreateNew={handleCreateNew}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">
              评估模型设置
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
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
