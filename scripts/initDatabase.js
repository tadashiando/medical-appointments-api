const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function initDatabase() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    console.log("🔄 Connecting to MongoDB...");
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    console.log("🗄️ Initializing database:", process.env.DB_NAME);

    // === CREATE INDEXES ===
    console.log("📊 Creating indexes...");

    // User indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ role: 1 });
    await db
      .collection("users")
      .createIndex({ licenseNumber: 1 }, { unique: true, sparse: true });

    // Appointment indexes
    await db.collection("appointments").createIndex({ doctorId: 1, date: 1 });
    await db.collection("appointments").createIndex({ patientId: 1, date: 1 });
    await db.collection("appointments").createIndex(
      {
        doctorId: 1,
        date: 1,
        time: 1,
      },
      {
        unique: true,
        partialFilterExpression: {
          status: { $in: ["pending", "confirmed"] },
        },
      }
    );

    // Payment indexes
    await db
      .collection("payments")
      .createIndex({ appointmentId: 1 }, { unique: true });
    await db.collection("payments").createIndex({ patientId: 1 });
    await db.collection("payments").createIndex({ status: 1 });

    // === CLEAN EXISTING DATA ===
    console.log("🧹 Cleaning existing data...");
    await db.collection("users").deleteMany({});
    await db.collection("appointments").deleteMany({});
    await db.collection("payments").deleteMany({});

    // === CREATE TEST USERS ===
    console.log("👥 Creating test users...");

    const hashedPassword = await bcrypt.hash("123456", 12);

    // Test doctors
    const doctors = [
      {
        name: "Dr. Juan Pérez",
        email: "doctor@ejemplo.com",
        password: hashedPassword,
        phone: "+1234567890",
        role: "doctor",
        specialization: "General Medicine",
        licenseNumber: "MED001",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Dra. Ana García",
        email: "doctora@ejemplo.com",
        password: hashedPassword,
        phone: "+1234567891",
        role: "doctor",
        specialization: "Cardiology",
        licenseNumber: "MED002",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Test patients
    const patients = [
      {
        name: "María González",
        email: "paciente@ejemplo.com",
        password: hashedPassword,
        phone: "+0987654321",
        role: "patient",
        dateOfBirth: new Date("1990-05-15"),
        address: "Calle Principal 123, Ciudad",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Pedro Martínez",
        email: "pedro@ejemplo.com",
        password: hashedPassword,
        phone: "+0987654322",
        role: "patient",
        dateOfBirth: new Date("1985-10-20"),
        address: "Avenida Central 456, Ciudad",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insert users
    const insertedDoctors = await db.collection("users").insertMany(doctors);
    const insertedPatients = await db.collection("users").insertMany(patients);

    console.log(`✅ ${doctors.length} doctors created`);
    console.log(`✅ ${patients.length} patients created`);

    // === CREATE SAMPLE APPOINTMENTS ===
    console.log("📅 Creating sample appointments...");

    const doctorIds = Object.values(insertedDoctors.insertedIds);
    const patientIds = Object.values(insertedPatients.insertedIds);

    const sampleAppointments = [
      {
        patientId: patientIds[0],
        doctorId: doctorIds[0],
        date: new Date("2024-03-20"),
        time: "09:00",
        duration: 30,
        reason: "General consultation",
        notes: "Patient with hypertension history",
        status: "pending",
        paymentStatus: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        patientId: patientIds[1],
        doctorId: doctorIds[1],
        date: new Date("2024-03-20"),
        time: "10:30",
        duration: 30,
        reason: "Cardiology checkup",
        status: "confirmed",
        paymentStatus: "paid",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertedAppointments = await db
      .collection("appointments")
      .insertMany(sampleAppointments);
    console.log(`✅ ${sampleAppointments.length} sample appointments created`);

    // === CREATE SAMPLE PAYMENT ===
    console.log("💳 Creating sample payment...");

    const appointmentIds = Object.values(insertedAppointments.insertedIds);

    const samplePayment = {
      appointmentId: appointmentIds[1], // The confirmed appointment
      patientId: patientIds[1],
      amount: 150.0,
      currency: "USD",
      paymentMethod: "credit_card",
      status: "completed",
      transactionId: "TXN_1234567890_abcdef",
      sandboxData: {
        cardNumber: "1234567890123456",
        cardHolder: "Pedro Martínez",
        expiryDate: "12/25",
        cvv: "123",
        gatewayResponse: {
          success: true,
          transactionId: "TXN_1234567890_abcdef",
          message: "Payment processed successfully",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("payments").insertOne(samplePayment);
    console.log("✅ 1 sample payment created");

    // === SUMMARY ===
    console.log("\n🎉 Database initialized successfully!");
    console.log("\n📋 SUMMARY:");
    console.log("👨‍⚕️ Doctors:");
    doctors.forEach((doc) =>
      console.log(`   - ${doc.name} (${doc.email}) - ${doc.specialization}`)
    );

    console.log("\n👥 Patients:");
    patients.forEach((pat) => console.log(`   - ${pat.name} (${pat.email})`));

    console.log("\n🔑 Login credentials (all use same password):");
    console.log("   Password: 123456");

    console.log("\n📅 Sample appointments created for testing");
    console.log("💳 One completed payment for workflow testing");

    console.log("\n🚀 Ready for testing with Postman!");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connection closed");
  }
}

initDatabase();
