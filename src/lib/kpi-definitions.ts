import { LucideIcon, TrendingUp, Users, DollarSign, Activity, Flag, Video, Award, Smile, CheckCircle, BarChart3, PieChart, Map, HelpCircle, Package, FolderGit2 } from "lucide-react";

export type KPICategory =
    | "General"
    | "Sales"
    | "Community"
    | "Marketing"
    | "People"
    | "Helpdesk"
    | "Production";

export type VisualizationType =
    | "Counter"           // Big Number
    | "AreaChart"         // Smooth trend
    | "LineChart"         // Standard Line
    | "Sparkline"         // Number + Mini Chart
    | "BarChart"          // Simple Bars
    | "GroupedBar"        // Dual Bars
    | "Donut"             // Pie/Donut
    | "Radar"             // Radar/Spider
    | "Leaderboard"       // Table/List
    | "Gauge"             // Semi-circle percentage
    | "Progress"          // Linear Progress
    | "Kanban"            // Status Board (Simulated)
    | "Grid"              // Data Grid
    | "Map";              // Europe Bubble Map

export interface KPIInput {
    id: string;
    label: string;
    type: "number" | "text" | "date" | "array" | "object_array";
    placeholder?: string;
    helperText?: string;
}

export interface KPIDefinition {
    id: string;
    title: string;
    category: KPICategory;
    visualization: VisualizationType;
    lineNames?: string[];
    description?: string;
    icon?: any; // LucideIcon
    inputs: KPIInput[];
    defaultData?: any;
}

export const KPI_LIST: KPIDefinition[] = [
    // --- GENERAL (7 items) ---
    {
        id: "gen_csat",
        title: "Customer Satisfaction",
        category: "General",
        visualization: "AreaChart",
        description: "Trend stability (0-10)",
        inputs: [{ id: "data", label: "Monthly Scores (0-10)", type: "array", placeholder: "8.5, 9.0" }]
    },
    {
        id: "gen_celebrations",
        title: "Celebrations",
        category: "General",
        visualization: "BarChart",
        description: "Events per month",
        inputs: [{ id: "data", label: "Event Count", type: "array", placeholder: "2, 0, 3" }]
    },
    {
        id: "gen_revenue",
        title: "Revenues (€)",
        category: "General",
        visualization: "AreaChart",
        description: "Volume (Green)",
        inputs: [{ id: "data", label: "Revenue (€)", type: "array", placeholder: "50000, 52000" }]
    },
    {
        id: "gen_costs",
        title: "Costs (€)",
        category: "General",
        visualization: "AreaChart",
        description: "Volume (Red)",
        inputs: [{ id: "data", label: "Costs (€)", type: "array", placeholder: "20000, 21000" }]
    },
    {
        id: "gen_customers",
        title: "Total Customers",
        category: "General",
        visualization: "LineChart",
        description: "Growth trend",
        inputs: [{ id: "data", label: "Customer Count", type: "array", placeholder: "100, 105" }]
    },
    {
        id: "gen_licenses",
        title: "Total Licenses",
        category: "General",
        visualization: "LineChart",
        inputs: [{ id: "data", label: "License Count", type: "array", placeholder: "500, 520" }]
    },
    {
        id: "gen_employees",
        title: "Employees",
        category: "General",
        visualization: "LineChart", // Step line represented as Line
        inputs: [{ id: "data", label: "Headcount", type: "array", placeholder: "25, 25, 26" }]
    },

    // --- SALES (5 items) ---
    {
        id: "sales_rfi",
        title: "Number of RFIs",
        category: "Sales",
        visualization: "Sparkline",
        inputs: [
            { id: "current", label: "Current Total", type: "number", placeholder: "15" },
            { id: "trend", label: "History (Last 12)", type: "array", placeholder: "10, 12, 14" }
        ]
    },
    {
        id: "sales_quotes",
        title: "Quote Requests",
        category: "Sales",
        visualization: "Sparkline",
        inputs: [
            { id: "current", label: "Current Total", type: "number", placeholder: "24" },
            { id: "trend", label: "History (Last 12)", type: "array", placeholder: "18, 20" }
        ]
    },
    {
        id: "sales_winloss",
        title: "Win vs Loss",
        category: "Sales",
        visualization: "Donut",
        inputs: [
            { id: "wins", label: "Wins", type: "number", placeholder: "12" },
            { id: "losses", label: "Losses", type: "number", placeholder: "3" }
        ]
    },
    {
        id: "sales_geo",
        title: "Distribution (NL/BE/DE)",
        category: "Sales",
        visualization: "Map", // Changed from Donut
        inputs: [
            { id: "nl", label: "Netherlands", type: "number", placeholder: "60" },
            { id: "be", label: "Belgium", type: "number", placeholder: "30" },
            { id: "de", label: "Germany", type: "number", placeholder: "10" }
        ]
    },
    {
        id: "sales_licenses_mo",
        title: "Licenses (Monthly)",
        category: "Sales",
        visualization: "BarChart",
        inputs: [{ id: "data", label: "Licenses Sold", type: "array", placeholder: "5, 8, 12" }]
    },
    {
        id: "comm_demos", // Kept ID to preserve data linkage
        title: "Product Demos",
        category: "Sales", // Moved to Sales
        visualization: "Radar",
        inputs: [
            { id: "design", label: "Design", type: "number", placeholder: "10" },
            { id: "support", label: "Support", type: "number", placeholder: "8" },
            { id: "data", label: "Data", type: "number", placeholder: "15" },
            { id: "perform", label: "Perform", type: "number", placeholder: "12" }
        ]
    },

    // --- COMMUNITY (8 items) ---
    {
        id: "comm_upsell",
        title: "Upsells vs Resells",
        category: "Community",
        visualization: "GroupedBar",
        inputs: [
            { id: "upsell", label: "Upsell Volume", type: "number", placeholder: "5000" },
            { id: "resell", label: "Resell Volume", type: "number", placeholder: "2000" }
        ]
    },
    {
        id: "comm_engagement",
        title: "Community Engagement",
        category: "Community",
        visualization: "GroupedBar",
        description: "Events vs Participants",
        inputs: [
            // MOOCs
            { id: "mooc_c", label: "MOOCs: Events", type: "number", placeholder: "4" },
            { id: "mooc_p", label: "MOOCs: People", type: "number", placeholder: "150" },
            // Webinars
            { id: "web_c", label: "Webinars: Events", type: "number", placeholder: "2" },
            { id: "web_p", label: "Webinars: People", type: "number", placeholder: "300" },
            // Communities
            { id: "com_c", label: "Communities: Active", type: "number", placeholder: "5" },
            { id: "com_p", label: "Communities: Members", type: "number", placeholder: "500" },
            // Guest Lectures
            { id: "guest_c", label: "Lectures: Count", type: "number", placeholder: "3" },
            { id: "guest_p", label: "Lectures: Attendees", type: "number", placeholder: "100" }
        ]
    },
    {
        id: "comm_top10",
        title: "Top 10 Customers",
        category: "Community",
        visualization: "Leaderboard",
        inputs: [{ id: "data", label: "Name: Value (comma sep)", type: "text", placeholder: "Client A: 500, Client B: 400" }]
    },
    {
        id: "comm_visits",
        title: "Customer Visits",
        category: "Community",
        visualization: "BarChart",
        inputs: [{ id: "data", label: "Visits per Month", type: "array", placeholder: "5, 8, 12" }]
    },

    {
        id: "comm_day",
        title: "Customer Day",
        category: "Community",
        visualization: "Counter",
        inputs: [{ id: "count", label: "Participants", type: "number", placeholder: "200" }]
    },
    {
        id: "comm_hatsoff",
        title: "Hats Off Award",
        category: "Community",
        visualization: "Counter",
        description: "Name of Winner",
        inputs: [{ id: "winner", label: "Winner Name", type: "text", placeholder: "John Doe" }]
    },
    {
        id: "comm_sme",
        title: "SMEs Involved",
        category: "Community",
        visualization: "Counter",
        inputs: [{ id: "count", label: "Count", type: "number", placeholder: "12" }]
    },

    // --- MARKETING (6 items) ---
    {
        id: "mkt_coffee",
        title: "Coffee Breaks",
        category: "Marketing",
        visualization: "Counter",
        inputs: [{ id: "count", label: "Total Scheduled", type: "number", placeholder: "45" }]
    },
    {
        id: "mkt_linkedin_combined",
        title: "LinkedIn Performance",
        category: "Marketing",
        visualization: "LineChart", // Will update KPICard to support dual lines
        lineNames: ["Posts", "Engagement"],
        description: "Posts (L) vs Engagement (R)",
        inputs: [
            { id: "posts", label: "Posts Count", type: "array", placeholder: "4, 5, 8" },
            { id: "engage", label: "Engagement", type: "array", placeholder: "120, 150, 200" }
        ]
    },
    {
        id: "mkt_events",
        title: "Events Attended",
        category: "Marketing",
        visualization: "BarChart",
        inputs: [{ id: "data", label: "Events per Month", type: "array", placeholder: "1, 2, 1" }]
    },
    {
        id: "mkt_blogs",
        title: "Blogs/Articles",
        category: "Marketing",
        visualization: "BarChart",
        inputs: [{ id: "data", label: "Articles Published", type: "array", placeholder: "2, 3, 2" }]
    },
    {
        id: "mkt_awards",
        title: "Awards Won",
        category: "Marketing",
        visualization: "Leaderboard",
        inputs: [{ id: "data", label: "Awards (Name:Year)", type: "text", placeholder: "Innovator: 2024" }]
    },

    // --- PEOPLE (5 items) ---
    {
        id: "ppl_sat",
        title: "Employee Satisfaction",
        category: "People",
        visualization: "Gauge",
        inputs: [{ id: "score", label: "Score (0-100)", type: "number", placeholder: "85" }]
    },
    {
        id: "ppl_impl",
        title: "Implementations",
        category: "People",
        visualization: "BarChart",
        inputs: [{ id: "data", label: "Projects per Month", type: "array", placeholder: "2, 4, 3" }]
    },
    {
        id: "ppl_billability",
        title: "Billability",
        category: "People",
        visualization: "Gauge",
        inputs: [{ id: "score", label: "Percentage %", type: "number", placeholder: "80" }]
    },
    {
        id: "ppl_4cid",
        title: "4CI/D Adoption",
        category: "People",
        visualization: "Progress",
        inputs: [{ id: "progress", label: "Progress %", type: "number", placeholder: "60" }]
    },
    {
        id: "ppl_hpa",
        title: "HPA Adoption",
        category: "People",
        visualization: "Progress",
        inputs: [{ id: "progress", label: "Progress %", type: "number", placeholder: "40" }]
    },

    // --- HELPDESK (3 items) ---
    {
        id: "help_tickets",
        title: "Tickets Volume",
        category: "Helpdesk",
        visualization: "AreaChart",
        inputs: [{ id: "data", label: "Tickets per Month", type: "array", placeholder: "50, 60, 55" }]
    },
    {
        id: "help_sla",
        title: "SLA Compliance",
        category: "Helpdesk",
        visualization: "Donut",
        inputs: [
            { id: "in", label: "Within SLA", type: "number", placeholder: "90" },
            { id: "out", label: "Outside SLA", type: "number", placeholder: "10" }
        ]
    },
    {
        id: "help_bugs",
        title: "Bug Reports",
        category: "Helpdesk",
        visualization: "LineChart",
        description: "Red Trend",
        inputs: [{ id: "data", label: "Bugs per Month", type: "array", placeholder: "5, 2, 4" }]
    },

    // --- PRODUCTION (4 items) ---
    {
        id: "prod_list",
        title: "Product List",
        category: "Production",
        visualization: "Leaderboard", // List view
        inputs: [{ id: "data", label: "Products (Name:Status)", type: "text", placeholder: "App: Active" }]
    },
    {
        id: "prod_status",
        title: "Product Progress",
        category: "Production",
        visualization: "Kanban",
        inputs: [
            { id: "start", label: "Not Started", type: "number", placeholder: "5" },
            { id: "in_progress", label: "In Progress", type: "number", placeholder: "3" },
            { id: "done", label: "Finished", type: "number", placeholder: "8" }
        ]
    },
    {
        id: "prod_iso",
        title: "ISO Progress",
        category: "Production",
        visualization: "Progress",
        inputs: [{ id: "progress", label: "Compliance %", type: "number", placeholder: "70" }]
    },
    {
        id: "prod_volume",
        title: "Sales Volume / Users",
        category: "Production",
        visualization: "Leaderboard",
        inputs: [{ id: "data", label: "Product: Users", type: "text", placeholder: "Platform A: 1000" }]
    },
];
