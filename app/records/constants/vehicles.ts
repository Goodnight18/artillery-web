/**
 * Master data for vehicles in Thailand
 * Structured by Category -> Brand -> Model
 */

export interface VehicleCategoryData {
    brands: string[];
    models: Record<string, string[]>;
}

export const VEHICLE_MASTER_DATA: Record<string, VehicleCategoryData> = {
    "รถยนต์": {
        brands: [
            "Toyota", "Honda", "Isuzu", "Mitsubishi", "Ford", 
            "Nissan", "Mazda", "Suzuki", "MG", "BYD", 
            "GWM (Great Wall Motor)", "Hyundai", "Kia", "Mercedes-Benz", "BMW", 
            "Audi", "Volvo", "Porsche", "Lexus", "Subaru"
        ],
        models: {
            "Toyota": ["Hilux Revo", "Hilux Vigo", "Yaris", "Yaris Ativ", "Yaris Cross", "Corolla Cross", "Corolla Altis", "Camry", "Fortuner", "Vios", "Veloz", "Sienta", "Alphard"],
            "Honda": ["City", "Civic", "HR-V", "CR-V", "Accord", "BR-V", "WR-V", "Brio", "Jazz", "Mobilio"],
            "Isuzu": ["D-Max", "MU-X", "MU-7"],
            "Mitsubishi": ["Triton", "Pajero Sport", "Xpander", "Xpander Cross", "Mirage", "Attrage", "Lancer"],
            "Ford": ["Ranger", "Everest", "Ranger Raptor", "Fiesta", "Focus"],
            "Nissan": ["Almera", "Navara", "Kicks", "Terra", "March", "Sylphy", "Teana", "Note"],
            "Mazda": ["Mazda2", "Mazda3", "CX-3", "CX-30", "CX-5", "CX-8", "BT-50"],
            "Suzuki": ["Swift", "Celerio", "XL7", "Ertiga", "Carry", "Ciaz"],
            "MG": ["MG ZS", "MG5", "MG EP", "MG HS", "MG4", "MG VS", "MG ES", "MG3"],
            "BYD": ["Atto 3", "Dolphin", "Seal"],
            "GWM (Great Wall Motor)": ["Haval H6", "Haval Jolion", "ORA Good Cat", "ORA 07"],
            "Hyundai": ["H-1", "Staria", "Creta", "Tucson"],
            "Kia": ["Carnival", "Sorento"],
            "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "GLC", "GLE", "A-Class"],
            "BMW": ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5"]
        }
    },
    "รถจักรยานยนต์": {
        brands: [
            "Honda", "Yamaha", "Kawasaki", "Suzuki", "GPX", 
            "Vespa", "Royal Enfield", "Triumph", "Ducati", "BMW Motorrad",
            "KTM", "Benelli", "Stallions", "Lambretta", "Keeway", "Zontes"
        ],
        models: {
            "Honda": ["Wave 110i", "Wave 125i", "PCX 160", "FORZA 350", "ADV 160", "ADV 350", "Click 160", "Lead 125", "Giorno+", "Scoopy i", "MSX 125", "CB150R", "CBR150R", "CB500X", "Rebel 300 / 500", "CT125", "Monkey"],
            "Yamaha": ["Grand Filano Hybrid", "Fazzio", "NMAX 155", "XMAX 300", "Aerox 155", "Finn", "Exciter 155", "R15", "MT-15", "XSR 155", "YZF-R3", "MT-03", "Tracer 9"],
            "Kawasaki": ["Ninja 400 / 650", "Z400 / Z650 / Z900", "KLX 230 / 250", "W175", "Versys-X 300", "Vulcan S"],
            "Suzuki": ["Smash", "Raider R150", "Burgman 400", "V-Strom 650", "GSX-S150", "GSX-R150"],
            "GPX": ["Drone 150", "Tuscany 150", "Legend 150 / 250", "GTM 200", "Rock 110"],
            "Vespa": ["S Primavera 150", "Sprint 150", "GTS Super Sport 300", "LX 125"],
            "Royal Enfield": ["Classic 350", "Meteor 350", "Hunter 350", "Interceptor 650", "Himalayan"],
            "Lambretta": ["V200 Special", "X300", "G350"]
        }
    },
    "รถบรรทุก": {
        brands: ["Isuzu", "Hino", "Mitsubishi Fuso", "UD Trucks", "Scania", "Volvo Trucks"],
        models: {
            "Isuzu": ["FRR", "FTR", "GXZ", "NPR", "NQR"],
            "Hino": ["500 Dominator", "500 Victor", "700 Splendor"],
            "Mitsubishi Fuso": ["Canter", "Fighter"]
        }
    },
    "รถส่วนราชการ": {
       brands: ["Toyota", "Isuzu", "Honda", "Nissan", "Ford"],
       models: {
           "Toyota": ["Hilux Revo", "Camry", "Fortuner", "Commuter"],
           "Isuzu": ["D-Max", "MU-X"]
       }
    }
};

// Backwards compatibility helpers
export const POPULAR_VEHICLE_BRANDS = VEHICLE_MASTER_DATA["รถยนต์"].brands;
export const POPULAR_VEHICLE_MODELS = VEHICLE_MASTER_DATA["รถยนต์"].models;
