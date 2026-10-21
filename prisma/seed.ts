// Run with: npm run db:setup  (adds a few sample devices and customers)
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.device.createMany({
    data: [
      { serialNumber: "MIFI-001", model: "Huawei E5576", dailyRate: 35000 },
      { serialNumber: "MIFI-002", model: "Huawei E5576", dailyRate: 35000 },
      { serialNumber: "MIFI-003", model: "TP-Link M7350", dailyRate: 45000 },
      { serialNumber: "MIFI-004", model: "Netgear Nighthawk M1", dailyRate: 60000 },
    ],
  });
  await db.customer.createMany({
    data: [
      { name: "Budi Santoso", phone: "081234567890", email: "budi@example.com" },
      { name: "Siti Aminah", phone: "081298765432", email: "siti@example.com" },
    ],
  });
}

main().finally(() => db.$disconnect());
