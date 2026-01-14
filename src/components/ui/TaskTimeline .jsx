import { useState, useEffect, useMemo } from "react";
import { Play, Pause, Clock , Clock1} from "lucide-react";

const TaskTimeline = ({
    task,
    user,
    handleTimelineUpdate,
    showControls = true,
}) => {
    const getUserTimeline = () => {
        if (!task?.timeline) return [];
        return task.timeline;
    };

    const pastElapsed = useMemo(() => {
        return getUserTimeline()
            .filter((t) => t.endTime)
            .reduce(
                (total, t) =>
                    total + (new Date(t.endTime) - new Date(t.startTime)),
                0
            );
    }, [task, user]);

    const runningEntry = useMemo(() => {
        return getUserTimeline().find((t) => !t.endTime);
    }, [task, user]);

    const getInitialElapsed = () => {
        if (!runningEntry) return pastElapsed;
        return Date.now() - new Date(runningEntry.startTime).getTime() + pastElapsed;
    };

    const [elapsedTime, setElapsedTime] = useState(getInitialElapsed);

    useEffect(() => {
        if (!runningEntry) return;

        setElapsedTime(getInitialElapsed());

        const interval = setInterval(() => {
            setElapsedTime(Date.now() - new Date(runningEntry.startTime).getTime() + pastElapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [runningEntry, pastElapsed]);

    const hasTime = elapsedTime > 0 || !!runningEntry;
    const isRunning = !!runningEntry;

    const displayTime = () => {
        const total = isRunning ? elapsedTime : pastElapsed;

        const hours = Math.floor(total / 3600000);
        const minutes = Math.floor((total % 3600000) / 60000);
        const seconds = Math.floor((total % 60000) / 1000);

        return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`;
    };

    return (
        <div className="inline-flex gap-[10px] items-center">
            {hasTime ? (
                <span className="text-sm text-gray-600 inline-flex items-center gap-1">
                    <Clock
                        size={16}
                        className={isRunning ? "text-green-500" : "text-gray-500"}
                    />
                    {displayTime()}
                </span>
            ) : (
                <span className="flex items-center gap-1 text-sm text-gray-400"><Clock1 size={16} />--</span>
            )}

            {showControls && !isRunning && (
                <div
                    className="flex items-center gap-[5px] cursor-pointer border border-gray-200 px-3 py-1 rounded hover:bg-gray-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTimelineUpdate(task, "start");
                    }}
                >
                    <Play size={16} className="text-gray-700" />
                    <span className="text-green-500">Start</span>
                </div>
            )}

            {showControls && isRunning && (
                <div
                    className="flex items-center gap-[5px] cursor-pointer border border-gray-200 px-3 py-1 rounded hover:bg-gray-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTimelineUpdate(task, "stop");
                    }}
                >
                    <Pause size={16} className="text-green-500" />
                    <span>Stop</span>
                </div>
            )}
        </div>
    );
};

export default TaskTimeline;
