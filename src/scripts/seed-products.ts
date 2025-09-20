import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

async function seedProducts() {
    try {
        console.log("Seeding products...");

        // Check if products already exist
        const existingProducts = await db.select().from(products).limit(1);
        if (existingProducts.length > 0) {
            console.log("Products already exist, skipping seed");
            return;
        }

        // Sample products
        const sampleProducts = [
            {
                name: "Office Chair",
                type: "GOODS",
                salesPrice: "15000.00",
                purchasePrice: "12000.00",
                taxPercentage: "18.00",
                hsnCode: "9401",
                category: "Furniture",
                isActive: true,
            },
            {
                name: "Wooden Table",
                type: "GOODS",
                salesPrice: "25000.00",
                purchasePrice: "20000.00",
                taxPercentage: "18.00",
                hsnCode: "9403",
                category: "Furniture",
                isActive: true,
            },
            {
                name: "Sofa Set",
                type: "GOODS",
                salesPrice: "50000.00",
                purchasePrice: "40000.00",
                taxPercentage: "18.00",
                hsnCode: "9401",
                category: "Furniture",
                isActive: true,
            },
            {
                name: "Consultation Service",
                type: "SERVICE",
                salesPrice: "2000.00",
                purchasePrice: "0.00",
                taxPercentage: "18.00",
                hsnCode: "9983",
                category: "Services",
                isActive: true,
            },
            {
                name: "Delivery Service",
                type: "SERVICE",
                salesPrice: "500.00",
                purchasePrice: "0.00",
                taxPercentage: "18.00",
                hsnCode: "9965",
                category: "Services",
                isActive: true,
            },
        ];

        // Insert products
        await db.insert(products).values(sampleProducts);

        console.log("Products seeded successfully!");
    } catch (error) {
        console.error("Error seeding products:", error);
    }
}

// Run the seed function
seedProducts().then(() => {
    console.log("Seed completed");
    process.exit(0);
}).catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});
