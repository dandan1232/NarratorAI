import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList } from 'lucide-react';

interface TaskToastProps {
  task: { name: string; reward: number } | null;
  onDismiss: () => void;
}

export function TaskToast({ task, onDismiss }: TaskToastProps) {
  return (
    <AnimatePresence>
      {task && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          onClick={onDismiss}
        >
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">任务完成！</div>
              <div className="text-sm opacity-90">{task.name}</div>
            </div>
            <div className="ml-2 text-sm font-bold opacity-80">
              +{task.reward}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
