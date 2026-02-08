
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SystemPhase, UserConfig, SystemLogEntry, ContentSet, DailyAsset } from './types';
import { GeminiService } from './services/geminiService';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import SystemLog from './components/SystemLog';

const App: React.FC = () => {
  const [phase, setPhase] = useState<SystemPhase>(SystemPhase.ONBOARDING);
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [blueprint, setBlueprint] = useState<string>('');
  const [dailyAsset, setDailyAsset] = useState<DailyAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const geminiRef = useRef<GeminiService | null>(null);

  useEffect(() => {
    geminiRef.current = new GeminiService();
    addLog('System initialized. Nexus Content Engine ready.', 'success');
  }, []);

  const addLog = (message: string, type: SystemLogEntry['type'] = 'info') => {
    setLogs(prev => [{ timestamp: Date.now(), message, type }, ...prev].slice(0, 50));
  };

  const handleOnboardingComplete = (config: UserConfig) => {
    setUserConfig(config);
    setPhase(SystemPhase.READY);
    addLog('Onboarding sequence complete. Training data ingested.', 'success');
  };

  const runDailyCycle = async () => {
    if (!userConfig || !geminiRef.current) return;

    setIsProcessing(true);
    setPhase(SystemPhase.PROCESSING);
    addLog('PHASE 3: Initiating internet surfing & creator intelligence...', 'info');

    try {
      // Step 1: Research
      const resBlueprint = await geminiRef.current.performNicheResearch(userConfig);
      setBlueprint(resBlueprint);
      addLog('PHASE 4: Blueprint generated. Hook patterns extracted.', 'success');

      // Step 2: Generation
      addLog('PHASE 5: Firing content generation engine...', 'info');
      const sets = await geminiRef.current.generateContentSets(userConfig, resBlueprint);
      
      if (sets.length === 0) {
        throw new Error("Failed to generate content sets.");
      }
      
      addLog(`PHASE 6: 10 content sets generated. Scoring performance...`, 'info');

      // Step 3: Selection
      const sorted = [...sets].sort((a, b) => b.score - a.score);
      const selected = sorted[0];
      addLog(`PHASE 7: Logic-based selection complete. Winner: "${selected.topic}" (Score: ${selected.score})`, 'success');

      // Step 4: Insights
      const insights = await geminiRef.current.getPerformanceInsights(selected);
      
      setDailyAsset({
        date: new Date().toLocaleDateString(),
        selectedContent: selected,
        insights
      });

      addLog('PHASE 8: Logging selection to memory database. Preventing future repetition.', 'info');
      setPhase(SystemPhase.COMPLETED);
    } catch (error) {
      addLog('CRITICAL SYSTEM ALERT: Cycle failed. ' + (error as Error).message, 'error');
      setPhase(SystemPhase.READY);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">NEXUS <span className="text-indigo-400">OS</span></h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            <span className="text-slate-400">{isProcessing ? 'PROCESSING' : 'IDLE'}</span>
          </div>
          <div className="mono text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-indigo-300">
            V 3.4.1_ALPHA
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {phase === SystemPhase.ONBOARDING && (
            <Onboarding onComplete={handleOnboardingComplete} />
          )}

          {(phase === SystemPhase.READY || phase === SystemPhase.PROCESSING || phase === SystemPhase.COMPLETED) && (
            <Dashboard 
              config={userConfig!} 
              dailyAsset={dailyAsset} 
              isProcessing={isProcessing}
              onRunCycle={runDailyCycle}
            />
          )}
        </div>

        {/* Sidebar Log */}
        <div className="w-96 border-l border-slate-800 bg-slate-900/30 flex flex-col">
          <SystemLog logs={logs} />
        </div>
      </main>
    </div>
  );
};

export default App;
