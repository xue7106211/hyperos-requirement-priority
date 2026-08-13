import { useState, useCallback } from "react";
import { Settings } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <header className="sticky top-0 z-header isolate border-b border-border/80 bg-background/85 backdrop-blur-sm">
          <motion.div
            className="mx-auto flex h-[var(--header-height)] max-w-6xl items-end justify-between gap-6 px-6 pb-3"
            initial={playIntro ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex min-w-0 items-stretch gap-3">
              <div
                className="mt-1 w-[3px] shrink-0 self-stretch bg-mark"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-latin text-[11px] italic tracking-[0.22em] text-muted-foreground">
                  HyperOS Design System
                </p>
                <h1 className="font-display text-[1.65rem] font-medium leading-none tracking-tight text-foreground">
                  需求价值评估
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-end gap-5">
              <TabsList>
                <TabsTrigger value="scoring">单条打分</TabsTrigger>
                <TabsTrigger value="list">批量清单</TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="icon"
                className="mb-0.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSettingsOpen(true)}
                aria-label="设置"
              >
                <Settings />
              </Button>
            </div>
          </motion.div>
        </header>

        <div className="mx-auto max-w-6xl px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
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
      </Tabs>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md rounded-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-medium">
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
