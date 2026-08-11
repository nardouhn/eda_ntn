(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiGet",
    ()=>apiGet
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
async function apiGet(path, params = {}) {
    const isAbsolute = API_BASE.startsWith("http");
    const baseUrl = isAbsolute ? API_BASE : ("TURBOPACK compile-time truthy", 1) ? window.location.origin + API_BASE : "TURBOPACK unreachable";
    const url = new URL(`${baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)){
        if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    const response = await fetch(url, {
        cache: "no-store",
        headers: {
            "ngrok-skip-browser-warning": "69420"
        }
    });
    if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `API error ${response.status}`);
    }
    return response.json();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/format.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatMonth",
    ()=>formatMonth,
    "formatNumber",
    ()=>formatNumber,
    "formatPercent",
    ()=>formatPercent
]);
function formatNumber(value, digits = 0) {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: digits
    }).format(value);
}
function formatMonth(value) {
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return new Intl.DateTimeFormat("vi-VN", {
        month: "2-digit",
        year: "numeric"
    }).format(date);
}
function formatPercent(value) {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "percent",
        maximumFractionDigits: 1
    }).format(value);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/charts.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HorizontalBars",
    ()=>HorizontalBars,
    "LineChart",
    ()=>LineChart,
    "Sparkline",
    ()=>Sparkline
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
"use client";
;
;
function Sparkline({ values, width = 132, height = 38 }) {
    const present = values.filter((value)=>value !== null);
    if (!present.length) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "muted",
        children: "Không có dữ liệu"
    }, void 0, false, {
        fileName: "[project]/src/components/charts.tsx",
        lineNumber: 7,
        columnNumber: 31
    }, this);
    const max = Math.max(...present, 1);
    const min = Math.min(...present, 0);
    const span = Math.max(max - min, 1);
    const points = values.map((value, index)=>{
        if (value === null) return null;
        const x = values.length === 1 ? width / 2 : index / (values.length - 1) * width;
        const y = height - 4 - (value - min) / span * (height - 8);
        return `${x},${y}`;
    }).filter(Boolean).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "sparkline",
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": "Xu hướng 12 tháng",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
            points: points,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.4",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/src/components/charts.tsx",
            lineNumber: 22,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/charts.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_c = Sparkline;
function LineChart({ series, height = 220 }) {
    const width = 900;
    const max = Math.max(...series.map((item)=>item.value), 1);
    const points = series.map((item, index)=>`${index / Math.max(series.length - 1, 1) * width},${height - 24 - item.value / max * (height - 48)}`).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "chart-wrap",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: `0 0 ${width} ${height}`,
                role: "img",
                "aria-label": "Biểu đồ xu hướng",
                children: [
                    [
                        0.25,
                        0.5,
                        0.75
                    ].map((ratio)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: "0",
                            x2: width,
                            y1: height * ratio,
                            y2: height * ratio,
                            className: "grid-line"
                        }, ratio, false, {
                            fileName: "[project]/src/components/charts.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: points,
                        fill: "none",
                        className: "chart-line",
                        strokeWidth: "3",
                        strokeLinejoin: "round"
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "chart-axis",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: series[0]?.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 47,
                        columnNumber: 35
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(max),
                            " M2"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 47,
                        columnNumber: 66
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: series.at(-1)?.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 47,
                        columnNumber: 105
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/charts.tsx",
                lineNumber: 47,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/charts.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
_c1 = LineChart;
function HorizontalBars({ data }) {
    const max = Math.max(...data.map((item)=>item.value), 1);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bars",
        children: data.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bar-row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        title: item.label,
                        children: item.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 58,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bar-track",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bar-fill",
                            style: {
                                width: `${item.value / max * 100}%`
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/components/charts.tsx",
                            lineNumber: 59,
                            columnNumber: 38
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 59,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(item.value)
                    }, void 0, false, {
                        fileName: "[project]/src/components/charts.tsx",
                        lineNumber: 60,
                        columnNumber: 11
                    }, this)
                ]
            }, item.label, true, {
                fileName: "[project]/src/components/charts.tsx",
                lineNumber: 57,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/charts.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c2 = HorizontalBars;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "Sparkline");
__turbopack_context__.k.register(_c1, "LineChart");
__turbopack_context__.k.register(_c2, "HorizontalBars");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/items/items-module.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ItemsModule",
    ()=>ItemsModule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function ItemsModule({ branches, branchCode, onBranchChange }) {
    _s();
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const deferredQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDeferredValue"])(query);
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [variants, setVariants] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ItemsModule.useEffect": ()=>{
            let cancelled = false;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/items", {
                q: deferredQuery,
                branch_code: branchCode,
                status,
                page_size: 50
            }).then({
                "ItemsModule.useEffect": (response)=>{
                    if (!cancelled) {
                        setData(response);
                        setError(null);
                    }
                }
            }["ItemsModule.useEffect"]).catch({
                "ItemsModule.useEffect": (reason)=>{
                    if (!cancelled) setError(reason.message);
                }
            }["ItemsModule.useEffect"]).finally({
                "ItemsModule.useEffect": ()=>{
                    if (!cancelled) setLoading(false);
                }
            }["ItemsModule.useEffect"]);
            return ({
                "ItemsModule.useEffect": ()=>{
                    cancelled = true;
                }
            })["ItemsModule.useEffect"];
        }
    }["ItemsModule.useEffect"], [
        branchCode,
        deferredQuery,
        status
    ]);
    function openVariants(item) {
        setSelected(item);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])(`/items/${encodeURIComponent(item.base_sku)}/variants?branch_code=${encodeURIComponent(item.branch_code)}`).then((response)=>setVariants(response.items)).catch((reason)=>setError(reason.message));
    }
    const months = data?.items[0]?.trend.map((point)=>point.month) ?? [];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "module",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "module-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "eyebrow",
                                children: "MODULE 01"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 61,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Danh mục và lịch sử SKU"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "result-count",
                        children: [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.total ?? 0),
                            " dòng phù hợp"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/items/items-module.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "filters",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        value: query,
                        onChange: (event)=>{
                            setLoading(true);
                            setQuery(event.target.value);
                        },
                        placeholder: "Tìm SKU hoặc tên sản phẩm...",
                        "aria-label": "Tìm SKU"
                    }, void 0, false, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: branchCode,
                        onChange: (event)=>{
                            setLoading(true);
                            onBranchChange(event.target.value);
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "__ALL__",
                                children: "Tất cả chi nhánh"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 75,
                                columnNumber: 11
                            }, this),
                            branches.map((branch)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    value: branch.branch_code,
                                    children: [
                                        branch.branch_code,
                                        " · ",
                                        branch.branch_name
                                    ]
                                }, branch.branch_code, true, {
                                    fileName: "[project]/src/features/items/items-module.tsx",
                                    lineNumber: 77,
                                    columnNumber: 13
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: status,
                        onChange: (event)=>{
                            setLoading(true);
                            setStatus(event.target.value);
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "all",
                                children: "Tất cả trạng thái"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 83,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "active",
                                children: "Đang hoạt động"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 84,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: "inactive",
                                children: "Vô hiệu hóa"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 82,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "secondary",
                        onClick: ()=>{
                            setLoading(true);
                            setQuery("");
                            setStatus("all");
                            onBranchChange("__ALL__");
                        },
                        children: "Đặt lại"
                    }, void 0, false, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/items/items-module.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "error-banner",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/features/items/items-module.tsx",
                lineNumber: 92,
                columnNumber: 16
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "table-card",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "table-scroll",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "data-table sku-table",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("colgroup", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                        className: "sku-column"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 98,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                        className: "branch-column"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 99,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                        className: "variant-count-column"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 100,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                        className: "trend-column"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 101,
                                        columnNumber: 15
                                    }, this),
                                    months.map((month)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("col", {
                                            className: "month-column"
                                        }, month, false, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 102,
                                            columnNumber: 38
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 97,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "Mã SKU · Tên sản phẩm"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 106,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "Mã Chi nhánh"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 107,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: [
                                                "Số biến thể",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: "Hoạt động / Tổng"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/items/items-module.tsx",
                                                    lineNumber: 108,
                                                    columnNumber: 32
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 108,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            children: "Xu hướng TT 12 tháng"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 109,
                                            columnNumber: 17
                                        }, this),
                                        months.map((month)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                children: [
                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(month),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: "Sản lượng"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/items/items-module.tsx",
                                                        lineNumber: 113,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, month, true, {
                                                fileName: "[project]/src/features/items/items-module.tsx",
                                                lineNumber: 111,
                                                columnNumber: 19
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/items/items-module.tsx",
                                    lineNumber: 105,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 104,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: [
                                    loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            colSpan: 4 + months.length,
                                            className: "empty",
                                            children: "Đang tải dữ liệu từ Supabase…"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 120,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 120,
                                        columnNumber: 17
                                    }, this) : null,
                                    !loading && !data?.items.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            colSpan: 4 + months.length,
                                            className: "empty",
                                            children: "Không có SKU theo bộ lọc hiện tại."
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 123,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 123,
                                        columnNumber: 17
                                    }, this) : null,
                                    !loading && data?.items.map((item)=>{
                                        const isSelected = selected?.base_sku === item.base_sku && selected?.branch_code === item.branch_code;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            onClick: ()=>openVariants(item),
                                            className: `${isSelected ? "selected " : ""}${item.status === "Hoạt động" ? "sku-active" : "sku-inactive"}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "item-cell",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            className: item.status === "Vô hiệu hóa" ? "inactive-name" : "",
                                                            children: item.base_sku
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/items/items-module.tsx",
                                                            lineNumber: 135,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: item.status === "Vô hiệu hóa" ? "inactive-name" : "",
                                                            children: item.sku_name ?? "Chưa có tên"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/items/items-module.tsx",
                                                            lineNumber: 138,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/items/items-module.tsx",
                                                    lineNumber: 134,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "branch-cell",
                                                    children: item.branch_code ?? "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/items/items-module.tsx",
                                                    lineNumber: 142,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "variant-count-cell",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        className: "variant-ratio",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: item.active_variant_count
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/items/items-module.tsx",
                                                                lineNumber: 145,
                                                                columnNumber: 25
                                                            }, this),
                                                            "/",
                                                            item.variant_count
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/items/items-module.tsx",
                                                        lineNumber: 144,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/items/items-module.tsx",
                                                    lineNumber: 143,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Sparkline"], {
                                                        values: item.trend.map((point)=>point.value)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/items/items-module.tsx",
                                                        lineNumber: 149,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/items/items-module.tsx",
                                                    lineNumber: 148,
                                                    columnNumber: 21
                                                }, this),
                                                item.trend.map((point)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "number-cell",
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(point.value)
                                                    }, point.month, false, {
                                                        fileName: "[project]/src/features/items/items-module.tsx",
                                                        lineNumber: 152,
                                                        columnNumber: 23
                                                    }, this))
                                            ]
                                        }, `${item.base_sku}-${item.branch_code}`, true, {
                                            fileName: "[project]/src/features/items/items-module.tsx",
                                            lineNumber: 129,
                                            columnNumber: 19
                                        }, this);
                                    })
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 96,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/features/items/items-module.tsx",
                    lineNumber: 95,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/items/items-module.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            selected ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "detail-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "detail-title",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "eyebrow",
                                        children: [
                                            "SKU ĐANG CHỌN TẠI ",
                                            selected.branch_code
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 168,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: selected.base_sku
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 169,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: selected.sku_name ?? "Chưa có tên"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 170,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 167,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "icon-button",
                                onClick: ()=>setSelected(null),
                                children: "Đóng"
                            }, void 0, false, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "variant-grid",
                        children: variants.map((variant)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                className: "variant-card",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `status-dot ${variant.status === "Hoạt động" ? "active" : "inactive"}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 177,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: variant.bravo_sku
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/items/items-module.tsx",
                                                lineNumber: 179,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: variant.sku_name ?? "Mã Bravo SKU"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/items/items-module.tsx",
                                                lineNumber: 180,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                children: [
                                                    "Bán dương cuối: ",
                                                    variant.last_positive_sale_month ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(variant.last_positive_sale_month) : "—"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/items/items-module.tsx",
                                                lineNumber: 181,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 178,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `status-text ${variant.status === "Hoạt động" ? "active" : "inactive"}`,
                                        children: variant.status
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/items/items-module.tsx",
                                        lineNumber: 185,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, variant.bravo_sku, true, {
                                fileName: "[project]/src/features/items/items-module.tsx",
                                lineNumber: 176,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/features/items/items-module.tsx",
                        lineNumber: 174,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/items/items-module.tsx",
                lineNumber: 165,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/items/items-module.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
_s(ItemsModule, "//b8v+cPqhYnG977/fEG3GtgIhw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useDeferredValue"]
    ];
});
_c = ItemsModule;
var _c;
__turbopack_context__.k.register(_c, "ItemsModule");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/crosstab-history-pattern.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CrosstabHistoryPattern",
    ()=>CrosstabHistoryPattern
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const COLORS = {
    Smooth: "#10b981",
    Erratic: "#f59e0b",
    Intermittent: "#6366f1",
    Lumpy: "#ef4444",
    "Insufficient/Cold-start": "#4b5563"
};
function CrosstabHistoryPattern({ branchCode }) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CrosstabHistoryPattern.useEffect": ()=>{
            setLoading(true);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/crosstab-history-pattern", {
                branch_code: branchCode === "__ALL__" ? undefined : branchCode
            }).then({
                "CrosstabHistoryPattern.useEffect": (res)=>{
                    setData(res);
                    setError(null);
                }
            }["CrosstabHistoryPattern.useEffect"]).catch({
                "CrosstabHistoryPattern.useEffect": (err)=>setError(err.message)
            }["CrosstabHistoryPattern.useEffect"]).finally({
                "CrosstabHistoryPattern.useEffect": ()=>setLoading(false)
            }["CrosstabHistoryPattern.useEffect"]);
        }
    }["CrosstabHistoryPattern.useEffect"], [
        branchCode
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                    lineNumber: 43,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm",
                    children: "Đang tải dữ liệu biểu đồ..."
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                    lineNumber: 44,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
            lineNumber: 42,
            columnNumber: 12
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex items-center justify-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/20",
            children: [
                "Lỗi tải dữ liệu: ",
                error
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
            lineNumber: 49,
            columnNumber: 12
        }, this);
    }
    if (!data || data.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex items-center justify-center text-gray-500 text-sm italic",
            children: "Không có dữ liệu"
        }, void 0, false, {
            fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
            lineNumber: 53,
            columnNumber: 12
        }, this);
    }
    // Sort patterns logically
    const order = [
        "Full-history",
        "Short-history",
        "Cold-start"
    ];
    const sortedData = [
        ...data
    ].sort((a, b)=>{
        return order.indexOf(a.history_pattern) - order.indexOf(b.history_pattern);
    });
    const categories = [
        "Smooth",
        "Erratic",
        "Intermittent",
        "Lumpy",
        "Insufficient/Cold-start"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-5 w-full mt-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4",
                children: sortedData.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-28 text-sm font-medium text-gray-400 whitespace-nowrap",
                                children: row.history_pattern
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 h-10 flex rounded-md overflow-hidden bg-gray-800 shadow-inner",
                                children: categories.map((cat)=>{
                                    const val = row[cat];
                                    if (!val || val === 0) return null;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            width: `${val}%`,
                                            backgroundColor: COLORS[cat]
                                        },
                                        className: "h-full group relative cursor-help transition-all hover:brightness-110 border-r border-gray-900/50 last:border-r-0",
                                        children: [
                                            val > 5 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white/95 drop-shadow-md mix-blend-overlay",
                                                children: [
                                                    val,
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                                lineNumber: 84,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 w-max opacity-0 transition-opacity group-hover:opacity-100",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-900 text-gray-100 text-xs rounded py-1.5 px-3 shadow-xl border border-gray-700",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-semibold block mb-0.5",
                                                                children: cat
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                                                lineNumber: 91,
                                                                columnNumber: 25
                                                            }, this),
                                                            "Tỷ lệ: ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-mono text-emerald-400",
                                                                children: [
                                                                    val,
                                                                    "%"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                                                lineNumber: 92,
                                                                columnNumber: 32
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                                        lineNumber: 90,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-gray-900"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                                        lineNumber: 95,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                                lineNumber: 89,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, cat, true, {
                                        fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                        lineNumber: 77,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                lineNumber: 72,
                                columnNumber: 13
                            }, this)
                        ]
                    }, row.history_pattern, true, {
                        fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                        lineNumber: 68,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-2 py-2 border-t border-gray-800/50",
                children: categories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-3 h-3 rounded-sm shadow-sm",
                                style: {
                                    backgroundColor: COLORS[cat]
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                lineNumber: 109,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[11px] font-medium text-gray-400 uppercase tracking-wider",
                                children: cat
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this)
                        ]
                    }, cat, true, {
                        fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                lineNumber: 106,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1 bg-indigo-500/5 border border-indigo-500/10 rounded-md p-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[13px] text-gray-400 leading-relaxed",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            className: "text-indigo-400 font-semibold mr-1",
                            children: "Insight Note:"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                            lineNumber: 118,
                            columnNumber: 11
                        }, this),
                        "Phân tích chéo này giúp đánh giá rủi ro của dữ liệu lịch sử. Các SKU thuộc nhóm ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "Cold-start"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                            lineNumber: 119,
                            columnNumber: 91
                        }, this),
                        " hoặc ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: "Short-history"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                            lineNumber: 119,
                            columnNumber: 124
                        }, this),
                        " thường có tính bất ổn cao (Lumpy/Erratic) và cần phương pháp dự báo chuyên biệt hoặc bù trừ rủi ro thay vì dựa hoàn toàn vào chuỗi thời gian tiêu chuẩn."
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                    lineNumber: 117,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/crosstab-history-pattern.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
_s(CrosstabHistoryPattern, "RiL7vLwmC7ZWXKL/bXt2EIBjBYk=");
_c = CrosstabHistoryPattern;
var _c;
__turbopack_context__.k.register(_c, "CrosstabHistoryPattern");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/pattern-timeline-sample.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PatternTimelineSample",
    ()=>PatternTimelineSample
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const COLORS = {
    Smooth: "bg-emerald-500",
    Erratic: "bg-amber-500",
    Intermittent: "bg-indigo-500",
    Lumpy: "bg-red-500",
    "Insufficient/Cold-start": "bg-gray-500"
};
function PatternTimelineSample({ branchCode }) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [patternFilter, setPatternFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ALL");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PatternTimelineSample.useEffect": ()=>{
            setLoading(true);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/timeline-sample", {
                branch_code: branchCode === "__ALL__" ? undefined : branchCode
            }).then({
                "PatternTimelineSample.useEffect": (res)=>{
                    setData(res);
                    setError(null);
                }
            }["PatternTimelineSample.useEffect"]).catch({
                "PatternTimelineSample.useEffect": (err)=>setError(err.message)
            }["PatternTimelineSample.useEffect"]).finally({
                "PatternTimelineSample.useEffect": ()=>setLoading(false)
            }["PatternTimelineSample.useEffect"]);
        }
    }["PatternTimelineSample.useEffect"], [
        branchCode
    ]);
    const allMonthsYYYYMM = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PatternTimelineSample.useMemo[allMonthsYYYYMM]": ()=>{
            if (!data) return [];
            const months = new Set();
            data.forEach({
                "PatternTimelineSample.useMemo[allMonthsYYYYMM]": (sku)=>{
                    sku.timeline.forEach({
                        "PatternTimelineSample.useMemo[allMonthsYYYYMM]": (t)=>months.add(t.month.slice(0, 7))
                    }["PatternTimelineSample.useMemo[allMonthsYYYYMM]"]); // Extact "YYYY-MM"
                }
            }["PatternTimelineSample.useMemo[allMonthsYYYYMM]"]);
            const sorted = Array.from(months).sort();
            if (sorted.length === 0) return [];
            // Generate contiguous months to ensure visually correct timeline
            const [startYear, startMonth] = sorted[0].split('-').map(Number);
            const [endYear, endMonth] = sorted[sorted.length - 1].split('-').map(Number);
            const result = [];
            let y = startYear;
            let m = startMonth;
            while(y < endYear || y === endYear && m <= endMonth){
                result.push(`${y}-${String(m).padStart(2, '0')}`);
                m++;
                if (m > 12) {
                    m = 1;
                    y++;
                }
            }
            return result;
        }
    }["PatternTimelineSample.useMemo[allMonthsYYYYMM]"], [
        data
    ]);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-64 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-8 h-8 border-4 border-gray-700 border-t-indigo-500 rounded-full animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                    lineNumber: 76,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm",
                    children: "Đang tải biểu đồ Timeline..."
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                    lineNumber: 77,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
            lineNumber: 75,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex items-center justify-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/20",
            children: [
                "Lỗi tải dữ liệu: ",
                error
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
            lineNumber: 83,
            columnNumber: 12
        }, this);
    }
    if (!data || data.length === 0 || allMonthsYYYYMM.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex items-center justify-center text-gray-500 text-sm italic",
            children: "Không có dữ liệu mẫu"
        }, void 0, false, {
            fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
            lineNumber: 87,
            columnNumber: 12
        }, this);
    }
    const filteredData = patternFilter === "ALL" ? data : data.filter((d)=>d.demand_pattern === patternFilter);
    // Sort by pattern and then by total active months for neat waterfall look
    const order = [
        "Smooth",
        "Erratic",
        "Intermittent",
        "Lumpy",
        "Insufficient/Cold-start"
    ];
    filteredData.sort((a, b)=>{
        const pDiff = order.indexOf(a.demand_pattern) - order.indexOf(b.demand_pattern);
        if (pDiff !== 0) return pDiff;
        const aActive = a.timeline.filter((t)=>t.gross_positive_qty > 0).length;
        const bActive = b.timeline.filter((t)=>t.gross_positive_qty > 0).length;
        return bActive - aActive;
    });
    const skuRenderData = filteredData.map((sku)=>{
        const activeMap = new Map();
        sku.timeline.forEach((t)=>{
            if (t.gross_positive_qty > 0) {
                activeMap.set(t.month.slice(0, 7), t.gross_positive_qty);
            }
        });
        return {
            ...sku,
            activeMap
        };
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4 mt-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: "text-[13px] font-semibold text-gray-400",
                        children: "Dot-matrix Timeline (Tối đa 10 SKU đại diện/nhóm)"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "hidden md:flex items-center gap-3 mr-4",
                                children: order.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-1.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-2.5 h-2.5 rounded-sm ${COLORS[cat]}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 124,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[10px] uppercase text-gray-500 tracking-wide",
                                                children: cat
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 125,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, cat, true, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 123,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                className: "text-xs bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 outline-none text-gray-200 shadow-sm focus:border-indigo-500 transition-colors cursor-pointer",
                                value: patternFilter,
                                onChange: (e)=>setPatternFilter(e.target.value),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "ALL",
                                        children: "Tất cả Demand Pattern"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 135,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Smooth",
                                        children: "Chỉ Smooth"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 136,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Erratic",
                                        children: "Chỉ Erratic"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 137,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Intermittent",
                                        children: "Chỉ Intermittent"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 138,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Lumpy",
                                        children: "Chỉ Lumpy"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 139,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "Insufficient/Cold-start",
                                        children: "Chỉ Cold-start"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 140,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto pb-4 custom-scrollbar",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-w-max flex flex-col gap-1.5 bg-gray-900/20 p-4 rounded-lg border border-gray-800/60",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-end gap-1 mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-56 shrink-0"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                    lineNumber: 150,
                                    columnNumber: 13
                                }, this),
                                " ",
                                allMonthsYYYYMM.map((m, i)=>{
                                    const isJan = m.endsWith("-01");
                                    const isFirstOrLast = i === 0 || i === allMonthsYYYYMM.length - 1;
                                    const showLabel = isJan || isFirstOrLast;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-4 shrink-0 flex flex-col items-center justify-end h-8 relative group",
                                        children: [
                                            showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[10px] text-gray-500 absolute -top-5 whitespace-nowrap -rotate-45 origin-bottom-left font-mono",
                                                children: isJan ? m.split('-')[0] : m
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 158,
                                                columnNumber: 21
                                            }, this),
                                            !showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[9px] text-gray-400 absolute -top-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none",
                                                children: m
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 164,
                                                columnNumber: 22
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-px mt-auto ${isJan ? 'h-3 bg-gray-600' : 'h-1.5 bg-gray-800'}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 168,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 156,
                                        columnNumber: 17
                                    }, this);
                                })
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                            lineNumber: 149,
                            columnNumber: 11
                        }, this),
                        skuRenderData.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "py-8 text-center text-sm text-gray-500",
                            children: "Không có mã nào phù hợp với bộ lọc."
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                            lineNumber: 176,
                            columnNumber: 13
                        }, this) : skuRenderData.map((sku)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1 group",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-56 shrink-0 text-xs text-gray-400 truncate flex items-center gap-2 pr-2",
                                        title: `${sku.base_sku} - ${sku.branch_code}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-gray-300 w-28 truncate",
                                                children: sku.base_sku
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 181,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 w-16 text-center truncate",
                                                children: sku.branch_code
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                                lineNumber: 182,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                        lineNumber: 180,
                                        columnNumber: 17
                                    }, this),
                                    allMonthsYYYYMM.map((m)=>{
                                        const qty = sku.activeMap.get(m);
                                        const isActive = qty !== undefined;
                                        const colorClass = isActive ? COLORS[sku.demand_pattern] : "bg-gray-800/30";
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `w-4 h-3 shrink-0 rounded-[2px] transition-colors ${colorClass} hover:ring-1 hover:ring-white/80 cursor-crosshair`,
                                            title: isActive ? `Tháng: ${m}\nSản lượng: ${qty}\nNhóm: ${sku.demand_pattern}` : `Tháng: ${m}\nKhông có phát sinh`
                                        }, m, false, {
                                            fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                            lineNumber: 190,
                                            columnNumber: 21
                                        }, this);
                                    })
                                ]
                            }, `${sku.base_sku}-${sku.branch_code}`, true, {
                                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                                lineNumber: 179,
                                columnNumber: 15
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                    lineNumber: 146,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/pattern-timeline-sample.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
_s(PatternTimelineSample, "NKqObJT4oZacBmhnuCjKsboTMpE=");
_c = PatternTimelineSample;
var _c;
__turbopack_context__.k.register(_c, "PatternTimelineSample");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/branch-coverage-heatmap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BranchCoverageHeatmap",
    ()=>BranchCoverageHeatmap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function BranchCoverageHeatmap() {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BranchCoverageHeatmap.useEffect": ()=>{
            setLoading(true);
            // API không cần branch_code filter vì heatmap thể hiện TẤT CẢ các chi nhánh trên trục Y
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/branch-coverage").then({
                "BranchCoverageHeatmap.useEffect": (res)=>{
                    setData(res);
                    setError(null);
                }
            }["BranchCoverageHeatmap.useEffect"]).catch({
                "BranchCoverageHeatmap.useEffect": (err)=>setError(err.message)
            }["BranchCoverageHeatmap.useEffect"]).finally({
                "BranchCoverageHeatmap.useEffect": ()=>setLoading(false)
            }["BranchCoverageHeatmap.useEffect"]);
        }
    }["BranchCoverageHeatmap.useEffect"], []);
    const { months, branches, matrix } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "BranchCoverageHeatmap.useMemo": ()=>{
            if (!data) return {
                months: [],
                branches: [],
                matrix: new Map()
            };
            const mSet = new Set();
            const bSet = new Set();
            const mat = new Map();
            data.forEach({
                "BranchCoverageHeatmap.useMemo": (row)=>{
                    const mStr = row.month.slice(0, 7); // Format "YYYY-MM"
                    mSet.add(mStr);
                    bSet.add(row.branch_code);
                    mat.set(`${row.branch_code}_${mStr}`, row);
                }
            }["BranchCoverageHeatmap.useMemo"]);
            const sortedMonths = Array.from(mSet).sort();
            // Fill gaps in months to ensure a continuous X axis
            let continuousMonths = [];
            if (sortedMonths.length > 0) {
                const [startYear, startMonth] = sortedMonths[0].split('-').map(Number);
                const [endYear, endMonth] = sortedMonths[sortedMonths.length - 1].split('-').map(Number);
                let y = startYear;
                let m = startMonth;
                while(y < endYear || y === endYear && m <= endMonth){
                    continuousMonths.push(`${y}-${String(m).padStart(2, '0')}`);
                    m++;
                    if (m > 12) {
                        m = 1;
                        y++;
                    }
                }
            }
            return {
                months: continuousMonths,
                branches: Array.from(bSet).sort(),
                matrix: mat
            };
        }
    }["BranchCoverageHeatmap.useMemo"], [
        data
    ]);
    // Color generator for heatmap cells (Emerald palette)
    const getBackgroundColor = (pct)=>{
        if (pct === 0) return "rgba(31, 41, 55, 1)"; // gray-800 for 0%
        // To ensure visibility even at low percentages, base opacity is 0.15 + scaling
        const opacity = 0.15 + pct / 100 * 0.85;
        return `rgba(16, 185, 129, ${opacity})`;
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-64 flex flex-col items-center justify-center text-gray-500 animate-pulse gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-8 h-8 border-4 border-gray-700 border-t-emerald-500 rounded-full animate-spin"
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                    lineNumber: 83,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm",
                    children: "Đang tính toán ma trận bao phủ (Coverage Heatmap)..."
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                    lineNumber: 84,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
            lineNumber: 82,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex items-center justify-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/20",
            children: [
                "Lỗi tải dữ liệu: ",
                error
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
            lineNumber: 90,
            columnNumber: 12
        }, this);
    }
    if (!data || data.length === 0 || months.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-48 flex items-center justify-center text-gray-500 text-sm italic",
            children: "Không có dữ liệu Coverage"
        }, void 0, false, {
            fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
            lineNumber: 94,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-4 mt-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                        className: "text-[13px] font-semibold text-gray-400",
                        children: "Tỷ lệ SKU Active theo Chi nhánh & Thời gian"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "hidden sm:flex items-center gap-1 text-[10px] text-gray-500",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "0%"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                lineNumber: 104,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex h-2.5 w-24 mx-2 rounded-sm overflow-hidden border border-gray-800",
                                children: [
                                    0,
                                    20,
                                    40,
                                    60,
                                    80,
                                    100
                                ].map((pct)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 h-full",
                                        style: {
                                            backgroundColor: getBackgroundColor(pct)
                                        }
                                    }, pct, false, {
                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                        lineNumber: 107,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                lineNumber: 105,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "100%"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                lineNumber: 110,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                lineNumber: 99,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto pb-4 custom-scrollbar",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-w-max flex flex-col gap-1 bg-gray-900/20 p-5 rounded-lg border border-gray-800/60",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-end gap-1 mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-24 shrink-0 text-[11px] font-semibold text-gray-500 pb-1 uppercase tracking-wider",
                                    children: "Chi nhánh"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                    lineNumber: 119,
                                    columnNumber: 13
                                }, this),
                                months.map((m, i)=>{
                                    const isJan = m.endsWith("-01");
                                    const isFirstOrLast = i === 0 || i === months.length - 1;
                                    const showLabel = isJan || isFirstOrLast;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 shrink-0 flex flex-col items-center justify-end h-8 relative group",
                                        children: [
                                            showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[10px] text-gray-500 absolute -top-5 whitespace-nowrap -rotate-45 origin-bottom-left font-mono",
                                                children: isJan ? m.split('-')[0] : m.split('-')[1]
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                lineNumber: 128,
                                                columnNumber: 21
                                            }, this),
                                            !showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[9px] text-gray-400 absolute -top-5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none z-10",
                                                children: m
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                lineNumber: 134,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-px mt-auto ${isJan ? 'h-3 bg-gray-600' : 'h-1.5 bg-gray-800'}`
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                lineNumber: 138,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                        lineNumber: 126,
                                        columnNumber: 17
                                    }, this);
                                })
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                            lineNumber: 118,
                            columnNumber: 11
                        }, this),
                        branches.map((b)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-24 shrink-0 text-xs text-gray-400 font-mono truncate pr-2 flex items-center justify-between",
                                        title: b,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: b
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                lineNumber: 148,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[9px] text-gray-600",
                                                children: [
                                                    Math.round(months.reduce((acc, m)=>acc + (matrix.get(`${b}_${m}`)?.coverage_pct ?? 0), 0) / months.length),
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                lineNumber: 150,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                        lineNumber: 147,
                                        columnNumber: 15
                                    }, this),
                                    months.map((m)=>{
                                        const cell = matrix.get(`${b}_${m}`);
                                        const pct = cell?.coverage_pct ?? 0;
                                        const bg = cell ? getBackgroundColor(pct) : 'rgba(31, 41, 55, 0.4)';
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-8 h-8 rounded-[3px] transition-colors cursor-crosshair group relative",
                                            style: {
                                                backgroundColor: bg
                                            },
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 w-max opacity-0 transition-opacity group-hover:opacity-100",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-900 text-gray-100 text-xs rounded-md py-2 px-3 shadow-2xl border border-gray-700/80 text-center flex flex-col gap-1.5 min-w-[120px]",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-semibold text-gray-300 border-b border-gray-700/50 pb-1 mb-0.5",
                                                                children: [
                                                                    b,
                                                                    " ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "mx-1 text-gray-600",
                                                                        children: "•"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                        lineNumber: 169,
                                                                        columnNumber: 114
                                                                    }, this),
                                                                    " ",
                                                                    m
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                lineNumber: 169,
                                                                columnNumber: 25
                                                            }, this),
                                                            cell ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-emerald-400 font-mono text-sm",
                                                                        children: [
                                                                            pct,
                                                                            "% Active"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                        lineNumber: 172,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-[10px] text-gray-400",
                                                                        children: [
                                                                            cell.active_skus,
                                                                            " / ",
                                                                            cell.total_skus,
                                                                            " SKU"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                        lineNumber: 173,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-500 py-1",
                                                                children: [
                                                                    "Không có dữ liệu",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                        lineNumber: 176,
                                                                        columnNumber: 79
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-[9px]",
                                                                        children: "(Chưa có SKU ra mắt)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                        lineNumber: 176,
                                                                        columnNumber: 84
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                                lineNumber: 176,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                        lineNumber: 168,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-700/80"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                        lineNumber: 180,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                                lineNumber: 167,
                                                columnNumber: 21
                                            }, this)
                                        }, m, false, {
                                            fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                            lineNumber: 161,
                                            columnNumber: 19
                                        }, this);
                                    })
                                ]
                            }, b, true, {
                                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                    lineNumber: 115,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/branch-coverage-heatmap.tsx",
        lineNumber: 98,
        columnNumber: 5
    }, this);
}
_s(BranchCoverageHeatmap, "HdkFM7Os6Ucpxp9bwWfRv3vWveA=");
_c = BranchCoverageHeatmap;
var _c;
__turbopack_context__.k.register(_c, "BranchCoverageHeatmap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-overview.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaOverview",
    ()=>EdaOverview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/charts.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$crosstab$2d$history$2d$pattern$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/crosstab-history-pattern.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$pattern$2d$timeline$2d$sample$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/pattern-timeline-sample.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$branch$2d$coverage$2d$heatmap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/branch-coverage-heatmap.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function EdaOverview({ branches, branchCode, onBranchChange }) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EdaOverview.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/overview", {
                branch_code: branchCode === "__ALL__" ? undefined : branchCode
            }).then(setData).catch({
                "EdaOverview.useEffect": (reason)=>setError(reason.message)
            }["EdaOverview.useEffect"]);
        }
    }["EdaOverview.useEffect"], [
        branchCode
    ]);
    const returnRate = data?.kpis.gross_qty ? data.kpis.return_qty / data.kpis.gross_qty : null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        },
        children: [
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "error-banner",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-overview.tsx",
                lineNumber: 35,
                columnNumber: 16
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "kpi-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "SKU gốc quan sát"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 37,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.base_skus)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 37,
                                columnNumber: 47
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Group 1–4"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 37,
                                columnNumber: 100
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Chi nhánh"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 38,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.branches)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 38,
                                columnNumber: 40
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Đang hoạt động, có giao dịch"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 38,
                                columnNumber: 92
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Bán ra"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 39,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.gross_qty)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 39,
                                columnNumber: 37
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "M2 gross dương"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 39,
                                columnNumber: 90
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Hàng trả"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 40,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.return_qty)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 40,
                                columnNumber: 39
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: [
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(returnRate),
                                    " so với gross"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 40,
                                columnNumber: 93
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Sản lượng thuần"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 41,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.net_qty)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 41,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Gross trừ return"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 41,
                                columnNumber: 97
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-overview.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "eda-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "eyebrow",
                                                children: "MOVEMENT"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                                lineNumber: 44,
                                                columnNumber: 75
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                children: "Xu hướng M2 bán ra theo tháng"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                                lineNumber: 44,
                                                columnNumber: 110
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                                        lineNumber: 44,
                                        columnNumber: 70
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: data?.trend.length ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(data.trend[0].month)} → ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(data.trend.at(-1).month)}` : "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                                        lineNumber: 44,
                                        columnNumber: 154
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 44,
                                columnNumber: 41
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LineChart"], {
                                series: (data?.trend ?? []).map((row)=>({
                                        label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(row.month),
                                        value: row.gross_qty
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 44,
                                columnNumber: 282
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "MIX"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 45,
                                            columnNumber: 70
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Sản lượng theo vùng"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 45,
                                            columnNumber: 100
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 45,
                                    columnNumber: 65
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 45,
                                columnNumber: 36
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalBars"], {
                                data: (data?.regions ?? []).map((row)=>({
                                        label: row.region,
                                        value: row.gross_qty
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 45,
                                columnNumber: 140
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "SIZE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 46,
                                            columnNumber: 70
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Top kích thước"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 46,
                                            columnNumber: 101
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 46,
                                    columnNumber: 65
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 46,
                                columnNumber: 36
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalBars"], {
                                data: (data?.sizes ?? []).map((row)=>({
                                        label: row.size_code,
                                        value: row.gross_qty
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 46,
                                columnNumber: 136
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "LIFECYCLE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 47,
                                            columnNumber: 70
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Trạng thái SKU gốc"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 47,
                                            columnNumber: 106
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 47,
                                    columnNumber: 65
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 47,
                                columnNumber: 36
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalBars"], {
                                data: (data?.status_counts ?? []).map((row)=>({
                                        label: row.status === "active" ? "Đang hoạt động" : "Vô hiệu hóa",
                                        value: row.value
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 47,
                                columnNumber: 145
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 47,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "QUALITY GATE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 48,
                                            columnNumber: 70
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Ngoại lệ dữ liệu"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 48,
                                            columnNumber: 109
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 48,
                                    columnNumber: 65
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 48,
                                columnNumber: 36
                            }, this),
                            data?.data_quality.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$charts$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HorizontalBars"], {
                                data: data.data_quality.map((row)=>({
                                        label: row.rule_code,
                                        value: row.value
                                    }))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 48,
                                columnNumber: 175
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "empty",
                                children: "Không có ngoại lệ."
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 48,
                                columnNumber: 280
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "panel-note",
                                children: "Các mã sai cấu trúc được giữ để truy vết và loại khỏi forecast, không bị xóa khỏi nguồn."
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 48,
                                columnNumber: 324
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "PATTERN"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 49,
                                            columnNumber: 75
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Phân loại Demand Pattern & History"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 49,
                                            columnNumber: 109
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 49,
                                    columnNumber: 70
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 49,
                                columnNumber: 41
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$crosstab$2d$history$2d$pattern$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CrosstabHistoryPattern"], {
                                branchCode: branchCode
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 49,
                                columnNumber: 164
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 49,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "TIMELINE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 50,
                                            columnNumber: 75
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Mẫu chuỗi thời gian (Dot-matrix)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 50,
                                            columnNumber: 110
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 50,
                                    columnNumber: 70
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 50,
                                columnNumber: 41
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$pattern$2d$timeline$2d$sample$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PatternTimelineSample"], {
                                branchCode: branchCode
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 50,
                                columnNumber: 163
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: "panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "panel-title",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "eyebrow",
                                            children: "COVERAGE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 51,
                                            columnNumber: 75
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Độ phủ danh mục theo chi nhánh"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-overview.tsx",
                                            lineNumber: 51,
                                            columnNumber: 110
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-overview.tsx",
                                    lineNumber: 51,
                                    columnNumber: 70
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 51,
                                columnNumber: 41
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$branch$2d$coverage$2d$heatmap$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BranchCoverageHeatmap"], {}, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-overview.tsx",
                                lineNumber: 51,
                                columnNumber: 161
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-overview.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-overview.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-overview.tsx",
        lineNumber: 34,
        columnNumber: 5
    }, this);
}
_s(EdaOverview, "XDVXnHzsKW9JpOo48THjIq2+NOI=");
_c = EdaOverview;
var _c;
__turbopack_context__.k.register(_c, "EdaOverview");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-sku.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaSku",
    ()=>EdaSku
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function EdaSku({ branchCode }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "panel-title",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "eyebrow",
                            children: "SKU"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-sku.tsx",
                            lineNumber: 8,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            children: "Phân tích SKU"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-sku.tsx",
                            lineNumber: 9,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/eda-sku.tsx",
                    lineNumber: 7,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-sku.tsx",
                lineNumber: 6,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "empty",
                children: "Nội dung SKU (Sắp ra mắt)"
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-sku.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-sku.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
_c = EdaSku;
var _c;
__turbopack_context__.k.register(_c, "EdaSku");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-branch.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaBranch",
    ()=>EdaBranch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function EdaBranch({ branchCode }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "panel-title",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "eyebrow",
                            children: "CHI NHÁNH"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-branch.tsx",
                            lineNumber: 8,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            children: "Phân tích Chi nhánh"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-branch.tsx",
                            lineNumber: 9,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/eda-branch.tsx",
                    lineNumber: 7,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-branch.tsx",
                lineNumber: 6,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "empty",
                children: "Nội dung Chi nhánh (Sắp ra mắt)"
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-branch.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-branch.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
_c = EdaBranch;
var _c;
__turbopack_context__.k.register(_c, "EdaBranch");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-branch-sku.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaBranchSku",
    ()=>EdaBranchSku
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function isOverviewData(value) {
    if (!value || typeof value !== "object") return false;
    const candidate = value;
    return Boolean(candidate.filters && candidate.options && candidate.kpis && candidate.heatmap && Array.isArray(candidate.items) && Array.isArray(candidate.exceptions));
}
function money(value) {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    }).format(value);
}
function metric(value, digits = 2) {
    return value === null || value === undefined ? "—" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(value, digits);
}
function metricValue(value, selectedMetric) {
    if (value === null) return "—";
    if (selectedMetric === "revenue") return money(value);
    if (selectedMetric === "growth") return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(value);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(value);
}
function growthClass(value) {
    if (value === null) return "neutral";
    return value >= 0 ? "positive" : "negative";
}
function statusClass(status) {
    return status === "Hoạt động" ? "active" : "inactive";
}
function Sparkline({ points }) {
    const width = 130;
    const height = 36;
    const max = Math.max(...points.map((point)=>point.value), 1);
    const polyline = points.map((point, index)=>{
        const x = 2 + index / Math.max(points.length - 1, 1) * (width - 4);
        const y = height - 3 - point.value / max * (height - 6);
        return `${x},${y}`;
    }).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        className: "pair-sparkline",
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": "Xu hướng demand 12 tháng",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
            points: polyline,
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.4",
            strokeLinejoin: "round",
            strokeLinecap: "round"
        }, void 0, false, {
            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
            lineNumber: 155,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
        lineNumber: 154,
        columnNumber: 5
    }, this);
}
_c = Sparkline;
function HistoryChart({ history }) {
    if (!history.length) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "pair-empty",
        children: "Không có lịch sử demand."
    }, void 0, false, {
        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
        lineNumber: 161,
        columnNumber: 31
    }, this);
    const width = 940;
    const height = 230;
    const max = Math.max(...history.map((point)=>point.quantity), 1);
    const points = history.map((point, index)=>{
        const x = 18 + index / Math.max(history.length - 1, 1) * (width - 36);
        const y = height - 24 - point.quantity / max * (height - 46);
        return `${x},${y}`;
    }).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "pair-history-chart",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: `0 0 ${width} ${height}`,
                role: "img",
                "aria-label": "Lịch sử demand thực tế",
                children: [
                    [
                        0.25,
                        0.5,
                        0.75
                    ].map((ratio)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: "18",
                            x2: width - 18,
                            y1: height * ratio,
                            y2: height * ratio
                        }, ratio, false, {
                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                            lineNumber: 173,
                            columnNumber: 43
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: points,
                        fill: "none",
                        stroke: "#23afff",
                        strokeWidth: "3",
                        strokeLinejoin: "round",
                        strokeLinecap: "round"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 174,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(history[0].month)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 176,
                        columnNumber: 12
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            "Đỉnh ",
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(max),
                            " M2"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 176,
                        columnNumber: 56
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(history.at(-1).month)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 176,
                        columnNumber: 100
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 176,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
        lineNumber: 171,
        columnNumber: 5
    }, this);
}
_c1 = HistoryChart;
function Heatmap({ data, metricName, onSelect }) {
    _s();
    const cellMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "Heatmap.useMemo[cellMap]": ()=>new Map(data.cells.map({
                "Heatmap.useMemo[cellMap]": (cell)=>[
                        `${cell.base_sku}\u0000${cell.branch_code}`,
                        cell
                    ]
            }["Heatmap.useMemo[cellMap]"]))
    }["Heatmap.useMemo[cellMap]"], [
        data.cells
    ]);
    const values = data.cells.map((cell)=>cell.value).filter((value)=>value !== null);
    const positiveMax = Math.max(...values.filter((value)=>value >= 0), 1);
    const negativeMax = Math.max(...values.filter((value)=>value < 0).map(Math.abs), 1);
    function cellColor(value) {
        if (value === null) return "rgba(84,105,120,.10)";
        if (metricName === "growth") {
            const alpha = Math.min(0.88, 0.14 + Math.abs(value) / (value >= 0 ? positiveMax : negativeMax) * 0.7);
            return value >= 0 ? `rgba(33,215,155,${alpha})` : `rgba(255,113,133,${alpha})`;
        }
        const alpha = Math.min(0.9, 0.12 + Math.max(value, 0) / positiveMax * 0.76);
        return `rgba(35,175,255,${alpha})`;
    }
    if (!data.skus.length || !data.branches.length) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "pair-empty",
            children: "Không có dữ liệu phù hợp để tạo heatmap."
        }, void 0, false, {
            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
            lineNumber: 205,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "pair-heatmap-scroll",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "pair-heatmap",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                children: "Base SKU"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 211,
                                columnNumber: 20
                            }, this),
                            data.branches.map((branch)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    title: branch.branch_name,
                                    children: branch.branch_code
                                }, branch.branch_code, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 211,
                                    columnNumber: 68
                                }, this))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 211,
                        columnNumber: 16
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                    lineNumber: 211,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: data.skus.map((sku)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                    title: sku.sku_name,
                                    children: [
                                        sku.base_sku,
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            children: sku.sku_name
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 215,
                                            columnNumber: 54
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 215,
                                    columnNumber: 15
                                }, this),
                                data.branches.map((branch)=>{
                                    const cell = cellMap.get(`${sku.base_sku}\u0000${branch.branch_code}`);
                                    const value = cell?.value ?? null;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            style: {
                                                background: cellColor(value)
                                            },
                                            title: `${sku.base_sku} × ${branch.branch_code}: ${metricValue(value, metricName)}`,
                                            onClick: ()=>onSelect(sku.base_sku, branch.branch_code, sku.sku_name, branch.branch_name),
                                            children: metricValue(value, metricName)
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 221,
                                            columnNumber: 21
                                        }, this)
                                    }, branch.branch_code, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 220,
                                        columnNumber: 19
                                    }, this);
                                })
                            ]
                        }, sku.base_sku, true, {
                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                            lineNumber: 214,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                    lineNumber: 212,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
            lineNumber: 210,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
        lineNumber: 209,
        columnNumber: 5
    }, this);
}
_s(Heatmap, "kFUb0I5Eh0h5Mols4BcXhPyj6dA=");
_c2 = Heatmap;
function EdaBranchSku({ branchCode }) {
    _s1();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [region, setRegion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [branch, setBranch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(branchCode === "__ALL__" ? "" : branchCode);
    const [skuDraft, setSkuDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [sku, setSku] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateFrom, setDateFrom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateTo, setDateTo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [demandPattern, setDemandPattern] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [abcClass, setAbcClass] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [heatmapMetric, setHeatmapMetric] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("quantity");
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [detail, setDetail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [detailLabel, setDetailLabel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [detailLoading, setDetailLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EdaBranchSku.useEffect": ()=>{
            let cancelled = false;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/branch-sku/overview", {
                region: region || undefined,
                branch: branch || undefined,
                sku: sku || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                demand_pattern: demandPattern || undefined,
                abc_class: abcClass || undefined,
                status,
                metric: heatmapMetric,
                page,
                page_size: 50
            }).then({
                "EdaBranchSku.useEffect": (response)=>{
                    if (cancelled) return;
                    if (!isOverviewData(response)) {
                        throw new Error("API SKU × Chi nhánh chưa được nạp. Hãy restart backend.");
                    }
                    setData(response);
                    setError(null);
                }
            }["EdaBranchSku.useEffect"]).catch({
                "EdaBranchSku.useEffect": (reason)=>{
                    if (!cancelled) setError(reason.message);
                }
            }["EdaBranchSku.useEffect"]).finally({
                "EdaBranchSku.useEffect": ()=>{
                    if (!cancelled) setLoading(false);
                }
            }["EdaBranchSku.useEffect"]);
            return ({
                "EdaBranchSku.useEffect": ()=>{
                    cancelled = true;
                }
            })["EdaBranchSku.useEffect"];
        }
    }["EdaBranchSku.useEffect"], [
        abcClass,
        branch,
        dateFrom,
        dateTo,
        demandPattern,
        heatmapMetric,
        page,
        region,
        sku,
        status
    ]);
    const visibleBranches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "EdaBranchSku.useMemo[visibleBranches]": ()=>(data?.options.branches ?? []).filter({
                "EdaBranchSku.useMemo[visibleBranches]": (item)=>!region || item.region === region
            }["EdaBranchSku.useMemo[visibleBranches]"])
    }["EdaBranchSku.useMemo[visibleBranches]"], [
        data?.options.branches,
        region
    ]);
    const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / 50));
    function resetPageAnd(action) {
        setLoading(true);
        setPage(1);
        setDetail(null);
        action();
    }
    function submitSku(event) {
        event.preventDefault();
        resetPageAnd(()=>setSku(skuDraft.trim()));
    }
    function openDetail(baseSku, branchCodeValue, skuName, branchName) {
        setDetailLoading(true);
        setDetail(null);
        setDetailLabel({
            skuName,
            branchName
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/branch-sku/detail", {
            base_sku: baseSku,
            branch: branchCodeValue
        }).then((response)=>{
            setDetail(response);
            setError(null);
        }).catch((reason)=>setError(reason.message)).finally(()=>setDetailLoading(false));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `jsx-${styles.__hash}` + " " + "pair-page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `jsx-${styles.__hash}` + " " + "pair-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `jsx-${styles.__hash}` + " " + "eyebrow",
                                children: "SKU × CHI NHÁNH"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 325,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: `jsx-${styles.__hash}`,
                                children: "Demand chi tiết theo SKU và Chi nhánh"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 325,
                                columnNumber: 56
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `jsx-${styles.__hash}`,
                                children: "Mỗi dòng là một chuỗi demand `base_sku + branch`, đã cộng toàn bộ Bravo SKU theo tháng."
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 325,
                                columnNumber: 102
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 325,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Dữ liệu đến ",
                            data?.data_as_of_month ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(data.data_as_of_month) : "—"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 326,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 324,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: `jsx-${styles.__hash}` + " " + "pair-filters",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Region",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: region,
                                onChange: (event)=>resetPageAnd(()=>{
                                        setRegion(event.target.value);
                                        setBranch("");
                                    }),
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Tất cả vùng"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 330,
                                        columnNumber: 137
                                    }, this),
                                    data?.options.regions.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            className: `jsx-${styles.__hash}`,
                                            children: item
                                        }, item, false, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 330,
                                            columnNumber: 211
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 330,
                                columnNumber: 22
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 330,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Branch",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: branch,
                                onChange: (event)=>resetPageAnd(()=>setBranch(event.target.value)),
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Tất cả chi nhánh"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 331,
                                        columnNumber: 117
                                    }, this),
                                    visibleBranches.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: item.branch_code,
                                            className: `jsx-${styles.__hash}`,
                                            children: [
                                                item.branch_code,
                                                " — ",
                                                item.branch_name
                                            ]
                                        }, `${item.region}-${item.branch_code}`, true, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 331,
                                            columnNumber: 190
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 331,
                                columnNumber: 22
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 331,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        title: "Bảng nguồn không có cột Brand",
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Brand",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                disabled: true,
                                className: `jsx-${styles.__hash}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                    className: `jsx-${styles.__hash}`,
                                    children: "Không có trong nguồn"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 332,
                                    columnNumber: 76
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 332,
                                columnNumber: 59
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 332,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                        onSubmit: submitSku,
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    "SKU",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        value: skuDraft,
                                        onChange: (event)=>setSkuDraft(event.target.value),
                                        placeholder: "Mã hoặc tên SKU",
                                        className: `jsx-${styles.__hash}`
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 333,
                                        columnNumber: 46
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 333,
                                columnNumber: 36
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "submit",
                                className: `jsx-${styles.__hash}`,
                                children: "Lọc"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 333,
                                columnNumber: 164
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 333,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Từ tháng",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: dateFrom || data?.filters.date_from.slice(0, 10) || "",
                                onChange: (event)=>resetPageAnd(()=>setDateFrom(event.target.value)),
                                className: `jsx-${styles.__hash}`
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 334,
                                columnNumber: 24
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 334,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Đến tháng",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: dateTo || data?.filters.date_to.slice(0, 10) || "",
                                onChange: (event)=>resetPageAnd(()=>setDateTo(event.target.value)),
                                className: `jsx-${styles.__hash}`
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 335,
                                columnNumber: 25
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 335,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Nhóm demand",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: demandPattern,
                                onChange: (event)=>resetPageAnd(()=>setDemandPattern(event.target.value)),
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Tất cả nhóm"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 336,
                                        columnNumber: 136
                                    }, this),
                                    data?.options.demand_patterns.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            className: `jsx-${styles.__hash}`,
                                            children: item
                                        }, item, false, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 336,
                                            columnNumber: 218
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 336,
                                columnNumber: 27
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 336,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "ABC",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: abcClass,
                                onChange: (event)=>resetPageAnd(()=>setAbcClass(event.target.value)),
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Tất cả nhóm"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 337,
                                        columnNumber: 118
                                    }, this),
                                    data?.options.abc_classes.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            className: `jsx-${styles.__hash}`,
                                            children: item
                                        }, item, false, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 337,
                                            columnNumber: 196
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 337,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 337,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            "Trạng thái",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: status,
                                onChange: (event)=>resetPageAnd(()=>setStatus(event.target.value)),
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "all",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Tất cả"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 338,
                                        columnNumber: 121
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "active",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Hoạt động"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 338,
                                        columnNumber: 156
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "inactive",
                                        className: `jsx-${styles.__hash}`,
                                        children: "Vô hiệu hóa"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 338,
                                        columnNumber: 197
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 338,
                                columnNumber: 26
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 338,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 329,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `jsx-${styles.__hash}` + " " + "error-banner",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 341,
                columnNumber: 16
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: `jsx-${styles.__hash}` + " " + `pair-kpis ${loading ? "loading" : ""}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: "Cặp SKU × Branch"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 344,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${styles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.pair_count)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 344,
                                columnNumber: 47
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${styles.__hash}`,
                                children: "Trong phạm vi lọc"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 344,
                                columnNumber: 101
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 344,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: "Demand quantity"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 345,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${styles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.gross_quantity)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 345,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${styles.__hash}`,
                                children: "M2 dương"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 345,
                                columnNumber: 104
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 345,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: "Doanh thu"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 346,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${styles.__hash}`,
                                children: money(data?.kpis.revenue)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 346,
                                columnNumber: 40
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${styles.__hash}`,
                                children: "Trong kỳ đã chọn"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 346,
                                columnNumber: 84
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 346,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: "Demand Lumpy"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 347,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${styles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.lumpy_count)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 347,
                                columnNumber: 43
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${styles.__hash}`,
                                children: "Cần review thủ công"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 347,
                                columnNumber: 98
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 347,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: "Thiếu lịch sử"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 348,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${styles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.insufficient_count)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 348,
                                columnNumber: 44
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${styles.__hash}`,
                                children: "Không đủ tính pattern"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 348,
                                columnNumber: 106
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 348,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 343,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                className: `jsx-${styles.__hash}` + " " + "pair-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `jsx-${styles.__hash}` + " " + "eyebrow",
                                        children: "HEATMAP"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 352,
                                        columnNumber: 22
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: `jsx-${styles.__hash}`,
                                        children: "SKU × Branch"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 352,
                                        columnNumber: 56
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 352,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}` + " " + "pair-toggle",
                                children: [
                                    [
                                        'quantity',
                                        'Sản lượng'
                                    ],
                                    [
                                        'revenue',
                                        'Doanh thu'
                                    ],
                                    [
                                        'growth',
                                        '% tăng trưởng'
                                    ]
                                ].map(([value, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setLoading(true);
                                            setPage(1);
                                            setHeatmapMetric(value);
                                        },
                                        className: `jsx-${styles.__hash}` + " " + ((heatmapMetric === value ? "active" : "") || ""),
                                        children: label
                                    }, value, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 352,
                                        columnNumber: 249
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 352,
                                columnNumber: 83
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 352,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Heatmap, {
                        data: data?.heatmap ?? {
                            metric: heatmapMetric,
                            branches: [],
                            skus: [],
                            cells: []
                        },
                        metricName: heatmapMetric,
                        onSelect: openDetail
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 353,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `jsx-${styles.__hash}` + " " + "pair-note",
                        children: "Hiển thị tối đa 20 SKU và 10 chi nhánh có demand lớn nhất trong phạm vi lọc."
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 354,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 351,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                className: `jsx-${styles.__hash}` + " " + "pair-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `jsx-${styles.__hash}` + " " + "eyebrow",
                                        children: "PAIR DETAIL"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 358,
                                        columnNumber: 22
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: `jsx-${styles.__hash}`,
                                        children: "Bảng chi tiết SKU × Chi nhánh"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 358,
                                        columnNumber: 60
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 358,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.total),
                                    " kết quả"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 358,
                                columnNumber: 104
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 358,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${styles.__hash}` + " " + "pair-table-scroll",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: `jsx-${styles.__hash}` + " " + "pair-table",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: `jsx-${styles.__hash}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: `jsx-${styles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "SKU"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 24
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Branch"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 36
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Doanh thu"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 51
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Quantity"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 69
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Xu hướng 12T"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 86
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "ADI"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 107
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "CV"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 119
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Demand"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 130
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "ABC"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 145
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Tăng trưởng"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 157
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Trạng thái"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 177
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Cảnh báo"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 361,
                                                columnNumber: 196
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 361,
                                        columnNumber: 20
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 361,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: `jsx-${styles.__hash}`,
                                    children: [
                                        data?.items.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                onClick: ()=>openDetail(row.base_sku, row.branch_code, row.sku_name, row.branch_name),
                                                className: `jsx-${styles.__hash}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                className: `jsx-${styles.__hash}`,
                                                                children: row.base_sku
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                                lineNumber: 365,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                className: `jsx-${styles.__hash}`,
                                                                children: row.sku_name
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                                lineNumber: 365,
                                                                columnNumber: 54
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 365,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                className: `jsx-${styles.__hash}`,
                                                                children: row.branch_code
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                                lineNumber: 366,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                className: `jsx-${styles.__hash}`,
                                                                children: row.branch_name
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                                lineNumber: 366,
                                                                columnNumber: 57
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 366,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}` + " " + "number",
                                                        children: money(row.revenue)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}` + " " + "number",
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(row.gross_quantity)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 367,
                                                        columnNumber: 67
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Sparkline, {
                                                            points: row.trend
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 368,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}` + " " + "number",
                                                        children: metric(row.adi)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 60
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}` + " " + "number",
                                                        children: metric(row.cv)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 105
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `jsx-${styles.__hash}` + " " + `pattern ${row.demand_pattern.toLowerCase()}`,
                                                            children: row.demand_pattern
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 369,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 369,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `jsx-${styles.__hash}` + " " + `abc abc-${row.abc_class.toLowerCase()}`,
                                                            children: row.abc_class
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 369,
                                                            columnNumber: 123
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 369,
                                                        columnNumber: 119
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}` + " " + (growthClass(row.growth) || ""),
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(row.growth)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 370,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `jsx-${styles.__hash}` + " " + `pair-status ${statusClass(row.status)}`,
                                                            children: row.status
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 370,
                                                            columnNumber: 95
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 370,
                                                        columnNumber: 91
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: row.warnings.length ? row.warnings.map((warning)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                className: `jsx-${styles.__hash}` + " " + "warning",
                                                                children: warning
                                                            }, warning, false, {
                                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                                lineNumber: 371,
                                                                columnNumber: 76
                                                            }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `jsx-${styles.__hash}` + " " + "muted",
                                                            children: "—"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 371,
                                                            columnNumber: 138
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 371,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, `${row.base_sku}-${row.branch_code}`, true, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 364,
                                                columnNumber: 17
                                            }, this)),
                                        !loading && !data?.items.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: `jsx-${styles.__hash}`,
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                colSpan: 12,
                                                className: `jsx-${styles.__hash}` + " " + "pair-empty",
                                                children: "Không có dữ liệu phù hợp."
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 374,
                                                columnNumber: 54
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 374,
                                            columnNumber: 50
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 362,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                            lineNumber: 360,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 359,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                        className: `jsx-${styles.__hash}` + " " + "pair-pagination",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                disabled: page <= 1 || loading,
                                onClick: ()=>{
                                    setLoading(true);
                                    setPage((current)=>Math.max(1, current - 1));
                                },
                                className: `jsx-${styles.__hash}`,
                                children: "← Trước"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 378,
                                columnNumber: 45
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    "Trang ",
                                    page,
                                    "/",
                                    totalPages
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 378,
                                columnNumber: 201
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                disabled: page >= totalPages || loading,
                                onClick: ()=>{
                                    setLoading(true);
                                    setPage((current)=>current + 1);
                                },
                                className: `jsx-${styles.__hash}`,
                                children: "Sau →"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 378,
                                columnNumber: 239
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 378,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 357,
                columnNumber: 7
            }, this),
            detailLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                className: `jsx-${styles.__hash}` + " " + "pair-panel",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: `jsx-${styles.__hash}` + " " + "pair-empty",
                    children: "Đang tải chi tiết chuỗi…"
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                    lineNumber: 381,
                    columnNumber: 56
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 381,
                columnNumber: 24
            }, this) : null,
            detail ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                className: `jsx-${styles.__hash}` + " " + "pair-panel pair-drill",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `jsx-${styles.__hash}` + " " + "eyebrow",
                                        children: "DRILL-IN"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 384,
                                        columnNumber: 24
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: `jsx-${styles.__hash}`,
                                        children: [
                                            detail.base_sku,
                                            " × ",
                                            detail.branch_code
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 384,
                                        columnNumber: 59
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `jsx-${styles.__hash}`,
                                        children: [
                                            detailLabel?.skuName,
                                            " — ",
                                            detailLabel?.branchName
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 384,
                                        columnNumber: 108
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 384,
                                columnNumber: 19
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setDetail(null),
                                className: `jsx-${styles.__hash}`,
                                children: "Đóng ×"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 384,
                                columnNumber: 177
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 384,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: `jsx-${styles.__hash}` + " " + "pair-drill-grid",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                        className: `jsx-${styles.__hash}`,
                                        children: "Lịch sử demand quantity"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 386,
                                        columnNumber: 18
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HistoryChart, {
                                        history: detail.history
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 386,
                                        columnNumber: 50
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 386,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                                        className: `jsx-${styles.__hash}`,
                                        children: "Lịch sử thay đổi trạng thái"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 387,
                                        columnNumber: 18
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `jsx-${styles.__hash}` + " " + "status-timeline",
                                        children: detail.status_history.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `jsx-${styles.__hash}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                                        className: `jsx-${styles.__hash}` + " " + (statusClass(item.status) || "")
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 166
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(item.month)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 208
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: item.status
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 246
                                                    }, this)
                                                ]
                                            }, `${item.month}-${item.status}`, true, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 387,
                                                columnNumber: 124
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 387,
                                        columnNumber: 54
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 387,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 385,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
                        className: `jsx-${styles.__hash}`,
                        children: "Bravo SKU thuộc cặp này"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 389,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${styles.__hash}` + " " + "pair-table-scroll",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: `jsx-${styles.__hash}` + " " + "pair-table variants",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: `jsx-${styles.__hash}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: `jsx-${styles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Bravo SKU"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 96
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Tên SKU"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 114
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Quantity"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 130
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Quan sát đầu"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 147
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Quan sát cuối"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 168
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Bán gần nhất"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 190
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Trạng thái"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 390,
                                                columnNumber: 211
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 390,
                                        columnNumber: 92
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 390,
                                    columnNumber: 85
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: `jsx-${styles.__hash}`,
                                    children: detail.variants.map((variant)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: `jsx-${styles.__hash}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        className: `jsx-${styles.__hash}`,
                                                        children: variant.bravo_sku
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 390,
                                                        columnNumber: 316
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 312
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: variant.sku_name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 357
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}` + " " + "number",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(variant.gross_quantity)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 384
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(variant.first_observed_month)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 450
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(variant.last_observed_month)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 502
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: variant.last_positive_sale_month ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(variant.last_positive_sale_month) : "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 553
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `jsx-${styles.__hash}` + " " + `pair-status ${statusClass(variant.status)}`,
                                                        children: variant.status
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 390,
                                                        columnNumber: 654
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 390,
                                                    columnNumber: 650
                                                }, this)
                                            ]
                                        }, variant.bravo_sku, true, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 390,
                                            columnNumber: 284
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 390,
                                    columnNumber: 243
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                            lineNumber: 390,
                            columnNumber: 46
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 390,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 383,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                className: `jsx-${styles.__hash}` + " " + "pair-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: `jsx-${styles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${styles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `jsx-${styles.__hash}` + " " + "eyebrow",
                                        children: "EXCEPTIONS"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 395,
                                        columnNumber: 22
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: `jsx-${styles.__hash}`,
                                        children: "Các cặp cần review"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 395,
                                        columnNumber: 59
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 395,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${styles.__hash}`,
                                children: "Lumpy, thiếu lịch sử hoặc vô hiệu hóa"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                lineNumber: 395,
                                columnNumber: 92
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 395,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${styles.__hash}` + " " + "pair-table-scroll",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: `jsx-${styles.__hash}` + " " + "pair-table exceptions",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: `jsx-${styles.__hash}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: `jsx-${styles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "SKU"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 96
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Branch"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 108
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Demand"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 123
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "ABC"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 138
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Quantity"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 150
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "ADI"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 167
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "CV"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 179
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${styles.__hash}`,
                                                children: "Cảnh báo"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                lineNumber: 396,
                                                columnNumber: 190
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                        lineNumber: 396,
                                        columnNumber: 92
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 396,
                                    columnNumber: 85
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: `jsx-${styles.__hash}`,
                                    children: data?.exceptions.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            onClick: ()=>openDetail(row.base_sku, row.branch_code, row.sku_name, row.branch_name),
                                            className: `jsx-${styles.__hash}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            className: `jsx-${styles.__hash}`,
                                                            children: row.base_sku
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 396,
                                                            columnNumber: 398
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: `jsx-${styles.__hash}`,
                                                            children: row.sku_name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 396,
                                                            columnNumber: 429
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 394
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: [
                                                        row.branch_code,
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: `jsx-${styles.__hash}`,
                                                            children: row.branch_name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 396,
                                                            columnNumber: 484
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 463
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `jsx-${styles.__hash}` + " " + `pattern ${row.demand_pattern.toLowerCase()}`,
                                                        children: row.demand_pattern
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 396,
                                                        columnNumber: 525
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 521
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `jsx-${styles.__hash}` + " " + `abc abc-${row.abc_class.toLowerCase()}`,
                                                        children: row.abc_class
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                        lineNumber: 396,
                                                        columnNumber: 625
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 621
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}` + " " + "number",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(row.gross_quantity)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 711
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: metric(row.adi)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 773
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: metric(row.cv)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 799
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${styles.__hash}`,
                                                    children: row.warnings.map((warning)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: `jsx-${styles.__hash}` + " " + "warning",
                                                            children: warning
                                                        }, warning, false, {
                                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                            lineNumber: 396,
                                                            columnNumber: 859
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                                    lineNumber: 396,
                                                    columnNumber: 824
                                                }, this)
                                            ]
                                        }, `${row.base_sku}-${row.branch_code}`, true, {
                                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                            lineNumber: 396,
                                            columnNumber: 258
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                                    lineNumber: 396,
                                    columnNumber: 220
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                            lineNumber: 396,
                            columnNumber: 44
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                        lineNumber: 396,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 394,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `jsx-${styles.__hash}` + " " + "pair-method",
                children: [
                    "Pattern hiện dùng ADI ",
                    data?.thresholds.adi ?? "—",
                    " và CV² ",
                    data?.thresholds.cv2 ?? "—",
                    ". ABC được tính theo tỷ trọng quantity dương trong từng chi nhánh. Brand bị khóa vì bảng nguồn không có cột tương ứng."
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
                lineNumber: 399,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: styles.__hash,
                children: styles
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-branch-sku.tsx",
        lineNumber: 323,
        columnNumber: 5
    }, this);
}
_s1(EdaBranchSku, "JucfNOzdcwSvu+wCuwyxp335BVw=");
_c3 = EdaBranchSku;
const styles = `
  .pair-page{display:flex;flex-direction:column;gap:14px;min-width:0}.pair-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}.pair-heading h3{margin:4px 0;font-size:22px}.pair-heading p:last-child,.pair-heading>span,.pair-note,.pair-method{color:var(--muted);font-size:11px}.pair-filters{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:9px;padding:13px;background:#081725;border:1px solid var(--line);border-radius:10px}.pair-filters label{display:grid;gap:5px;color:var(--muted);font-size:9px;font-weight:800}.pair-filters select,.pair-filters input{width:100%;min-width:0;padding:9px;background:#0d1d2c;color:var(--text);border:1px solid var(--line);border-radius:7px}.pair-filters select:disabled{opacity:.55}.pair-filters form{display:grid;grid-template-columns:1fr auto;gap:5px;align-items:end}.pair-filters form button,.pair-pagination button,.pair-drill header button{padding:9px 12px;border:1px solid var(--line);border-radius:7px;background:#102536;color:var(--text)}.pair-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;transition:opacity .2s}.pair-kpis.loading{opacity:.5}.pair-kpis article{padding:13px;background:linear-gradient(145deg,#0d2030,#091722);border:1px solid var(--line);border-radius:9px;min-width:0}.pair-kpis span{display:block;color:var(--muted);font-size:9px}.pair-kpis strong{display:block;margin-top:6px;font-size:18px;overflow:hidden;text-overflow:ellipsis}.pair-kpis small{color:#78a2b9;font-size:9px}.pair-panel{padding:14px;background:#081725;border:1px solid var(--line);border-radius:10px;overflow:hidden}.pair-panel>header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:11px}.pair-panel h4{margin:4px 0;font-size:14px}.pair-panel header>span,.pair-panel header div>span{color:var(--muted);font-size:10px}.pair-toggle{display:flex;gap:5px}.pair-toggle button{padding:7px 10px;border:1px solid var(--line);border-radius:6px;background:#102536;color:#91a9b9;font-size:10px}.pair-toggle button.active{border-color:#168b72;background:#0c4035;color:#52e5ba}.pair-heatmap-scroll,.pair-table-scroll{overflow:auto}.pair-heatmap{border-spacing:4px;min-width:100%;border-collapse:separate}.pair-heatmap th{padding:5px;color:#9fb5c5;font-size:9px;white-space:nowrap}.pair-heatmap thead th{text-align:center}.pair-heatmap thead th:first-child,.pair-heatmap tbody th{text-align:left;position:sticky;left:0;background:#081725;z-index:2}.pair-heatmap tbody th{max-width:170px;color:var(--cyan)}.pair-heatmap th small{display:block;max-width:160px;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-weight:400}.pair-heatmap td{padding:0;min-width:92px}.pair-heatmap td button{width:100%;min-height:38px;padding:6px;border:1px solid rgba(100,150,180,.15);border-radius:5px;color:#e9f5fb;font-size:9px;font-variant-numeric:tabular-nums}.pair-table{width:100%;min-width:1420px;border-collapse:collapse}.pair-table th,.pair-table td{padding:10px 9px;border-bottom:1px solid var(--line);font-size:10px;white-space:nowrap;text-align:left}.pair-table th{color:#91a9b9;font-size:8px;text-transform:uppercase}.pair-table tbody tr{cursor:pointer}.pair-table tbody tr:hover{background:#10293b}.pair-table td strong{color:var(--cyan)}.pair-table td small{display:block;max-width:210px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;color:var(--muted)}.pair-table .number{text-align:right;font-weight:800;font-variant-numeric:tabular-nums}.pair-sparkline{display:block;width:130px;height:36px;color:#23afff}.pattern,.abc,.pair-status{display:inline-flex;padding:4px 7px;border-radius:5px;font-size:9px;font-weight:800;background:#163148;color:#a9d8f1}.pattern.smooth{background:#0c4035;color:#52e5ba}.pattern.erratic{background:#4a3410;color:#ffd36d}.pattern.intermittent{background:#2d2854;color:#b8abff}.pattern.lumpy,.pattern.insufficient{background:#431721;color:#ff8798}.abc-a{background:#0c4035;color:#52e5ba}.abc-b{background:#4a3410;color:#ffd36d}.abc-c{background:#431721;color:#ff8798}.pair-status.active{background:#0c4035;color:#52e5ba}.pair-status.inactive{background:#431721;color:#ff8798}.warning{color:#ff9aa8!important}.positive{color:var(--green)!important}.negative{color:var(--red)!important}.neutral{color:var(--muted)!important}.pair-pagination{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding-top:11px;color:var(--muted);font-size:10px}.pair-pagination button:disabled{opacity:.4}.pair-empty{padding:28px!important;text-align:center!important;color:var(--muted)}.pair-drill-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(240px,1fr);gap:12px;margin-bottom:16px}.pair-drill-grid>div{padding:12px;border:1px solid var(--line);border-radius:8px}.pair-drill h5{margin:0 0 10px}.pair-history-chart svg{width:100%;height:auto}.pair-history-chart line{stroke:#1d3547;stroke-width:1}.pair-history-chart>div{display:flex;justify-content:space-between;color:var(--muted);font-size:9px}.pair-history-chart strong{color:var(--text)}.status-timeline{display:grid;gap:8px}.status-timeline>div{display:grid;grid-template-columns:10px 70px 1fr;align-items:center;gap:7px;font-size:10px}.status-timeline i{width:8px;height:8px;border-radius:50%}.status-timeline i.active{background:var(--green)}.status-timeline i.inactive{background:var(--red)}.status-timeline span{color:var(--muted)}.variants{min-width:1100px}.exceptions{min-width:1050px}.pair-method{margin:0;line-height:1.6}@media(max-width:1200px){.pair-filters{grid-template-columns:repeat(3,1fr)}.pair-kpis{grid-template-columns:repeat(3,1fr)}}@media(max-width:800px){.pair-heading{align-items:flex-start;flex-direction:column}.pair-filters{grid-template-columns:1fr 1fr}.pair-kpis{grid-template-columns:1fr 1fr}.pair-panel>header{flex-direction:column}.pair-drill-grid{grid-template-columns:1fr}}@media(max-width:520px){.pair-filters,.pair-kpis{grid-template-columns:1fr}}
`;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "Sparkline");
__turbopack_context__.k.register(_c1, "HistoryChart");
__turbopack_context__.k.register(_c2, "Heatmap");
__turbopack_context__.k.register(_c3, "EdaBranchSku");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-region.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaRegion",
    ()=>EdaRegion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function isRegionData(value) {
    if (!value || typeof value !== "object") return false;
    const candidate = value;
    return Boolean(candidate.filters && Array.isArray(candidate.filters.regions) && candidate.kpis && Array.isArray(candidate.available_regions) && Array.isArray(candidate.monthly) && Array.isArray(candidate.regions) && Array.isArray(candidate.seasonality) && Array.isArray(candidate.branches));
}
const COLORS = [
    "#21d79b",
    "#23afff",
    "#ffc14d",
    "#b08cff",
    "#ff7185",
    "#58d6e8"
];
function metric(value, digits = 2) {
    return value === null || value === undefined ? "—" : (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(value, digits);
}
function growthClass(value) {
    if (value === null) return "neutral";
    return value >= 0 ? "positive" : "negative";
}
function MultiRegionChart({ rows, regions }) {
    const width = 980;
    const height = 290;
    const padding = {
        left: 20,
        right: 16,
        top: 18,
        bottom: 28
    };
    const months = [
        ...new Set(rows.map((row)=>row.month))
    ].sort();
    const max = Math.max(...rows.map((row)=>row.gross_quantity), 1);
    const x = (month)=>padding.left + months.indexOf(month) / Math.max(months.length - 1, 1) * (width - padding.left - padding.right);
    const y = (value)=>height - padding.bottom - value / max * (height - padding.top - padding.bottom);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "chart-shell",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: `0 0 ${width} ${height}`,
                role: "img",
                "aria-label": "Xu hướng demand theo vùng",
                children: [
                    [
                        0.25,
                        0.5,
                        0.75
                    ].map((ratio)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: padding.left,
                            x2: width - padding.right,
                            y1: height * ratio,
                            y2: height * ratio,
                            className: "region-grid-line"
                        }, ratio, false, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, this)),
                    regions.map((region, index)=>{
                        const points = rows.filter((row)=>row.region === region).sort((a, b)=>a.month.localeCompare(b.month));
                        const path = points.map((point)=>`${x(point.month)},${y(point.gross_quantity)}`).join(" ");
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                            points: path,
                            fill: "none",
                            stroke: COLORS[index % COLORS.length],
                            strokeWidth: "3",
                            strokeLinejoin: "round",
                            strokeLinecap: "round"
                        }, region, false, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 97,
                            columnNumber: 18
                        }, this);
                    })
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "chart-axis",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: months[0] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(months[0]) : "—"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 100,
                        columnNumber: 35
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: [
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(max),
                            " M2"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 100,
                        columnNumber: 90
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: months.at(-1) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(months.at(-1)) : "—"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 100,
                        columnNumber: 129
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "legend",
                children: regions.map((region, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                style: {
                                    background: COLORS[index % COLORS.length]
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 102,
                                columnNumber: 60
                            }, this),
                            region
                        ]
                    }, region, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 102,
                        columnNumber: 41
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-region.tsx",
        lineNumber: 89,
        columnNumber: 5
    }, this);
}
_c = MultiRegionChart;
function ContributionChart({ rows, onSelect }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "contribution-list",
        children: rows.slice().sort((a, b)=>b.gross_quantity - a.gross_quantity).map((row, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "contribution-row",
                type: "button",
                onClick: ()=>onSelect(row.region),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                style: {
                                    background: COLORS[index % COLORS.length]
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 113,
                                columnNumber: 17
                            }, this),
                            row.region
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 113,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "contribution-track",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                            style: {
                                width: `${(row.contribution_pct ?? 0) * 100}%`,
                                background: COLORS[index % COLORS.length]
                            }
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 114,
                            columnNumber: 47
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 114,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(row.contribution_pct)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 115,
                        columnNumber: 11
                    }, this)
                ]
            }, row.region, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 112,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/features/eda/eda-region.tsx",
        lineNumber: 110,
        columnNumber: 5
    }, this);
}
_c1 = ContributionChart;
function SeasonalityChart({ item }) {
    if (!item?.points.length) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "region-empty",
        children: "Không đủ dữ liệu seasonality."
    }, void 0, false, {
        fileName: "[project]/src/features/eda/eda-region.tsx",
        lineNumber: 123,
        columnNumber: 36
    }, this);
    const width = 940;
    const height = 230;
    const values = item.points.flatMap((point)=>[
            point.actual,
            point.trend
        ]);
    const max = Math.max(...values, 1);
    const pointString = (key)=>item.points.map((point, index)=>{
            const x = 16 + index / Math.max(item.points.length - 1, 1) * (width - 32);
            const y = height - 22 - point[key] / max * (height - 42);
            return `${x},${y}`;
        }).join(" ");
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "chart-shell",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: `0 0 ${width} ${height}`,
                role: "img",
                "aria-label": `Decompose seasonality ${item.region}`,
                children: [
                    [
                        0.33,
                        0.66
                    ].map((ratio)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: "16",
                            x2: width - 16,
                            y1: height * ratio,
                            y2: height * ratio,
                            className: "region-grid-line"
                        }, ratio, false, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 137,
                            columnNumber: 38
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: pointString("actual"),
                        fill: "none",
                        stroke: "#23afff",
                        strokeWidth: "2"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                        points: pointString("trend"),
                        fill: "none",
                        stroke: "#21d79b",
                        strokeWidth: "3"
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "season-index",
                children: item.monthly_index.map((month)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        title: `Chỉ số mùa vụ tháng ${month.month_number}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: [
                                    "T",
                                    month.month_number
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 144,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("b", {
                                className: (month.value ?? 1) >= 1 ? "high" : "low",
                                style: {
                                    height: `${Math.max(8, Math.min(64, (month.value ?? 0) * 42))}px`
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: month.value === null ? "—" : month.value.toFixed(2)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 146,
                                columnNumber: 13
                            }, this)
                        ]
                    }, month.month_number, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 143,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 141,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "legend",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                style: {
                                    background: "#23afff"
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 150,
                                columnNumber: 37
                            }, this),
                            "Actual"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 150,
                        columnNumber: 31
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                                style: {
                                    background: "#21d79b"
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 150,
                                columnNumber: 95
                            }, this),
                            "Trend"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 150,
                        columnNumber: 89
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-region.tsx",
        lineNumber: 135,
        columnNumber: 5
    }, this);
}
_c2 = SeasonalityChart;
function EdaRegion({ initialDrillRegion = null, onRegionDrillDown, onDrillBack } = {}) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedRegions, setSelectedRegions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialDrillRegion ? [
        initialDrillRegion
    ] : []);
    const [dateFrom, setDateFrom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [dateTo, setDateTo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [seasonRegion, setSeasonRegion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [drillRegion, setDrillRegion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialDrillRegion);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "EdaRegion.useEffect": ()=>{
            let cancelled = false;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/eda/region/overview", {
                regions: selectedRegions.length ? selectedRegions.join(",") : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined
            }).then({
                "EdaRegion.useEffect": (response)=>{
                    if (cancelled) return;
                    if (!isRegionData(response)) {
                        throw new Error("API Vùng đang chạy phiên bản cũ. Hãy restart backend để nạp endpoint /eda/region/overview mới.");
                    }
                    setData(response);
                    setSeasonRegion({
                        "EdaRegion.useEffect": (current)=>response.filters.regions.includes(current) ? current : response.filters.regions[0] ?? ""
                    }["EdaRegion.useEffect"]);
                    setError(null);
                    setLoading(false);
                }
            }["EdaRegion.useEffect"]).catch({
                "EdaRegion.useEffect": (reason)=>{
                    if (!cancelled) {
                        setError(reason.message);
                        setLoading(false);
                    }
                }
            }["EdaRegion.useEffect"]);
            return ({
                "EdaRegion.useEffect": ()=>{
                    cancelled = true;
                }
            })["EdaRegion.useEffect"];
        }
    }["EdaRegion.useEffect"], [
        dateFrom,
        dateTo,
        selectedRegions
    ]);
    const activeRegions = data?.filters.regions ?? [];
    const chosenSeasonality = data?.seasonality.find((item)=>item.region === seasonRegion);
    const drillBranches = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "EdaRegion.useMemo[drillBranches]": ()=>data?.branches.filter({
                "EdaRegion.useMemo[drillBranches]": (branch)=>branch.region === drillRegion
            }["EdaRegion.useMemo[drillBranches]"]) ?? []
    }["EdaRegion.useMemo[drillBranches]"], [
        data?.branches,
        drillRegion
    ]);
    function toggleRegion(region) {
        setLoading(true);
        setDrillRegion(null);
        setSelectedRegions((current)=>{
            if (!current.length) return [
                region
            ];
            if (current.includes(region)) {
                const next = current.filter((item)=>item !== region);
                return next.length ? next : [];
            }
            return [
                ...current,
                region
            ];
        });
    }
    function openRegionDrillDown(region) {
        if (onRegionDrillDown) {
            onRegionDrillDown(region);
            return;
        }
        setDrillRegion(region);
    }
    if (drillRegion) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `jsx-${regionStyles.__hash}` + " " + "region-page",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `jsx-${regionStyles.__hash}` + " " + "region-heading",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `jsx-${regionStyles.__hash}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: `jsx-${regionStyles.__hash}` + " " + "eyebrow",
                                    children: "VÙNG / CHI NHÁNH"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 229,
                                    columnNumber: 16
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: [
                                        "Chi nhánh thuộc ",
                                        drillRegion
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 229,
                                    columnNumber: 59
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: "Drill-down đã giữ nguyên khoảng thời gian đang chọn."
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 229,
                                    columnNumber: 97
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 229,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>{
                                if (onDrillBack) onDrillBack();
                                else setDrillRegion(null);
                            },
                            className: `jsx-${regionStyles.__hash}` + " " + "region-button",
                            children: "← Quay lại Vùng"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 230,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/eda-region.tsx",
                    lineNumber: 228,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                    className: `jsx-${regionStyles.__hash}` + " " + "region-panel",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${regionStyles.__hash}` + " " + "region-table-wrap",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: `jsx-${regionStyles.__hash}` + " " + "region-table",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Mã chi nhánh"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 235,
                                                columnNumber: 26
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Tên chi nhánh"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 235,
                                                columnNumber: 47
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Demand (M2)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 235,
                                                columnNumber: 69
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "SKU active"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 235,
                                                columnNumber: 89
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 235,
                                        columnNumber: 22
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 235,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: drillBranches.map((branch)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: `jsx-${regionStyles.__hash}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        className: `jsx-${regionStyles.__hash}`,
                                                        children: branch.branch_code
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                                        lineNumber: 236,
                                                        columnNumber: 86
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 82
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: branch.branch_name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 128
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(branch.gross_quantity)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 157
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(branch.active_sku_count)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 236,
                                                    columnNumber: 203
                                                }, this)
                                            ]
                                        }, branch.branch_code, true, {
                                            fileName: "[project]/src/features/eda/eda-region.tsx",
                                            lineNumber: 236,
                                            columnNumber: 53
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 236,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 234,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 233,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/features/eda/eda-region.tsx",
                    lineNumber: 232,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    id: regionStyles.__hash,
                    children: regionStyles
                }, void 0, false, void 0, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/features/eda/eda-region.tsx",
            lineNumber: 227,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `jsx-${regionStyles.__hash}` + " " + "region-page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `jsx-${regionStyles.__hash}` + " " + "region-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `jsx-${regionStyles.__hash}` + " " + "eyebrow",
                                children: "REGION DEMAND"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 248,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Phân tích Demand theo Vùng"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 248,
                                columnNumber: 54
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Sản lượng, tăng trưởng và đặc trưng nhu cầu theo vùng."
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 248,
                                columnNumber: 89
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `jsx-${regionStyles.__hash}` + " " + "as-of",
                        children: [
                            "Dữ liệu đến ",
                            data?.data_as_of_month ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(data.data_as_of_month) : "—"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 249,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 247,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: `jsx-${regionStyles.__hash}` + " " + "region-filter",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${regionStyles.__hash}` + " " + "region-filter-block",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Vùng (chọn nhiều)"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 253,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${regionStyles.__hash}` + " " + "region-chips",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            setLoading(true);
                                            setSelectedRegions([]);
                                        },
                                        className: `jsx-${regionStyles.__hash}` + " " + ((!selectedRegions.length ? "active" : "") || ""),
                                        children: "Tất cả"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 253,
                                        columnNumber: 108
                                    }, this),
                                    data?.available_regions.map((region)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>toggleRegion(region),
                                            className: `jsx-${regionStyles.__hash}` + " " + ((!selectedRegions.length || selectedRegions.includes(region) ? "active" : "") || ""),
                                            children: region
                                        }, region, false, {
                                            fileName: "[project]/src/features/eda/eda-region.tsx",
                                            lineNumber: 253,
                                            columnNumber: 300
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 253,
                                columnNumber: 78
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 253,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            "Từ ngày",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: dateFrom || data?.filters.date_from.slice(0, 10) || "",
                                onChange: (event)=>{
                                    setLoading(true);
                                    setDateFrom(event.target.value);
                                },
                                className: `jsx-${regionStyles.__hash}`
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 254,
                                columnNumber: 23
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 254,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            "Đến ngày",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "date",
                                value: dateTo || data?.filters.date_to.slice(0, 10) || "",
                                onChange: (event)=>{
                                    setLoading(true);
                                    setDateTo(event.target.value);
                                },
                                className: `jsx-${regionStyles.__hash}`
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 255,
                                columnNumber: 24
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 255,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 252,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `jsx-${regionStyles.__hash}` + " " + "error-banner",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 258,
                columnNumber: 16
            }, this) : null,
            loading && !data ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `jsx-${regionStyles.__hash}` + " " + "region-empty",
                children: "Đang tổng hợp dữ liệu theo vùng…"
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 259,
                columnNumber: 27
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: `jsx-${regionStyles.__hash}` + " " + `region-kpis ${loading ? "loading" : ""}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Tổng demand"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 262,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.gross_quantity)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 262,
                                columnNumber: 42
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "M2 gross dương"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 262,
                                columnNumber: 100
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Tăng trưởng MoM"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 263,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${regionStyles.__hash}` + " " + (growthClass(data?.kpis.mom_growth ?? null) || ""),
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(data?.kpis.mom_growth)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 263,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "So với tháng liền trước"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 263,
                                columnNumber: 156
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 263,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Tăng trưởng YoY"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 264,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${regionStyles.__hash}` + " " + (growthClass(data?.kpis.yoy_growth ?? null) || ""),
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(data?.kpis.yoy_growth)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 264,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "So cùng kỳ năm trước"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 264,
                                columnNumber: 156
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 264,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Chi nhánh trong vùng"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 265,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.branch_count)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 265,
                                columnNumber: 51
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Chi nhánh hoạt động"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 265,
                                columnNumber: 107
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "SKU active"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 266,
                                columnNumber: 18
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.kpis.active_sku_count)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 266,
                                columnNumber: 41
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "SKU gốc còn hoạt động"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 266,
                                columnNumber: 101
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 266,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 261,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: `jsx-${regionStyles.__hash}` + " " + "region-grid",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}` + " " + "region-panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: `jsx-${regionStyles.__hash}` + " " + "eyebrow",
                                                children: "DEMAND TREND"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 270,
                                                columnNumber: 61
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Xu hướng sản lượng giữa các vùng"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 270,
                                                columnNumber: 100
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 270,
                                        columnNumber: 56
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: data ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(data.filters.date_from)} → ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(data.filters.date_to)}` : "—"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 270,
                                        columnNumber: 147
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 270,
                                columnNumber: 48
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MultiRegionChart, {
                                rows: data?.monthly ?? [],
                                regions: activeRegions
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 270,
                                columnNumber: 263
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 270,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}` + " " + "region-panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: `jsx-${regionStyles.__hash}` + " " + "eyebrow",
                                            children: "CONTRIBUTION"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-region.tsx",
                                            lineNumber: 271,
                                            columnNumber: 61
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            className: `jsx-${regionStyles.__hash}`,
                                            children: "Tỷ trọng demand toàn hệ thống"
                                        }, void 0, false, {
                                            fileName: "[project]/src/features/eda/eda-region.tsx",
                                            lineNumber: 271,
                                            columnNumber: 100
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 271,
                                    columnNumber: 56
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 271,
                                columnNumber: 48
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ContributionChart, {
                                rows: data?.regions ?? [],
                                onSelect: openRegionDrillDown
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 271,
                                columnNumber: 153
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                        className: `jsx-${regionStyles.__hash}` + " " + "region-panel wide",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: `jsx-${regionStyles.__hash}` + " " + "eyebrow",
                                                children: "SEASONALITY"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 272,
                                                columnNumber: 61
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Trend và chỉ số mùa vụ"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 272,
                                                columnNumber: 99
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 272,
                                        columnNumber: 56
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: seasonRegion,
                                        onChange: (event)=>setSeasonRegion(event.target.value),
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: activeRegions.map((region)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: region
                                            }, region, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 272,
                                                columnNumber: 254
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 272,
                                        columnNumber: 136
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 272,
                                columnNumber: 48
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SeasonalityChart, {
                                item: chosenSeasonality
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 272,
                                columnNumber: 312
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 272,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 269,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                className: `jsx-${regionStyles.__hash}` + " " + "region-panel detail-table-panel",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: `jsx-${regionStyles.__hash}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `jsx-${regionStyles.__hash}` + " " + "eyebrow",
                                        children: "REGION DETAIL"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 276,
                                        columnNumber: 22
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: "Bảng chi tiết theo vùng"
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 276,
                                        columnNumber: 62
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 276,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `jsx-${regionStyles.__hash}`,
                                children: "Nhấn một vùng để drill-down chi nhánh"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                lineNumber: 276,
                                columnNumber: 100
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `jsx-${regionStyles.__hash}` + " " + "region-table-wrap",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: `jsx-${regionStyles.__hash}` + " " + "region-table",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: `jsx-${regionStyles.__hash}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Vùng"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 87
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Demand (M2)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 100
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "% tăng trưởng"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 120
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "% đóng góp"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 142
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Số chi nhánh"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 161
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "SKU active"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 182
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "ADI TB"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 201
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "CV TB"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 216
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: `jsx-${regionStyles.__hash}`,
                                                children: "Demand chủ đạo"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/eda/eda-region.tsx",
                                                lineNumber: 277,
                                                columnNumber: 230
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                        lineNumber: 277,
                                        columnNumber: 83
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 277,
                                    columnNumber: 76
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    className: `jsx-${regionStyles.__hash}`,
                                    children: data?.regions.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            onClick: ()=>openRegionDrillDown(row.region),
                                            className: `jsx-${regionStyles.__hash}`,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: `jsx-${regionStyles.__hash}`,
                                                        children: [
                                                            row.region,
                                                            " →"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                                        lineNumber: 277,
                                                        columnNumber: 374
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 370
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(row.gross_quantity)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 424
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}` + " " + (growthClass(row.growth) || ""),
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(row.growth)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 467
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(row.contribution_pct)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 539
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(row.branch_count)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 585
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(row.active_sku_count)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 626
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: metric(row.avg_adi)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 671
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: metric(row.avg_cv)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 701
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: `jsx-${regionStyles.__hash}`,
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `jsx-${regionStyles.__hash}` + " " + `demand ${row.dominant_demand.toLowerCase()}`,
                                                        children: row.dominant_demand
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/eda/eda-region.tsx",
                                                        lineNumber: 277,
                                                        columnNumber: 734
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                                    lineNumber: 277,
                                                    columnNumber: 730
                                                }, this)
                                            ]
                                        }, row.region, true, {
                                            fileName: "[project]/src/features/eda/eda-region.tsx",
                                            lineNumber: 277,
                                            columnNumber: 301
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/src/features/eda/eda-region.tsx",
                                    lineNumber: 277,
                                    columnNumber: 266
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/eda/eda-region.tsx",
                            lineNumber: 277,
                            columnNumber: 44
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-region.tsx",
                        lineNumber: 277,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-region.tsx",
                lineNumber: 275,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: regionStyles.__hash,
                children: regionStyles
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-region.tsx",
        lineNumber: 246,
        columnNumber: 5
    }, this);
}
_s(EdaRegion, "S44m6739p8lK0GLFvCRG0PfN3QE=");
_c3 = EdaRegion;
const regionStyles = `
  .region-page{display:flex;flex-direction:column;gap:16px;min-width:0}.region-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.region-heading h3{font-size:22px;margin:5px 0}.region-heading p:last-child{margin:0;color:var(--muted);font-size:12px}.as-of{color:var(--muted);font-size:11px}.region-filter{display:grid;grid-template-columns:minmax(360px,1fr) 170px 170px;gap:12px;align-items:end;background:#081725;border:1px solid var(--line);border-radius:10px;padding:13px}.region-filter label,.region-filter-block>label{display:grid;gap:6px;color:var(--muted);font-size:10px;font-weight:700}.region-filter input,.region-panel select{width:100%;background:#0d1d2c;color:var(--text);border:1px solid var(--line);border-radius:7px;padding:9px}.region-chips{display:flex;flex-wrap:wrap;gap:6px}.region-chips button,.region-button{border:1px solid var(--line);border-radius:999px;background:#102536;color:#9db4c4;padding:7px 10px;font-size:11px}.region-chips button.active{border-color:#168b72;background:#0c4035;color:#52e5ba}.region-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;transition:opacity .2s}.region-kpis.loading{opacity:.55}.region-kpis article{padding:14px;background:linear-gradient(145deg,#0d2030,#091722);border:1px solid var(--line);border-radius:9px}.region-kpis span{display:block;color:var(--muted);font-size:10px}.region-kpis strong{display:block;margin-top:7px;font-size:20px}.region-kpis small{display:block;margin-top:5px;color:#86a3b7;font-size:9px}.positive{color:var(--green)!important}.negative{color:var(--red)!important}.neutral{color:var(--muted)!important}.region-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(320px,1fr);gap:12px}.region-panel{min-width:0;padding:15px;background:#081725;border:1px solid var(--line);border-radius:10px;overflow:hidden}.region-panel.wide{grid-column:1/-1}.region-panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.region-panel h4{margin:4px 0 0;font-size:14px}.region-panel header>span{color:var(--muted);font-size:10px}.chart-shell{min-width:0;overflow:hidden}.chart-shell svg{display:block;width:100%;height:auto}.region-grid-line{stroke:#1d3547;stroke-width:1}.legend{display:flex;flex-wrap:wrap;justify-content:center;gap:13px;margin-top:9px;color:var(--muted);font-size:10px}.legend span{display:inline-flex;align-items:center;gap:5px}.legend i{width:8px;height:8px;border-radius:50%}.contribution-list{display:grid;gap:11px}.contribution-row{display:grid;grid-template-columns:110px 1fr 48px;align-items:center;gap:8px;padding:0;border:0;background:transparent;color:var(--text);text-align:left}.contribution-row>span{display:flex;align-items:center;gap:6px;overflow:hidden;text-overflow:ellipsis}.contribution-row i{width:7px;height:7px;border-radius:50%;flex:none}.contribution-track{height:8px;border-radius:999px;background:#142b3c;overflow:hidden}.contribution-track b{display:block;height:100%;border-radius:inherit}.contribution-row strong{font-size:10px;text-align:right}.season-index{height:90px;display:grid;grid-template-columns:repeat(12,1fr);gap:6px;align-items:end;margin-top:5px}.season-index>div{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px}.season-index span,.season-index small{font-size:8px;color:var(--muted)}.season-index b{width:min(28px,80%);border-radius:3px 3px 0 0}.season-index b.high{background:var(--green)}.season-index b.low{background:var(--blue)}.region-table-wrap{overflow:auto}.region-table{width:100%;min-width:1060px;border-collapse:collapse}.region-table th,.region-table td{padding:11px 10px;border-bottom:1px solid var(--line);font-size:11px;white-space:nowrap;text-align:right}.region-table th{color:#9fb5c5;font-size:9px;text-transform:uppercase}.region-table th:first-child,.region-table td:first-child,.region-table th:nth-child(2),.region-table td:nth-child(2){text-align:left}.region-table tbody tr{cursor:pointer}.region-table tbody tr:hover{background:#10293b}.region-table td button{padding:0;border:0;background:transparent;color:var(--cyan);font-weight:800}.demand{display:inline-flex;padding:4px 7px;border-radius:4px;background:#163148;color:#a9d8f1;font-size:9px}.demand.smooth{background:#0c4035;color:#52e5ba}.demand.erratic{background:#4a3410;color:#ffd36d}.demand.intermittent,.demand.lumpy{background:#431721;color:#ff8798}.region-empty{padding:35px;color:var(--muted);text-align:center}.region-button{border-radius:7px}.chart-axis{display:flex;justify-content:space-between;color:var(--muted);font-size:9px}.chart-axis strong{color:#cce1ee}@media(max-width:1100px){.region-kpis{grid-template-columns:repeat(2,1fr)}.region-grid{grid-template-columns:1fr}.region-filter{grid-template-columns:1fr 1fr}.region-filter-block{grid-column:1/-1}}@media(max-width:700px){.region-heading{align-items:flex-start;flex-direction:column}.region-filter,.region-kpis{grid-template-columns:1fr}.region-filter-block{grid-column:auto}.season-index{gap:2px}}
`;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "MultiRegionChart");
__turbopack_context__.k.register(_c1, "ContributionChart");
__turbopack_context__.k.register(_c2, "SeasonalityChart");
__turbopack_context__.k.register(_c3, "EdaRegion");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-brand.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaBrand",
    ()=>EdaBrand
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function EdaBrand({ branchCode }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "panel-title",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "eyebrow",
                            children: "THƯƠNG HIỆU"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-brand.tsx",
                            lineNumber: 8,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            children: "Phân tích Thương hiệu"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-brand.tsx",
                            lineNumber: 9,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/eda-brand.tsx",
                    lineNumber: 7,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-brand.tsx",
                lineNumber: 6,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "empty",
                children: "Nội dung Thương hiệu (Sắp ra mắt)"
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-brand.tsx",
                lineNumber: 12,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-brand.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
_c = EdaBrand;
var _c;
__turbopack_context__.k.register(_c, "EdaBrand");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/eda/eda-module.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EdaModule",
    ()=>EdaModule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$overview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-overview.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$sku$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-sku.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$branch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-branch.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$branch$2d$sku$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-branch-sku.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$region$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-region.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$brand$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-brand.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function EdaModule(props) {
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("overview");
    const [regionDrilldown, setRegionDrilldown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const sidebarItems = [
        {
            id: "overview",
            label: "Tổng quan"
        },
        {
            id: "sku",
            label: "SKU"
        },
        {
            id: "branch",
            label: "Chi nhánh"
        },
        {
            id: "branch_sku",
            label: "SKU × Chi nhánh"
        },
        {
            id: "region",
            label: "Vùng"
        },
        {
            id: "brand",
            label: "Thương hiệu"
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "module",
        style: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "module-heading",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "eyebrow",
                            children: "MODULE 02"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-module.tsx",
                            lineNumber: 29,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: "EDA chuyên sâu"
                        }, void 0, false, {
                            fileName: "[project]/src/features/eda/eda-module.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/features/eda/eda-module.tsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/eda/eda-module.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    display: 'flex',
                    gap: '32px',
                    marginTop: '24px',
                    flexGrow: 1
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        style: {
                            width: '220px',
                            flexShrink: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            borderRight: '1px solid var(--border-color, #eaeaea)',
                            paddingRight: '16px'
                        },
                        children: sidebarItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setRegionDrilldown(null);
                                    setActiveTab(item.id);
                                },
                                style: {
                                    textAlign: 'left',
                                    padding: '10px 16px',
                                    background: activeTab === item.id ? 'var(--bg-accent, #f4f4f5)' : 'transparent',
                                    color: activeTab === item.id ? 'var(--fg-primary, #09090b)' : 'var(--fg-muted, #71717a)',
                                    fontWeight: activeTab === item.id ? 500 : 400,
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '14px'
                                },
                                children: item.label
                            }, item.id, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 37,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/features/eda/eda-module.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            flexGrow: 1,
                            minWidth: 0
                        },
                        children: [
                            activeTab === 'overview' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$overview$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaOverview"], {
                                branches: props.branches,
                                branchCode: "__ALL__",
                                onBranchChange: props.onBranchChange
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 59,
                                columnNumber: 40
                            }, this),
                            activeTab === 'sku' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$sku$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaSku"], {
                                branchCode: "__ALL__"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 60,
                                columnNumber: 35
                            }, this),
                            activeTab === 'branch' && (regionDrilldown ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$region$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaRegion"], {
                                initialDrillRegion: regionDrilldown,
                                onDrillBack: ()=>{
                                    setRegionDrilldown(null);
                                    setActiveTab('region');
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 62,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$branch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaBranch"], {
                                branchCode: "__ALL__"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 63,
                                columnNumber: 15
                            }, this)),
                            activeTab === 'branch_sku' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$branch$2d$sku$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaBranchSku"], {
                                branchCode: "__ALL__"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 64,
                                columnNumber: 42
                            }, this),
                            activeTab === 'region' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$region$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaRegion"], {
                                onRegionDrillDown: (region)=>{
                                    setRegionDrilldown(region);
                                    setActiveTab('branch');
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 65,
                                columnNumber: 38
                            }, this),
                            activeTab === 'brand' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$brand$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaBrand"], {
                                branchCode: "__ALL__"
                            }, void 0, false, {
                                fileName: "[project]/src/features/eda/eda-module.tsx",
                                lineNumber: 66,
                                columnNumber: 37
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/eda/eda-module.tsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/eda/eda-module.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/eda/eda-module.tsx",
        lineNumber: 26,
        columnNumber: 5
    }, this);
}
_s(EdaModule, "pmy+r5d/6CSYO3GrNiFKoZ+HSXg=");
_c = EdaModule;
var _c;
__turbopack_context__.k.register(_c, "EdaModule");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/features/forecast/forecast-module.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ForecastModule",
    ()=>ForecastModule
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/format.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ForecastModule({ branches, branchCode, onBranchChange }) {
    _s();
    const effectiveBranch = branchCode === "__ALL__" ? branches[0]?.branch_code : branchCode;
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ForecastModule.useEffect": ()=>{
            if (!effectiveBranch) return;
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/forecast/matrix", {
                branch_code: effectiveBranch,
                limit: 30,
                horizon: 3
            }).then(setData).catch({
                "ForecastModule.useEffect": (reason)=>setError(reason.message)
            }["ForecastModule.useEffect"]);
        }
    }["ForecastModule.useEffect"], [
        effectiveBranch
    ]);
    const months = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ForecastModule.useMemo[months]": ()=>data?.rows[0]?.cells.map({
                "ForecastModule.useMemo[months]": (cell)=>({
                        month: cell.month,
                        period_type: cell.period_type
                    })
            }["ForecastModule.useMemo[months]"]) ?? []
    }["ForecastModule.useMemo[months]"], [
        data
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "module forecast-module",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "module-heading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "eyebrow",
                                children: "MODULE 03"
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 23,
                                columnNumber: 44
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: "Forecast theo chi nhánh"
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 23,
                                columnNumber: 80
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "subtitle",
                                children: "Baseline thống kê được chọn bằng rolling backtest, không dùng dữ liệu tương lai."
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 23,
                                columnNumber: 112
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 23,
                        columnNumber: 39
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: effectiveBranch ?? "",
                        onChange: (event)=>onBranchChange(event.target.value),
                        children: branches.map((branch)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: branch.branch_code,
                                children: [
                                    branch.branch_code,
                                    " · ",
                                    branch.branch_name
                                ]
                            }, branch.branch_code, true, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 23,
                                columnNumber: 347
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 23,
                        columnNumber: 226
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "error-banner",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                lineNumber: 24,
                columnNumber: 16
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "forecast-summary",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Chi nhánh"
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 46
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: data?.branch?.branch_name ?? "Đang tải..."
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 68
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 25,
                        columnNumber: 41
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Tổng FC quá khứ"
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 140
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.metrics.forecast_total)
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 168
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 25,
                        columnNumber: 135
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Tổng TT quá khứ"
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 240
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(data?.metrics.actual_total)
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 268
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 25,
                        columnNumber: 235
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "WAPE"
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 338
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(data?.metrics.wape)
                            }, void 0, false, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 25,
                                columnNumber: 355
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 25,
                        columnNumber: 333
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "table-card forecast-card",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "table-scroll",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "data-table forecast-table",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                rowSpan: 2,
                                                children: "Chi nhánh / SKU gốc"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                lineNumber: 26,
                                                columnNumber: 135
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                rowSpan: 2,
                                                children: "Method"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                lineNumber: 26,
                                                columnNumber: 175
                                            }, this),
                                            months.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    colSpan: item.period_type === "past" ? 3 : 2,
                                                    className: item.period_type,
                                                    children: [
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatMonth"])(item.month),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: item.period_type === "past" ? "QUÁ KHỨ" : "TƯƠNG LAI"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 26,
                                                            columnNumber: 345
                                                        }, this)
                                                    ]
                                                }, item.month, true, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 224
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                        lineNumber: 26,
                                        columnNumber: 131
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: months.flatMap((item)=>item.period_type === "past" ? [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    children: "FC"
                                                }, `${item.month}-fc`, false, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 488
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    children: "TT"
                                                }, `${item.month}-tt`, false, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 525
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    children: "Acc"
                                                }, `${item.month}-acc`, false, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 562
                                                }, this)
                                            ] : [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    children: "FC"
                                                }, `${item.month}-fc`, false, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 605
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    children: "Khoảng"
                                                }, `${item.month}-pi`, false, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 26,
                                                    columnNumber: 642
                                                }, this)
                                            ])
                                    }, void 0, false, {
                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                        lineNumber: 26,
                                        columnNumber: 427
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 26,
                                columnNumber: 124
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "group-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: data?.branch?.branch_name
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 39
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: [
                                                            data?.rows.length ?? 0,
                                                            " SKU top sản lượng"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 83
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                lineNumber: 27,
                                                columnNumber: 35
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                children: "Auto"
                                            }, void 0, false, {
                                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                lineNumber: 27,
                                                columnNumber: 145
                                            }, this),
                                            months.flatMap((item)=>item.period_type === "past" ? [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        children: "—"
                                                    }, `${item.month}-a`, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 215
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        children: "—"
                                                    }, `${item.month}-b`, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 250
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(data?.metrics.wape === null || data?.metrics.wape === undefined ? null : Math.max(0, 1 - data.metrics.wape))
                                                    }, `${item.month}-c`, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 285
                                                    }, this)
                                                ] : [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        children: "—"
                                                    }, `${item.month}-d`, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 447
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        children: "—"
                                                    }, `${item.month}-e`, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 27,
                                                        columnNumber: 482
                                                    }, this)
                                                ])
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                        lineNumber: 27,
                                        columnNumber: 9
                                    }, this),
                                    data?.rows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "item-cell",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            className: row.status === "inactive" ? "inactive-name" : "",
                                                            children: row.base_sku
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 83
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: row.sku_name
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 175
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 28,
                                                    columnNumber: 57
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "method-pill",
                                                        children: row.method.replaceAll("_", " ")
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                        lineNumber: 28,
                                                        columnNumber: 211
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                    lineNumber: 28,
                                                    columnNumber: 207
                                                }, this),
                                                row.cells.flatMap((cell)=>cell.period_type === "past" ? [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(cell.forecast)
                                                        }, `${cell.month}-fc`, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 346
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(cell.actual)
                                                        }, `${cell.month}-tt`, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 410
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: `accuracy ${(cell.accuracy ?? 0) >= .8 ? "good" : (cell.accuracy ?? 0) >= .5 ? "warn" : "bad"}`,
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPercent"])(cell.accuracy)
                                                        }, `${cell.month}-acc`, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 472
                                                        }, this)
                                                    ] : [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(cell.forecast)
                                                        }, `${cell.month}-fc`, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 650
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                            className: "interval",
                                                            children: cell.lower === null ? "—" : `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(cell.lower)}–${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNumber"])(cell.upper)}`
                                                        }, `${cell.month}-pi`, false, {
                                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                                            lineNumber: 28,
                                                            columnNumber: 714
                                                        }, this)
                                                    ])
                                            ]
                                        }, row.base_sku, true, {
                                            fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                            lineNumber: 28,
                                            columnNumber: 34
                                        }, this))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                                lineNumber: 26,
                                columnNumber: 698
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/forecast/forecast-module.tsx",
                        lineNumber: 26,
                        columnNumber: 79
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/features/forecast/forecast-module.tsx",
                    lineNumber: 26,
                    columnNumber: 49
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "footnote",
                children: "Acc chỉ hiển thị khi TT > 0. Hàng tổng sử dụng WAPE; không lấy trung bình Acc của từng ô. Missing giữ là “—”."
            }, void 0, false, {
                fileName: "[project]/src/features/forecast/forecast-module.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/forecast/forecast-module.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(ForecastModule, "D3ps6o3KIrsqYgyas163hxc9VJo=");
_c = ForecastModule;
var _c;
__turbopack_context__.k.register(_c, "ForecastModule");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/dashboard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dashboard",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$items$2f$items$2d$module$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/items/items-module.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$module$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/eda/eda-module.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$forecast$2f$forecast$2d$module$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/forecast/forecast-module.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function Dashboard() {
    _s();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("items");
    const [branches, setBranches] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [branchCode, setBranchCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("__ALL__");
    const [dataAsOf, setDataAsOf] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiGet"])("/metadata/branches").then({
                "Dashboard.useEffect": (response)=>{
                    setBranches(response.items);
                    setDataAsOf(response.data_as_of_month);
                }
            }["Dashboard.useEffect"]).catch({
                "Dashboard.useEffect": (reason)=>setError(reason.message)
            }["Dashboard.useEffect"]);
        }
    }["Dashboard.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "app-shell",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "topbar",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "eyebrow",
                                children: "UNIS DATA WORKSPACE"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard.tsx",
                                lineNumber: 32,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                children: "SKU Analytics & Forecast"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard.tsx",
                                lineNumber: 33,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "freshness",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "live-dot"
                            }, void 0, false, {
                                fileName: "[project]/src/components/dashboard.tsx",
                                lineNumber: 35,
                                columnNumber: 36
                            }, this),
                            " Dữ liệu đến ",
                            dataAsOf ? dataAsOf.slice(0, 7) : "—"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/dashboard.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "tabs",
                "aria-label": "Modules",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: tab === "items" ? "active" : "",
                        onClick: ()=>setTab("items"),
                        children: "01 · SKU Explorer"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: tab === "eda" ? "active" : "",
                        onClick: ()=>setTab("eda"),
                        children: "02 · EDA chuyên sâu"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: tab === "forecast" ? "active" : "",
                        onClick: ()=>setTab("forecast"),
                        children: "03 · Forecast"
                    }, void 0, false, {
                        fileName: "[project]/src/components/dashboard.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "error-banner",
                children: [
                    "Không kết nối được API: ",
                    error
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/dashboard.tsx",
                lineNumber: 44,
                columnNumber: 16
            }, this) : null,
            tab === "items" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$items$2f$items$2d$module$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ItemsModule"], {
                branches: branches,
                branchCode: branchCode,
                onBranchChange: setBranchCode
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard.tsx",
                lineNumber: 45,
                columnNumber: 26
            }, this) : null,
            tab === "eda" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$eda$2f$eda$2d$module$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EdaModule"], {
                branches: branches,
                branchCode: branchCode,
                onBranchChange: setBranchCode
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard.tsx",
                lineNumber: 46,
                columnNumber: 24
            }, this) : null,
            tab === "forecast" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$forecast$2f$forecast$2d$module$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ForecastModule"], {
                branches: branches,
                branchCode: branchCode,
                onBranchChange: setBranchCode
            }, void 0, false, {
                fileName: "[project]/src/components/dashboard.tsx",
                lineNumber: 47,
                columnNumber: 29
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/dashboard.tsx",
        lineNumber: 29,
        columnNumber: 5
    }, this);
}
_s(Dashboard, "B99VaFHa42kMEhAUvUCp/BSgPOQ=");
_c = Dashboard;
var _c;
__turbopack_context__.k.register(_c, "Dashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1g8mp9c._.js.map