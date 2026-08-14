sed -i 's/import { ExecutiveSummaryWidget } from ".\/ExecutiveSummaryWidget";//g' src/components/Dashboard.tsx
sed -i 's/import { AnomalyBadge } from ".\/AnomalyBadge";//g' src/components/Dashboard.tsx
sed -i '3i import { ExecutiveSummaryWidget } from "./ExecutiveSummaryWidget";\nimport { AnomalyBadge } from "./AnomalyBadge";' src/components/Dashboard.tsx
