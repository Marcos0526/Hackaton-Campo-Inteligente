import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding extended test profiles for Campo Inteligente...")

  // Clean existing data
  await prisma.notification.deleteMany()
  await prisma.financialRequest.deleteMany()
  await prisma.transportQuote.deleteMany()
  await prisma.commercialOperation.deleteMany()
  await prisma.buyerRequest.deleteMany()
  await prisma.commercialOffer.deleteMany()
  await prisma.producerProfile.deleteMany()
  await prisma.transporterProfile.deleteMany()
  await prisma.buyerProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // --- 1. PRODUCERS (10 profiles) ---
  const producersData = [
    { id: "PROD-01", name: "Juan Perez", location: "Celaya, Guanajuato", crops: "Jitomate, Cebolla" },
    { id: "PROD-02", name: "Maria Gomez", location: "Uruapan, Michoacan", crops: "Aguacate" },
    { id: "PROD-03", name: "Carlos Ruiz", location: "Tepatitlan, Jalisco", crops: "Maiz Amarillo" },
    { id: "PROD-04", name: "Ana Martinez", location: "Hermosillo, Sonora", crops: "Trigo, Uva" },
    { id: "PROD-05", name: "Roberto Diaz", location: "Torreon, Coahuila", crops: "Algodon, Melon" },
    { id: "PROD-06", name: "Elena Hernandez", location: "Culiacan, Sinaloa", crops: "Chile Bell, Tomate" },
    { id: "PROD-07", name: "Miguel Angel", location: "Irapuato, Guanajuato", crops: "Fresa, Brocoli" },
    { id: "PROD-08", name: "Sofia Lara", location: "Xalapa, Veracruz", crops: "Cafe, Citricos" },
    { id: "PROD-09", name: "Ricardo Vega", location: "Pachuca, Hidalgo", crops: "Cebada, Nopal" },
    { id: "PROD-10", name: "Lucia Parra", location: "Oaxaca, Oaxaca", crops: "Agave, Mezcal" },
  ];

  for (const p of producersData) {
    await prisma.user.create({
      data: {
        id: p.id,
        name: p.name,
        email: `${p.id.toLowerCase()}@campo.test`,
        role: "producer",
        producerProfile: {
          create: {
            farmName: `Rancho ${p.name.split(' ')[1]}`,
            location: p.location,
            totalLand: 20,
            cultivatedLand: 15,
            crops: p.crops,
          }
        }
      }
    });
  }

  // --- 2. TRANSPORTERS (10 profiles) ---
  const transportersData = [
    { id: "TRAN-01", name: "Transportes del Bajio", loc: "Queretaro", cap: 15000, type: "Camion Caja" },
    { id: "TRAN-02", name: "Fletes Rapidos", loc: "Guadalajara", cap: 7000, type: "Camion Redilas" },
    { id: "TRAN-03", name: "Logistica Sur", loc: "Morelia", cap: 3500, type: "Camioneta" },
    { id: "TRAN-04", name: "Carga Norte", loc: "Monterrey", cap: 25000, type: "Trailer" },
    { id: "TRAN-05", name: "Transportes Pacifico", loc: "Mazatlan", cap: 12000, type: "Refrigerado" },
    { id: "TRAN-06", name: "MexLog", loc: "CDMX", cap: 10000, type: "Camion Cerrado" },
    { id: "TRAN-07", name: "Rutas del Sol", loc: "Cancun", cap: 5000, type: "Camioneta" },
    { id: "TRAN-08", name: "Fletes Centro", loc: "Puebla", cap: 8000, type: "Redilas" },
    { id: "TRAN-09", name: "Logistica Istmo", loc: "Veracruz", cap: 18000, type: "Contenedor" },
    { id: "TRAN-10", name: "Transporte Local", loc: "Toluca", cap: 2000, type: "Pick-up" },
  ];

  for (const t of transportersData) {
    await prisma.user.create({
      data: {
        id: t.id,
        name: t.name,
        email: `${t.id.toLowerCase()}@campo.test`,
        role: "transporter",
        transporterProfile: {
          create: {
            baseLocation: t.loc,
            vehicleType: t.type,
            loadCapacityKg: t.cap,
            routes: "Nacional"
          }
        }
      }
    });
  }

  // --- 3. BUYERS (10 profiles) ---
  const buyersData = [
    { id: "BUY-01", name: "Alimentos del Centro", loc: "CDMX", needs: "Jitomate, Cebolla" },
    { id: "BUY-02", name: "Super Occidente", loc: "Zapopan", needs: "Maiz, Limon" },
    { id: "BUY-03", name: "Global Foods", loc: "Monterrey", needs: "Trigo" },
    { id: "BUY-04", name: "Frutas Selectas", loc: "Cancun", needs: "Aguacate, Mango" },
    { id: "BUY-05", name: "Granos de Mexico", loc: "Leon", needs: "Frijol, Maiz" },
    { id: "BUY-06", name: "Mercado Abastos", loc: "Guadalajara", needs: "Todo tipo" },
    { id: "BUY-07", name: "Exportaciones Verdes", loc: "Ensenada", needs: "Fresa, Arandano" },
    { id: "BUY-08", name: "Cereales del Norte", loc: "Chihuahua", needs: "Avena, Trigo" },
    { id: "BUY-09", name: "Salsas y Conservas", loc: "Puebla", needs: "Chile, Tomate" },
    { id: "BUY-10", name: "Jugos del Valle", loc: "Queretaro", needs: "Naranja, Manzana" },
  ];

  for (const b of buyersData) {
    await prisma.user.create({
      data: {
        id: b.id,
        name: b.name,
        email: `${b.id.toLowerCase()}@campo.test`,
        role: "buyer",
        buyerProfile: {
          create: {
            companyName: b.name,
            deliveryLocation: b.loc,
            preferredCrops: b.needs
          }
        }
      }
    });
  }

  // Sample Offer
  await prisma.commercialOffer.create({
    data: {
      producerId: "PROD-01",
      productName: "Jitomate Saladette",
      quantity: 10,
      unit: "toneladas",
      quality: "primera",
      pricePerUnit: 15000,
      availableDate: new Date(),
      status: "published"
    }
  });

  console.log("Seed completed: 30 test profiles created.");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
