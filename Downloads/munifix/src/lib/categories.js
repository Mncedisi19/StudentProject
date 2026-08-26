// Smart authority routing: every complaint category maps to exactly one
// municipal department, plus a default priority and response window.
// This is what "Smart Authority & Geolocation Routing" (spec 3B) uses to
// auto-assign new complaints before any human touches them.

const CATEGORIES = {
  WATER: {
    label: "Water & Sanitation",
    department: "Water & Sanitation",
    keywords: ["water", "leak", "pipe", "burst", "sewage", "sewer", "drain", "tap", "flood"],
    defaultPriority: "HIGH",
    deadlineHours: 24,
  },
  ROADS: {
    label: "Roads & Stormwater",
    department: "Roads & Stormwater",
    keywords: ["pothole", "road", "tar", "sidewalk", "pavement", "stormwater", "bridge", "sinkhole"],
    defaultPriority: "MEDIUM",
    deadlineHours: 72,
  },
  ELECTRICITY: {
    label: "Electricity",
    department: "Electricity",
    keywords: ["power", "electric", "outage", "cable", "transformer", "streetlight", "light", "pole", "sparking"],
    defaultPriority: "HIGH",
    deadlineHours: 12,
  },
  WASTE: {
    label: "Waste Management",
    department: "Waste Management",
    keywords: ["waste", "rubbish", "trash", "garbage", "bin", "dump", "illegal dumping", "litter"],
    defaultPriority: "MEDIUM",
    deadlineHours: 48,
  },
  PARKS: {
    label: "Parks & Public Spaces",
    department: "Parks & Recreation",
    keywords: ["park", "tree", "playground", "grass", "field", "public space"],
    defaultPriority: "LOW",
    deadlineHours: 96,
  },
  SAFETY: {
    label: "Public Safety & Hazards",
    department: "Disaster & Risk Management",
    keywords: ["fire", "hazard", "danger", "collapse", "gas", "unsafe", "exposed wire", "manhole"],
    defaultPriority: "CRITICAL",
    deadlineHours: 6,
  },
  OTHER: {
    label: "Other / General",
    department: "General Services",
    keywords: [],
    defaultPriority: "LOW",
    deadlineHours: 96,
  },
};

const CATEGORY_KEYS = Object.keys(CATEGORIES);

function getCategoryMeta(category) {
  return CATEGORIES[category] || CATEGORIES.OTHER;
}

function departmentFor(category) {
  return getCategoryMeta(category).department;
}

function deadlineHoursFor(category, priority) {
  const base = getCategoryMeta(category).deadlineHours;
  // Escalated priority tightens the response window.
  if (priority === "CRITICAL") return Math.min(base, 6);
  if (priority === "HIGH") return Math.min(base, 24);
  return base;
}

module.exports = { CATEGORIES, CATEGORY_KEYS, getCategoryMeta, departmentFor, deadlineHoursFor };
