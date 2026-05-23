import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, Equal } from "lucide-react";
import type { CompareVersionsResult } from "@/src/services/contract-templates";

interface VersionDiffViewerProps {
    result: CompareVersionsResult;
}

type DiffOp = { type: "equal" | "add" | "remove"; line: string };

/**
 * Compute a Longest Common Subsequence on lines and emit a unified-style
 * diff. O(m*n) memory — fine for template-sized bodies.
 */
function diffLines(a: string, b: string): DiffOp[] {
    const aLines = a.split("\n");
    const bLines = b.split("\n");
    const m = aLines.length;
    const n = bLines.length;

    // Build LCS table.
    const dp: number[][] = Array.from({ length: m + 1 }, () =>
        new Array(n + 1).fill(0),
    );
    for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
            if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    const ops: DiffOp[] = [];
    let i = 0;
    let j = 0;
    while (i < m && j < n) {
        if (aLines[i] === bLines[j]) {
            ops.push({ type: "equal", line: aLines[i] });
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            ops.push({ type: "remove", line: aLines[i] });
            i++;
        } else {
            ops.push({ type: "add", line: bLines[j] });
            j++;
        }
    }
    while (i < m) ops.push({ type: "remove", line: aLines[i++] });
    while (j < n) ops.push({ type: "add", line: bLines[j++] });
    return ops;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
    result,
}) => {
    const { version1, version2, diff } = result;
    const ops = useMemo(
        () => diffLines(version1.body, version2.body),
        [version1.body, version2.body],
    );

    const counts = useMemo(() => {
        let added = 0;
        let removed = 0;
        for (const o of ops) {
            if (o.type === "add") added++;
            else if (o.type === "remove") removed++;
        }
        return { added, removed };
    }, [ops]);

    return (
        <div className="space-y-4">
            <Card className="border-slate-200">
                <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <Badge
                            variant="outline"
                            className="bg-slate-50 border-slate-200 text-slate-700"
                        >
                            v{version1.versionNumber}
                            {version1.publishedAt ? " · published" : " · draft"}
                        </Badge>
                        <span className="text-slate-400">→</span>
                        <Badge
                            variant="outline"
                            className="bg-slate-50 border-slate-200 text-slate-700"
                        >
                            v{version2.versionNumber}
                            {version2.publishedAt ? " · published" : " · draft"}
                        </Badge>
                        <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                        >
                            <Plus className="w-3 h-3" /> {counts.added} lines
                        </Badge>
                        <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 gap-1"
                        >
                            <Minus className="w-3 h-3" /> {counts.removed} lines
                        </Badge>
                        {!diff.bodyChanged && (
                            <Badge
                                variant="outline"
                                className="bg-slate-50 text-slate-600 border-slate-200 gap-1"
                            >
                                <Equal className="w-3 h-3" /> body unchanged
                            </Badge>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Variable changes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {diff.addedVariables.length === 0 &&
                            diff.removedVariables.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">
                                    No variable changes
                                </span>
                            ) : (
                                <>
                                    {diff.addedVariables.map((v) => (
                                        <Badge
                                            key={`add-${v.name}`}
                                            variant="outline"
                                            className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-mono text-[10px]"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {v.name}:{v.type}
                                        </Badge>
                                    ))}
                                    {diff.removedVariables.map((v) => (
                                        <Badge
                                            key={`rem-${v.name}`}
                                            variant="outline"
                                            className="bg-red-50 text-red-700 border-red-200 gap-1 font-mono text-[10px]"
                                        >
                                            <Minus className="w-3 h-3" />
                                            {v.name}:{v.type}
                                        </Badge>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="border border-slate-200 rounded-md bg-white overflow-hidden">
                <pre className="text-xs font-mono leading-relaxed max-h-[420px] overflow-auto">
                    {ops.map((op, idx) => {
                        const sign =
                            op.type === "add"
                                ? "+"
                                : op.type === "remove"
                                  ? "-"
                                  : " ";
                        const cls =
                            op.type === "add"
                                ? "bg-emerald-50 text-emerald-900"
                                : op.type === "remove"
                                  ? "bg-red-50 text-red-900"
                                  : "text-slate-700";
                        return (
                            <div
                                key={idx}
                                className={`px-3 py-0.5 whitespace-pre-wrap break-words ${cls}`}
                            >
                                <span className="select-none mr-2 text-slate-400">
                                    {sign}
                                </span>
                                {op.line || "\u00A0"}
                            </div>
                        );
                    })}
                </pre>
            </div>
        </div>
    );
};
