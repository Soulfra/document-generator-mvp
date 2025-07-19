declare const router: import("express-serve-static-core").Router;
export interface ServiceOffering {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    estimatedTime?: string;
    category?: string;
    confidence?: number;
}
export interface Bundle {
    id: string;
    name: string;
    description: string;
    services: string[];
    price: number;
    savings: number;
}
export default router;
//# sourceMappingURL=dashboard.route.d.ts.map