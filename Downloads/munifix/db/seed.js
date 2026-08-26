// Run with: npm run seed
// Wipes and repopulates the SQLite DB with a demo resident, a demo
// municipal admin, and 5+ complaints spanning every status so the app is
// instantly testable end to end.

const db = require("./index");
const { hashPassword } = require("../src/lib/auth");
const { newId } = require("../src/lib/ids");
const { departmentFor, deadlineHoursFor } = require("../src/lib/categories");

async function main() {
  console.log("Seeding MuniFix database…");

  db.exec(`
    DELETE FROM complaint_events;
    DELETE FROM metoo_votes;
    DELETE FROM emergency_logs;
    DELETE FROM complaints;
    DELETE FROM users;
  `);

  const password_hash = await hashPassword("password123");

  const resident = {
    id: newId("usr"),
    name: "Thabo Mokoena",
    email: "thabo@example.com",
    role: "RESIDENT",
    phone: "+27 82 555 0101",
  };
  const resident2 = {
    id: newId("usr"),
    name: "Lindiwe Nkosi",
    email: "lindiwe@example.com",
    role: "RESIDENT",
    phone: "+27 83 555 0199",
  };
  const admin = {
    id: newId("usr"),
    name: "Sipho Dlamini",
    email: "admin@munifix.gov",
    role: "MUNICIPAL_ADMIN",
    phone: "+27 15 555 0000",
    department: "General Services",
  };

  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, password_hash, role, phone, department) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertUser.run(resident.id, resident.name, resident.email, password_hash, resident.role, resident.phone, null);
  insertUser.run(resident2.id, resident2.name, resident2.email, password_hash, resident2.role, resident2.phone, null);
  insertUser.run(admin.id, admin.name, admin.email, password_hash, admin.role, admin.phone, admin.department);

  // Polokwane, Limpopo area coordinates for a realistic-looking local map.
  const CENTER = { lat: -23.9045, lng: 29.4689 };
  const jitter = (n = 0.02) => (Math.random() - 0.5) * n;

  const insertComplaint = db.prepare(
    `INSERT INTO complaints
      (id, user_id, title, description, category, latitude, longitude, address, photo_url,
       status, priority, assigned_department, assigned_team, internal_notes,
       resolution_proof_url, resolution_note, is_overdue, response_deadline, rejection_reason,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertEvent = db.prepare(
    `INSERT INTO complaint_events (id, complaint_id, actor_id, event_type, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertVote = db.prepare(
    `INSERT INTO metoo_votes (id, complaint_id, user_id, created_at) VALUES (?, ?, ?, ?)`
  );

  function daysAgo(n) {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  }
  function hoursFromNow(n) {
    return new Date(Date.now() + n * 60 * 60 * 1000).toISOString();
  }

  const samples = [
    {
      title: "Major water leak flooding Church Street",
      description:
        "There's a burst water pipe flooding the road outside the taxi rank on Church Street. Been running since yesterday morning and it's getting worse.",
      category: "WATER",
      priority: "CRITICAL",
      status: "SUBMITTED",
      createdDaysAgo: 1,
      isOverdue: true,
    },
    {
      title: "Deep pothole near Bodenstein Street intersection",
      description:
        "Large pothole has formed after the rains, about 40cm wide. Cars are swerving into oncoming traffic to avoid it.",
      category: "ROADS",
      priority: "HIGH",
      status: "ASSIGNED",
      createdDaysAgo: 3,
      assignedTeam: "Roads Crew 2",
    },
    {
      title: "Streetlights out along Nelson Mandela Drive",
      description: "Four streetlights in a row have been out for two weeks, area is very dark and feels unsafe at night.",
      category: "ELECTRICITY",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      createdDaysAgo: 5,
      assignedTeam: "Electrical Team A",
      notes: "Parts ordered, ETA Thursday.",
    },
    {
      title: "Illegal dumping site behind Checkers",
      description: "Household waste and old furniture dumped behind the shopping centre, growing every week and attracting pests.",
      category: "WASTE",
      priority: "MEDIUM",
      status: "RESOLVED",
      createdDaysAgo: 8,
      resolutionNote: "Site cleared and a warning sign installed. Waste crew will monitor weekly.",
      hasProof: true,
    },
    {
      title: "Broken swings at Savannah Park playground",
      description: "Two of the swing seats are broken and one chain is missing, unsafe for kids.",
      category: "PARKS",
      priority: "LOW",
      status: "CLOSED",
      createdDaysAgo: 14,
      resolutionNote: "New swing seats and chains installed and inspected.",
      hasProof: true,
    },
    {
      title: "Exposed live wire near primary school gate",
      description: "A low-hanging cable is sparking near the school gate, children walk right past it at pickup time.",
      category: "SAFETY",
      priority: "CRITICAL",
      status: "REOPENED",
      createdDaysAgo: 2,
      rejectionReason: "Cable was re-covered but is still hanging low enough for kids to reach.",
    },
    {
      title: "Sewage smell and overflow on Market Street",
      description: "Manhole cover is loose and sewage is overflowing onto the pavement outside the market.",
      category: "WATER",
      priority: "HIGH",
      status: "SUBMITTED",
      createdDaysAgo: 0,
    },
  ];

  const reporterIds = [resident.id, resident.id, resident2.id, resident.id, resident2.id, resident.id, resident2.id];

  samples.forEach((s, i) => {
    const id = newId("cmp");
    const userId = reporterIds[i % reporterIds.length];
    const department = departmentFor(s.category);
    const created = daysAgo(s.createdDaysAgo);
    const hours = deadlineHoursFor(s.category, s.priority);
    const deadline = s.isOverdue ? daysAgo(1) : hoursFromNow(hours);

    insertComplaint.run(
      id,
      userId,
      s.title,
      s.description,
      s.category,
      CENTER.lat + jitter(),
      CENTER.lng + jitter(),
      `${s.title.split(" near ")[1] || s.title.split(" on ")[1] || "Polokwane CBD"}`,
      null,
      s.status,
      s.priority,
      department,
      s.assignedTeam || null,
      s.notes || null,
      s.hasProof ? "/uploads/sample-proof-placeholder.jpg" : null,
      s.resolutionNote || null,
      s.isOverdue ? 1 : 0,
      deadline,
      s.rejectionReason || null,
      created,
      created
    );

    insertEvent.run(newId("evt"), id, userId, "SUBMITTED", "Complaint submitted by resident.", created);
    if (["ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED", "REOPENED"].includes(s.status)) {
      insertEvent.run(
        newId("evt"), id, admin.id, "ADMIN_UPDATE",
        `Assigned to ${department}${s.assignedTeam ? ` (${s.assignedTeam})` : ""}.`,
        daysAgo(Math.max(s.createdDaysAgo - 1, 0))
      );
    }
    if (["RESOLVED", "CLOSED"].includes(s.status)) {
      insertEvent.run(newId("evt"), id, admin.id, "ADMIN_UPDATE", `Status changed to RESOLVED.`, daysAgo(1));
    }
    if (s.status === "CLOSED") {
      insertEvent.run(newId("evt"), id, userId, "CONFIRMED", "Resident confirmed the issue is fixed. Complaint closed.", daysAgo(0));
    }
    if (s.status === "REOPENED") {
      insertEvent.run(
        newId("evt"), id, userId, "REJECTED",
        `Resident rejected the resolution: "${s.rejectionReason}". Escalated to CRITICAL priority and reopened.`,
        daysAgo(0)
      );
    }

    // Sprinkle some community "Me Too" votes.
    const voteCount = Math.floor(Math.random() * 4);
    const voters = [resident.id, resident2.id, admin.id].filter((v) => v !== userId).slice(0, voteCount);
    voters.forEach((v) => insertVote.run(newId("vote"), id, v, created));
  });

  db.prepare(
    `INSERT INTO emergency_logs (id, user_id, latitude, longitude, service_type, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'LOGGED', ?)`
  ).run(newId("emg"), resident.id, CENTER.lat + jitter(), CENTER.lng + jitter(), "AMBULANCE", daysAgo(4));

  console.log("Seed complete.");
  console.log("");
  console.log("Demo accounts (password: password123):");
  console.log(`  Resident:       ${resident.email}`);
  console.log(`  Resident:       ${resident2.email}`);
  console.log(`  Municipal admin:${admin.email}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
