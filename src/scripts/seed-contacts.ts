import { db } from "@/lib/db";
import { contacts } from "@/lib/db/schema";

async function seedContacts() {
    try {
        console.log("Seeding contacts...");

        // Check if contacts already exist
        const existingContacts = await db.select().from(contacts).limit(1);
        if (existingContacts.length > 0) {
            console.log("Contacts already exist, skipping seed");
            return;
        }

        // Sample contacts
        const sampleContacts = [
            {
                name: "John Doe Enterprises",
                type: "CUSTOMER",
                email: "john@doeenterprises.com",
                mobile: "+91-9876543210",
                address: {
                    line1: "123 Business Street",
                    city: "Mumbai",
                    state: "Maharashtra",
                    pincode: "400001",
                    country: "India"
                },
                isActive: true,
            },
            {
                name: "ABC Suppliers Pvt Ltd",
                type: "VENDOR",
                email: "contact@abcsuppliers.com",
                mobile: "+91-9876543211",
                address: {
                    line1: "456 Industrial Area",
                    city: "Delhi",
                    state: "Delhi",
                    pincode: "110001",
                    country: "India"
                },
                isActive: true,
            },
            {
                name: "XYZ Trading Company",
                type: "BOTH",
                email: "info@xyztrading.com",
                mobile: "+91-9876543212",
                address: {
                    line1: "789 Commercial Complex",
                    city: "Bangalore",
                    state: "Karnataka",
                    pincode: "560001",
                    country: "India"
                },
                isActive: true,
            },
        ];

        // Insert contacts
        await db.insert(contacts).values(sampleContacts);

        console.log("Contacts seeded successfully!");
    } catch (error) {
        console.error("Error seeding contacts:", error);
    }
}

// Run the seed function
seedContacts().then(() => {
    console.log("Seed completed");
    process.exit(0);
}).catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
});
