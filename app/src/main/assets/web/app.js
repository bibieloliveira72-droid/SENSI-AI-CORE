(() => {
  "use strict";

  const STORAGE_SAVED = "sensi_ai_saved_profiles_v2";
  const STORAGE_HISTORY = "sensi_ai_history_v2";
  const STORAGE_LEARNING = "sensi_ai_learning_v1";
  const MAX_HISTORY = 25;

  const SCOPE_LABELS = [
    { key: "General", label: "Geral" },
    { key: "Red Dot", label: "Red Dot" },
    { key: "2x", label: "Mira 2x" },
    { key: "4x", label: "Mira 4x" },
    { key: "AWM", label: "AWM" },
    { key: "Olhadinha", label: "Olhadinha" },
  ];

  const DEVICE_CATALOG = [
    ["Samsung","Galaxy A02"],
    ["Samsung","Galaxy A02s"],
    ["Samsung","Galaxy A03"],
    ["Samsung","Galaxy A03 Core"],
    ["Samsung","Galaxy A03s"],
    ["Samsung","Galaxy A04"],
    ["Samsung","Galaxy A04e"],
    ["Samsung","Galaxy A04s"],
    ["Samsung","Galaxy A05"],
    ["Samsung","Galaxy A05s"],
    ["Samsung","Galaxy A06"],
    ["Samsung","Galaxy A06 5G"],
    ["Samsung","Galaxy A07 4G"],
    ["Samsung","Galaxy A07 5G"],
    ["Samsung","Galaxy A08"],
    ["Samsung","Galaxy A12"],
    ["Samsung","Galaxy A13"],
    ["Samsung","Galaxy A14"],
    ["Samsung","Galaxy A15"],
    ["Samsung","Galaxy A16"],
    ["Samsung","Galaxy A17"],
    ["Samsung","Galaxy A17 5G"],
    ["Samsung","Galaxy A18 4G"],
    ["Samsung","Galaxy A22"],
    ["Samsung","Galaxy A23"],
    ["Samsung","Galaxy A24"],
    ["Samsung","Galaxy A25"],
    ["Samsung","Galaxy A26"],
    ["Samsung","Galaxy A27 5G"],
    ["Samsung","Galaxy A32"],
    ["Samsung","Galaxy A33"],
    ["Samsung","Galaxy A34"],
    ["Samsung","Galaxy A35"],
    ["Samsung","Galaxy A36"],
    ["Samsung","Galaxy A37"],
    ["Samsung","Galaxy A42"],
    ["Samsung","Galaxy A52"],
    ["Samsung","Galaxy A52s"],
    ["Samsung","Galaxy A53"],
    ["Samsung","Galaxy A54"],
    ["Samsung","Galaxy A55"],
    ["Samsung","Galaxy A56"],
    ["Samsung","Galaxy A57"],
    ["Samsung","Galaxy A72"],
    ["Samsung","Galaxy A73"],
    ["Samsung","Galaxy A82"],
    ["Samsung","Galaxy S10"],
    ["Samsung","Galaxy S10+"],
    ["Samsung","Galaxy S10e"],
    ["Samsung","Galaxy S10 Lite"],
    ["Samsung","Galaxy S20"],
    ["Samsung","Galaxy S20+"],
    ["Samsung","Galaxy S20 Ultra"],
    ["Samsung","Galaxy S20 FE"],
    ["Samsung","Galaxy S21"],
    ["Samsung","Galaxy S21+"],
    ["Samsung","Galaxy S21 Ultra"],
    ["Samsung","Galaxy S21 FE"],
    ["Samsung","Galaxy S22"],
    ["Samsung","Galaxy S22+"],
    ["Samsung","Galaxy S22 Ultra"],
    ["Samsung","Galaxy S23"],
    ["Samsung","Galaxy S23+"],
    ["Samsung","Galaxy S23 Ultra"],
    ["Samsung","Galaxy S23 FE"],
    ["Samsung","Galaxy S24"],
    ["Samsung","Galaxy S24+"],
    ["Samsung","Galaxy S24 Ultra"],
    ["Samsung","Galaxy S24 FE"],
    ["Samsung","Galaxy S25"],
    ["Samsung","Galaxy S25+"],
    ["Samsung","Galaxy S25 Ultra"],
    ["Samsung","Galaxy S25 Edge"],
    ["Samsung","Galaxy S25 FE"],
    ["Samsung","Galaxy S26"],
    ["Samsung","Galaxy S26+"],
    ["Samsung","Galaxy S26 Ultra"],
    ["Samsung","Galaxy Note 10"],
    ["Samsung","Galaxy Note 10+"],
    ["Samsung","Galaxy Note 10 Lite"],
    ["Samsung","Galaxy Note 20"],
    ["Samsung","Galaxy Note 20 Ultra"],
    ["Samsung","Galaxy Z Flip3"],
    ["Samsung","Galaxy Z Flip4"],
    ["Samsung","Galaxy Z Flip5"],
    ["Samsung","Galaxy Z Flip6"],
    ["Samsung","Galaxy Z Flip7"],
    ["Samsung","Galaxy Z Flip8"],
    ["Samsung","Galaxy Z Fold3"],
    ["Samsung","Galaxy Z Fold4"],
    ["Samsung","Galaxy Z Fold5"],
    ["Samsung","Galaxy Z Fold6"],
    ["Samsung","Galaxy Z Fold7"],
    ["Samsung","Galaxy Z Fold8"],
    ["Samsung","Galaxy M12"],
    ["Samsung","Galaxy M13"],
    ["Samsung","Galaxy M14"],
    ["Samsung","Galaxy M15"],
    ["Samsung","Galaxy M16"],
    ["Samsung","Galaxy M17"],
    ["Samsung","Galaxy M20"],
    ["Samsung","Galaxy M21"],
    ["Samsung","Galaxy M23"],
    ["Samsung","Galaxy M30"],
    ["Samsung","Galaxy M31"],
    ["Samsung","Galaxy M32"],
    ["Samsung","Galaxy M33"],
    ["Samsung","Galaxy M34"],
    ["Samsung","Galaxy M35"],
    ["Samsung","Galaxy M51"],
    ["Samsung","Galaxy M52"],
    ["Samsung","Galaxy M53"],
    ["Samsung","Galaxy M54"],
    ["Samsung","Galaxy M55"],
    ["Samsung","Galaxy M56"],
    ["Samsung","Galaxy F05"],
    ["Samsung","Galaxy F06"],
    ["Samsung","Galaxy F07"],
    ["Samsung","Galaxy F14"],
    ["Samsung","Galaxy F15"],
    ["Samsung","Galaxy F16"],
    ["Samsung","Galaxy F17"],
    ["Samsung","Galaxy F36"],
    ["Samsung","Galaxy F55"],
    ["Samsung","Galaxy F56"],
    ["Samsung","Galaxy XCover6 Pro"],
    ["Samsung","Galaxy XCover7"],
    ["Samsung","Galaxy XCover7 Pro"],
    ["Xiaomi","Xiaomi 11"],
    ["Xiaomi","Xiaomi 11 Lite 5G NE"],
    ["Xiaomi","Xiaomi 11T"],
    ["Xiaomi","Xiaomi 11T Pro"],
    ["Xiaomi","Xiaomi 12"],
    ["Xiaomi","Xiaomi 12 Lite"],
    ["Xiaomi","Xiaomi 12 Pro"],
    ["Xiaomi","Xiaomi 12T"],
    ["Xiaomi","Xiaomi 12T Pro"],
    ["Xiaomi","Xiaomi 13"],
    ["Xiaomi","Xiaomi 13 Lite"],
    ["Xiaomi","Xiaomi 13 Pro"],
    ["Xiaomi","Xiaomi 13T"],
    ["Xiaomi","Xiaomi 13T Pro"],
    ["Xiaomi","Xiaomi 14"],
    ["Xiaomi","Xiaomi 14 Civi"],
    ["Xiaomi","Xiaomi 14 Ultra"],
    ["Xiaomi","Xiaomi 14T"],
    ["Xiaomi","Xiaomi 14T Pro"],
    ["Xiaomi","Xiaomi 15"],
    ["Xiaomi","Xiaomi 15 Pro"],
    ["Xiaomi","Xiaomi 15 Ultra"],
    ["Xiaomi","Xiaomi 15T"],
    ["Xiaomi","Xiaomi 15T Pro"],
    ["Xiaomi","Xiaomi 17"],
    ["Xiaomi","Xiaomi 17 Pro"],
    ["Xiaomi","Xiaomi 17 Ultra"],
    ["Xiaomi","Redmi 9"],
    ["Xiaomi","Redmi 9A"],
    ["Xiaomi","Redmi 9C"],
    ["Xiaomi","Redmi 9T"],
    ["Xiaomi","Redmi 10"],
    ["Xiaomi","Redmi 10A"],
    ["Xiaomi","Redmi 10C"],
    ["Xiaomi","Redmi 12"],
    ["Xiaomi","Redmi 12C"],
    ["Xiaomi","Redmi 13"],
    ["Xiaomi","Redmi 13C"],
    ["Xiaomi","Redmi 14C"],
    ["Xiaomi","Redmi 15"],
    ["Xiaomi","Redmi 15C"],
    ["Xiaomi","Redmi A1"],
    ["Xiaomi","Redmi A2"],
    ["Xiaomi","Redmi A3"],
    ["Xiaomi","Redmi A4"],
    ["Xiaomi","Redmi A5"],
    ["Xiaomi","Redmi Note 8"],
    ["Xiaomi","Redmi Note 8 Pro"],
    ["Xiaomi","Redmi Note 9"],
    ["Xiaomi","Redmi Note 9S"],
    ["Xiaomi","Redmi Note 9 Pro"],
    ["Xiaomi","Redmi Note 10"],
    ["Xiaomi","Redmi Note 10S"],
    ["Xiaomi","Redmi Note 10 Pro"],
    ["Xiaomi","Redmi Note 11"],
    ["Xiaomi","Redmi Note 11S"],
    ["Xiaomi","Redmi Note 11 Pro"],
    ["Xiaomi","Redmi Note 11 Pro 5G"],
    ["Xiaomi","Redmi Note 12"],
    ["Xiaomi","Redmi Note 12 4G"],
    ["Xiaomi","Redmi Note 12 5G"],
    ["Xiaomi","Redmi Note 12S"],
    ["Xiaomi","Redmi Note 12 Pro"],
    ["Xiaomi","Redmi Note 12 Pro 5G"],
    ["Xiaomi","Redmi Note 13"],
    ["Xiaomi","Redmi Note 13 4G"],
    ["Xiaomi","Redmi Note 13 5G"],
    ["Xiaomi","Redmi Note 13 Pro"],
    ["Xiaomi","Redmi Note 13 Pro 4G"],
    ["Xiaomi","Redmi Note 13 Pro 5G"],
    ["Xiaomi","Redmi Note 13 Pro+"],
    ["Xiaomi","Redmi Note 14"],
    ["Xiaomi","Redmi Note 14 4G"],
    ["Xiaomi","Redmi Note 14 5G"],
    ["Xiaomi","Redmi Note 14 Pro"],
    ["Xiaomi","Redmi Note 14 Pro 5G"],
    ["Xiaomi","Redmi Note 14 Pro+"],
    ["Xiaomi","Redmi Note 15"],
    ["Xiaomi","Redmi Note 15 Pro"],
    ["Xiaomi","Redmi Note 15 Pro 5G"],
    ["Xiaomi","POCO C40"],
    ["Xiaomi","POCO C50"],
    ["Xiaomi","POCO C51"],
    ["Xiaomi","POCO C55"],
    ["Xiaomi","POCO C65"],
    ["Xiaomi","POCO C75"],
    ["Xiaomi","POCO C85"],
    ["Xiaomi","POCO M3"],
    ["Xiaomi","POCO M4 Pro"],
    ["Xiaomi","POCO M5"],
    ["Xiaomi","POCO M5s"],
    ["Xiaomi","POCO M6"],
    ["Xiaomi","POCO M6 Pro"],
    ["Xiaomi","POCO M7"],
    ["Xiaomi","POCO M7 Pro"],
    ["Xiaomi","POCO X3 NFC"],
    ["Xiaomi","POCO X3 Pro"],
    ["Xiaomi","POCO X4 Pro"],
    ["Xiaomi","POCO X5"],
    ["Xiaomi","POCO X5 Pro"],
    ["Xiaomi","POCO X6"],
    ["Xiaomi","POCO X6 Pro"],
    ["Xiaomi","POCO X7"],
    ["Xiaomi","POCO X7 Pro"],
    ["Xiaomi","POCO X8 Pro"],
    ["Xiaomi","POCO X8 Pro Max"],
    ["Xiaomi","POCO F3"],
    ["Xiaomi","POCO F4"],
    ["Xiaomi","POCO F5"],
    ["Xiaomi","POCO F5 Pro"],
    ["Xiaomi","POCO F6"],
    ["Xiaomi","POCO F6 Pro"],
    ["Xiaomi","POCO F7"],
    ["Xiaomi","POCO F7 Pro"],
    ["Xiaomi","POCO F8 Ultra"],
    ["Motorola","Moto E6 Play"],
    ["Motorola","Moto E7"],
    ["Motorola","Moto E7 Plus"],
    ["Motorola","Moto E20"],
    ["Motorola","Moto E22"],
    ["Motorola","Moto E22i"],
    ["Motorola","Moto E32"],
    ["Motorola","Moto E32s"],
    ["Motorola","Moto E40"],
    ["Motorola","Moto E zap"],
    ["Motorola","Moto G8 Play"],
    ["Motorola","Moto G8 Power"],
    ["Motorola","Moto G9 Play"],
    ["Motorola","Moto G9 Power"],
    ["Motorola","Moto G10"],
    ["Motorola","Moto G20"],
    ["Motorola","Moto G30"],
    ["Motorola","Moto G31"],
    ["Motorola","Moto G32"],
    ["Motorola","Moto G41"],
    ["Motorola","Moto G42"],
    ["Motorola","Moto G50"],
    ["Motorola","Moto G52"],
    ["Motorola","Moto G53 5G"],
    ["Motorola","Moto G54 5G"],
    ["Motorola","Moto G60"],
    ["Motorola","Moto G62 5G"],
    ["Motorola","Moto G71 5G"],
    ["Motorola","Moto G72"],
    ["Motorola","Moto G73 5G"],
    ["Motorola","Moto G84 5G"],
    ["Motorola","Moto G04"],
    ["Motorola","Moto G04s"],
    ["Motorola","Moto G05"],
    ["Motorola","Moto G14"],
    ["Motorola","Moto G15"],
    ["Motorola","Moto G24"],
    ["Motorola","Moto G24 Power"],
    ["Motorola","Moto G34 5G"],
    ["Motorola","Moto G35 5G"],
    ["Motorola","Moto G45 5G"],
    ["Motorola","Moto G55 5G"],
    ["Motorola","Moto G56 5G"],
    ["Motorola","Moto G64 5G"],
    ["Motorola","Moto G75 5G"],
    ["Motorola","Moto G85 5G"],
    ["Motorola","Moto G86"],
    ["Motorola","Moto G86 Power"],
    ["Motorola","Moto G06"],
    ["Motorola","Moto G47"],
    ["Motorola","Moto G87"],
    ["Motorola","Moto G Power 2021"],
    ["Motorola","Moto G Power 2022"],
    ["Motorola","Moto G Power 5G 2023"],
    ["Motorola","Moto G Stylus 2022"],
    ["Motorola","Moto G Stylus 5G 2023"],
    ["Motorola","Moto G Stylus 5G 2024"],
    ["Motorola","Edge 20"],
    ["Motorola","Edge 20 Lite"],
    ["Motorola","Edge 20 Pro"],
    ["Motorola","Edge 30"],
    ["Motorola","Edge 30 Neo"],
    ["Motorola","Edge 30 Fusion"],
    ["Motorola","Edge 30 Pro"],
    ["Motorola","Edge 40"],
    ["Motorola","Edge 40 Neo"],
    ["Motorola","Edge 40 Pro"],
    ["Motorola","Edge 50"],
    ["Motorola","Edge 50 Fusion"],
    ["Motorola","Edge 50 Neo"],
    ["Motorola","Edge 50 Pro"],
    ["Motorola","Edge 50 Ultra"],
    ["Motorola","Edge 60"],
    ["Motorola","Edge 60 Fusion"],
    ["Motorola","Edge 60 Pro"],
    ["Motorola","Edge 70"],
    ["Motorola","Edge 70 Fusion"],
    ["Motorola","Edge 70 Pro"],
    ["Motorola","Razr 40"],
    ["Motorola","Razr 40 Ultra"],
    ["Motorola","Razr 50"],
    ["Motorola","Razr 50 Ultra"],
    ["Motorola","Razr 60"],
    ["Motorola","Razr 60 Ultra"],
    ["Motorola","Razr 70"],
    ["Motorola","Razr 70 Ultra"],
    ["Apple","iPhone 6s"],
    ["Apple","iPhone 6s Plus"],
    ["Apple","iPhone SE (1ª geração)"],
    ["Apple","iPhone 7"],
    ["Apple","iPhone 7 Plus"],
    ["Apple","iPhone 8"],
    ["Apple","iPhone 8 Plus"],
    ["Apple","iPhone X"],
    ["Apple","iPhone XR"],
    ["Apple","iPhone XS"],
    ["Apple","iPhone XS Max"],
    ["Apple","iPhone 11"],
    ["Apple","iPhone 11 Pro"],
    ["Apple","iPhone 11 Pro Max"],
    ["Apple","iPhone SE (2020)"],
    ["Apple","iPhone 12 mini"],
    ["Apple","iPhone 12"],
    ["Apple","iPhone 12 Pro"],
    ["Apple","iPhone 12 Pro Max"],
    ["Apple","iPhone 13 mini"],
    ["Apple","iPhone 13"],
    ["Apple","iPhone 13 Pro"],
    ["Apple","iPhone 13 Pro Max"],
    ["Apple","iPhone SE (2022)"],
    ["Apple","iPhone 14"],
    ["Apple","iPhone 14 Plus"],
    ["Apple","iPhone 14 Pro"],
    ["Apple","iPhone 14 Pro Max"],
    ["Apple","iPhone 15"],
    ["Apple","iPhone 15 Plus"],
    ["Apple","iPhone 15 Pro"],
    ["Apple","iPhone 15 Pro Max"],
    ["Apple","iPhone 16"],
    ["Apple","iPhone 16 Plus"],
    ["Apple","iPhone 16 Pro"],
    ["Apple","iPhone 16 Pro Max"],
    ["Apple","iPhone 16e"],
    ["Apple","iPhone 17"],
    ["Apple","iPhone 17 Air"],
    ["Apple","iPhone 17 Pro"],
    ["Apple","iPhone 17 Pro Max"],
    ["ASUS ROG","ROG Phone 3"],
    ["ASUS ROG","ROG Phone 5"],
    ["ASUS ROG","ROG Phone 5s"],
    ["ASUS ROG","ROG Phone 6"],
    ["ASUS ROG","ROG Phone 6D"],
    ["ASUS ROG","ROG Phone 6D Ultimate"],
    ["ASUS ROG","ROG Phone 7"],
    ["ASUS ROG","ROG Phone 7 Ultimate"],
    ["ASUS ROG","ROG Phone 8"],
    ["ASUS ROG","ROG Phone 8 Pro"],
    ["ASUS ROG","ROG Phone 9"],
    ["ASUS ROG","ROG Phone 9 Pro"],
    ["ASUS ROG","ROG Phone 10"],
    ["ASUS ROG","Zenfone 7"],
    ["ASUS ROG","Zenfone 7 Pro"],
    ["ASUS ROG","Zenfone 8"],
    ["ASUS ROG","Zenfone 8 Flip"],
    ["ASUS ROG","Zenfone 9"],
    ["ASUS ROG","Zenfone 10"],
    ["ASUS ROG","Zenfone 11 Ultra"],
    ["ASUS ROG","Zenfone 12 Ultra"],
    ["Realme","Realme C11"],
    ["Realme","Realme C12"],
    ["Realme","Realme C15"],
    ["Realme","Realme C17"],
    ["Realme","Realme C20"],
    ["Realme","Realme C21"],
    ["Realme","Realme C21Y"],
    ["Realme","Realme C25"],
    ["Realme","Realme C25s"],
    ["Realme","Realme C30"],
    ["Realme","Realme C30s"],
    ["Realme","Realme C31"],
    ["Realme","Realme C33"],
    ["Realme","Realme C35"],
    ["Realme","Realme C51"],
    ["Realme","Realme C53"],
    ["Realme","Realme C55"],
    ["Realme","Realme C61"],
    ["Realme","Realme C63"],
    ["Realme","Realme C65"],
    ["Realme","Realme C67"],
    ["Realme","Realme C75"],
    ["Realme","Realme C85"],
    ["Realme","Realme 5"],
    ["Realme","Realme 5 Pro"],
    ["Realme","Realme 6"],
    ["Realme","Realme 6 Pro"],
    ["Realme","Realme 7"],
    ["Realme","Realme 7 Pro"],
    ["Realme","Realme 8"],
    ["Realme","Realme 8 Pro"],
    ["Realme","Realme 9"],
    ["Realme","Realme 9 Pro"],
    ["Realme","Realme 9 Pro+"],
    ["Realme","Realme 10"],
    ["Realme","Realme 10 Pro"],
    ["Realme","Realme 10 Pro+"],
    ["Realme","Realme 11"],
    ["Realme","Realme 11 Pro"],
    ["Realme","Realme 11 Pro+"],
    ["Realme","Realme 12"],
    ["Realme","Realme 12+"],
    ["Realme","Realme 12 Pro"],
    ["Realme","Realme 12 Pro+"],
    ["Realme","Realme 13"],
    ["Realme","Realme 13 Pro"],
    ["Realme","Realme 13 Pro+"],
    ["Realme","Realme 14"],
    ["Realme","Realme 14 Pro"],
    ["Realme","Realme 14 Pro+"],
    ["Realme","Realme 15"],
    ["Realme","Realme 15 Pro"],
    ["Realme","Realme GT"],
    ["Realme","Realme GT Neo 2"],
    ["Realme","Realme GT Neo 3"],
    ["Realme","Realme GT 2"],
    ["Realme","Realme GT 2 Pro"],
    ["Realme","Realme GT 3"],
    ["Realme","Realme GT 5"],
    ["Realme","Realme GT 5 Pro"],
    ["Realme","Realme GT 6"],
    ["Realme","Realme GT 6T"],
    ["Realme","Realme GT 7"],
    ["Realme","Realme GT 7 Pro"],
    ["Realme","Realme Narzo 30"],
    ["Realme","Realme Narzo 50"],
    ["Realme","Realme Narzo 50A"],
    ["Realme","Realme Narzo 60"],
    ["Realme","Realme Narzo 60 Pro"],
    ["Realme","Realme Narzo 70"],
    ["Realme","Realme Narzo 70 Pro"],
    ["Realme","Realme Narzo 80"],
    ["Infinix","Infinix Smart 5"],
    ["Infinix","Infinix Smart 6"],
    ["Infinix","Infinix Smart 7"],
    ["Infinix","Infinix Smart 8"],
    ["Infinix","Infinix Smart 9"],
    ["Infinix","Infinix Smart 10"],
    ["Infinix","Infinix Hot 10"],
    ["Infinix","Infinix Hot 10 Play"],
    ["Infinix","Infinix Hot 11"],
    ["Infinix","Infinix Hot 11S"],
    ["Infinix","Infinix Hot 12"],
    ["Infinix","Infinix Hot 12 Play"],
    ["Infinix","Infinix Hot 20"],
    ["Infinix","Infinix Hot 20i"],
    ["Infinix","Infinix Hot 20S"],
    ["Infinix","Infinix Hot 30"],
    ["Infinix","Infinix Hot 30i"],
    ["Infinix","Infinix Hot 30 Play"],
    ["Infinix","Infinix Hot 40"],
    ["Infinix","Infinix Hot 40i"],
    ["Infinix","Infinix Hot 40 Pro"],
    ["Infinix","Infinix Hot 50"],
    ["Infinix","Infinix Hot 50i"],
    ["Infinix","Infinix Hot 50 Pro"],
    ["Infinix","Infinix Hot 50 Pro+"],
    ["Infinix","Infinix Hot 60"],
    ["Infinix","Infinix Hot 60i"],
    ["Infinix","Infinix Hot 60 Pro"],
    ["Infinix","Infinix Hot 70"],
    ["Infinix","Infinix Note 10"],
    ["Infinix","Infinix Note 10 Pro"],
    ["Infinix","Infinix Note 11"],
    ["Infinix","Infinix Note 11 Pro"],
    ["Infinix","Infinix Note 12"],
    ["Infinix","Infinix Note 12 Pro"],
    ["Infinix","Infinix Note 12 VIP"],
    ["Infinix","Infinix Note 30"],
    ["Infinix","Infinix Note 30 5G"],
    ["Infinix","Infinix Note 30 Pro"],
    ["Infinix","Infinix Note 40"],
    ["Infinix","Infinix Note 40 Pro"],
    ["Infinix","Infinix Note 40 Pro+"],
    ["Infinix","Infinix Note 50"],
    ["Infinix","Infinix Note 50 Pro"],
    ["Infinix","Infinix Note 50 Pro+"],
    ["Infinix","Infinix Note 60"],
    ["Infinix","Infinix Zero 8"],
    ["Infinix","Infinix Zero 20"],
    ["Infinix","Infinix Zero 30"],
    ["Infinix","Infinix Zero 40"],
    ["Infinix","Infinix Zero 50"],
    ["Infinix","Infinix GT 10 Pro"],
    ["Infinix","Infinix GT 20 Pro"],
    ["Infinix","Infinix GT 30 Pro"],
    ["Infinix","Infinix GT 50 Pro"],
    ["OnePlus","OnePlus 7"],
    ["OnePlus","OnePlus 7 Pro"],
    ["OnePlus","OnePlus 7T"],
    ["OnePlus","OnePlus 7T Pro"],
    ["OnePlus","OnePlus 8"],
    ["OnePlus","OnePlus 8 Pro"],
    ["OnePlus","OnePlus 8T"],
    ["OnePlus","OnePlus 9"],
    ["OnePlus","OnePlus 9 Pro"],
    ["OnePlus","OnePlus 9R"],
    ["OnePlus","OnePlus 9RT"],
    ["OnePlus","OnePlus 10 Pro"],
    ["OnePlus","OnePlus 10T"],
    ["OnePlus","OnePlus 10R"],
    ["OnePlus","OnePlus 11"],
    ["OnePlus","OnePlus 11R"],
    ["OnePlus","OnePlus 12"],
    ["OnePlus","OnePlus 12R"],
    ["OnePlus","OnePlus 13"],
    ["OnePlus","OnePlus 13R"],
    ["OnePlus","OnePlus 13T"],
    ["OnePlus","OnePlus 15"],
    ["OnePlus","OnePlus 15R"],
    ["OnePlus","OnePlus Nord"],
    ["OnePlus","OnePlus Nord N10"],
    ["OnePlus","OnePlus Nord N100"],
    ["OnePlus","OnePlus Nord N20"],
    ["OnePlus","OnePlus Nord N30"],
    ["OnePlus","OnePlus Nord CE"],
    ["OnePlus","OnePlus Nord CE 2"],
    ["OnePlus","OnePlus Nord CE 2 Lite"],
    ["OnePlus","OnePlus Nord CE 3"],
    ["OnePlus","OnePlus Nord CE 3 Lite"],
    ["OnePlus","OnePlus Nord CE 4"],
    ["OnePlus","OnePlus Nord CE 4 Lite"],
    ["OnePlus","OnePlus Nord CE 5"],
    ["OnePlus","OnePlus Nord 2"],
    ["OnePlus","OnePlus Nord 2T"],
    ["OnePlus","OnePlus Nord 3"],
    ["OnePlus","OnePlus Nord 4"],
    ["OnePlus","OnePlus Nord 5"],
    ["OnePlus","OnePlus Nord 6"],
    ["OnePlus","OnePlus Open"]
  ].map(([brand, model]) => ({ brand, model }));

  // Especificações de referência para modelos com ficha técnica identificada.
  // RAM pode variar por região/variante; o valor preenchido é uma configuração comum.
  const DEVICE_SPECS = {
    "Samsung|Galaxy A06": { chipset: "MediaTek Helio G85", category: "entrada", ram: 4, hz: 60 },
    "Samsung|Galaxy A07 4G": { chipset: "MediaTek Helio G99", category: "intermediario", ram: 4, hz: 90 },
    "Samsung|Galaxy A07 5G": { chipset: "MediaTek Dimensity 6300", category: "intermediario", ram: 4, hz: 120 },
    "Samsung|Galaxy A14": { chipset: "Exynos 850", category: "entrada", ram: 4, hz: 90 },
    "Samsung|Galaxy A15": { chipset: "MediaTek Helio G99", category: "intermediario", ram: 4, hz: 90 },
    "Samsung|Galaxy A16": { chipset: "MediaTek Helio G99", category: "intermediario", ram: 4, hz: 90 },
    "Samsung|Galaxy A24": { chipset: "MediaTek Helio G99", category: "intermediario", ram: 6, hz: 90 },
    "Samsung|Galaxy A25": { chipset: "Exynos 1280", category: "intermediario_plus", ram: 6, hz: 120 },
    "Samsung|Galaxy A26": { chipset: "Exynos 1380", category: "intermediario_plus", ram: 6, hz: 120 },
    "Samsung|Galaxy A34": { chipset: "MediaTek Dimensity 1080", category: "intermediario_plus", ram: 6, hz: 120 },
    "Samsung|Galaxy A35": { chipset: "Exynos 1380", category: "intermediario_plus", ram: 6, hz: 120 },
    "Samsung|Galaxy A54": { chipset: "Exynos 1380", category: "intermediario_plus", ram: 8, hz: 120 },
    "Samsung|Galaxy A55": { chipset: "Exynos 1480", category: "intermediario_plus", ram: 8, hz: 120 },
    "Samsung|Galaxy A56": { chipset: "Exynos 1580", category: "intermediario_plus", ram: 8, hz: 120 },
    "Samsung|Galaxy S23": { chipset: "Snapdragon 8 Gen 2 for Galaxy", category: "flagship", ram: 8, hz: 120 },
    "Samsung|Galaxy S24": { chipset: "Exynos 2400", category: "flagship", ram: 8, hz: 120 },
    "Samsung|Galaxy S25": { chipset: "Snapdragon 8 Elite", category: "flagship", ram: 12, hz: 120 },
    "Xiaomi|Redmi 12": { chipset: "MediaTek Helio G88", category: "entrada", ram: 4, hz: 90 },
    "Xiaomi|Redmi 13": { chipset: "MediaTek Helio G91 Ultra", category: "intermediario", ram: 6, hz: 90 },
    "Xiaomi|Redmi Note 12": { chipset: "Snapdragon 685", category: "intermediario", ram: 6, hz: 120 },
    "Xiaomi|Redmi Note 13": { chipset: "Snapdragon 685", category: "intermediario", ram: 8, hz: 120 },
    "Xiaomi|Redmi Note 13 Pro 5G": { chipset: "Snapdragon 7s Gen 2", category: "intermediario_plus", ram: 8, hz: 120 },
    "Xiaomi|Redmi Note 14": { chipset: "MediaTek Helio G99 Ultra", category: "intermediario", ram: 8, hz: 120 },
    "Xiaomi|Redmi Note 14 Pro 5G": { chipset: "MediaTek Dimensity 7300 Ultra", category: "intermediario_plus", ram: 8, hz: 120 },
    "Xiaomi|POCO X5 Pro": { chipset: "Snapdragon 778G", category: "intermediario_plus", ram: 8, hz: 120 },
    "Xiaomi|POCO X6": { chipset: "Snapdragon 7s Gen 2", category: "intermediario_plus", ram: 8, hz: 120 },
    "Xiaomi|POCO X6 Pro": { chipset: "MediaTek Dimensity 8300 Ultra", category: "flagship", ram: 12, hz: 120 },
    "Xiaomi|POCO X7 Pro": { chipset: "MediaTek Dimensity 8400 Ultra", category: "flagship", ram: 8, hz: 120 },
    "Xiaomi|POCO F6": { chipset: "Snapdragon 8s Gen 3", category: "flagship", ram: 8, hz: 120 },
    "Motorola|Moto G24": { chipset: "MediaTek Helio G85", category: "entrada", ram: 4, hz: 90 },
    "Motorola|Moto G34 5G": { chipset: "Snapdragon 695", category: "intermediario", ram: 8, hz: 120 },
    "Motorola|Moto G54 5G": { chipset: "MediaTek Dimensity 7020", category: "intermediario", ram: 8, hz: 120 },
    "Motorola|Moto G84 5G": { chipset: "Snapdragon 695", category: "intermediario", ram: 8, hz: 120 },
    "Motorola|Moto G85 5G": { chipset: "Snapdragon 6s Gen 3", category: "intermediario", ram: 8, hz: 120 },
    "Motorola|Moto G86": { chipset: "MediaTek Dimensity 7300", category: "intermediario_plus", ram: 8, hz: 120 },
    "Motorola|Edge 50 Fusion": { chipset: "Snapdragon 7s Gen 2", category: "intermediario_plus", ram: 8, hz: 120 },
    "Motorola|Edge 50 Pro": { chipset: "Snapdragon 7 Gen 3", category: "intermediario_plus", ram: 12, hz: 144 },
    "Realme|Realme C55": { chipset: "MediaTek Helio G88", category: "entrada", ram: 6, hz: 90 },
    "Realme|Realme C67": { chipset: "Snapdragon 685", category: "intermediario", ram: 8, hz: 90 },
    "Realme|Realme 12 Pro+": { chipset: "Snapdragon 7s Gen 2", category: "intermediario_plus", ram: 8, hz: 120 },
    "Realme|Realme GT 6": { chipset: "Snapdragon 8s Gen 3", category: "flagship", ram: 12, hz: 120 },
    "Infinix|Infinix Hot 40 Pro": { chipset: "MediaTek Helio G99", category: "intermediario", ram: 8, hz: 120 },
    "Infinix|Infinix Hot 50 Pro+": { chipset: "MediaTek Helio G100", category: "intermediario", ram: 8, hz: 120 },
    "Infinix|Infinix Note 40 Pro": { chipset: "MediaTek Helio G99 Ultimate", category: "intermediario", ram: 8, hz: 120 },
    "Infinix|Infinix GT 20 Pro": { chipset: "MediaTek Dimensity 8200 Ultimate", category: "intermediario_plus", ram: 12, hz: 144 },
    "OnePlus|OnePlus 11": { chipset: "Snapdragon 8 Gen 2", category: "flagship", ram: 16, hz: 120 },
    "OnePlus|OnePlus 12": { chipset: "Snapdragon 8 Gen 3", category: "flagship", ram: 16, hz: 120 },
    "OnePlus|OnePlus Nord 3": { chipset: "MediaTek Dimensity 9000", category: "flagship", ram: 16, hz: 120 },
    "OnePlus|OnePlus Nord CE 4": { chipset: "Snapdragon 7 Gen 3", category: "intermediario_plus", ram: 8, hz: 120 },
    "ASUS ROG|ROG Phone 7": { chipset: "Snapdragon 8 Gen 2", category: "flagship", ram: 12, hz: 165 },
    "ASUS ROG|ROG Phone 8": { chipset: "Snapdragon 8 Gen 3", category: "flagship", ram: 16, hz: 165 },
    "ASUS ROG|ROG Phone 9": { chipset: "Snapdragon 8 Elite", category: "flagship", ram: 12, hz: 185 }
  };

  let activeDeviceBrand = "Todos";

  const els = {
    tabBtns: document.querySelectorAll(".tab-btn"),
    tabPanels: {
      generator: document.getElementById("tab-generator"),
      saved: document.getElementById("tab-saved"),
      compare: document.getElementById("tab-compare"),
    },

    form: document.getElementById("sensiForm"),
    marcaSelect: document.getElementById("marcaSelect"),
    customBrandField: document.getElementById("customBrandField"),
    customMarcaInput: document.getElementById("customMarcaInput"),
    devicePickerSearch: document.getElementById("devicePickerSearch"),
    deviceSearchInput: document.getElementById("deviceSearchInput"),
    deviceBrandFilters: document.getElementById("deviceBrandFilters"),
    deviceResults: document.getElementById("deviceResults"),
    selectedDeviceCard: document.getElementById("selectedDeviceCard"),
    selectedDeviceName: document.getElementById("selectedDeviceName"),
    selectedDeviceMeta: document.getElementById("selectedDeviceMeta"),
    changeDeviceBtn: document.getElementById("changeDeviceBtn"),
    manualDeviceBtn: document.getElementById("manualDeviceBtn"),
    deviceManualFields: document.getElementById("deviceManualFields"),
    backToDeviceCatalogBtn: document.getElementById("backToDeviceCatalogBtn"),
    modeloInput: document.getElementById("modeloInput"),
    processadorSelect: document.getElementById("processadorSelect"),
    processadorDetalheInput: document.getElementById("processadorDetalheInput"),
    ramChips: document.getElementById("ramChips"),
    ramInput: document.getElementById("ramInput"),
    hzChips: document.getElementById("hzChips"),
    hzInput: document.getElementById("hzInput"),
    dpiInput: document.getElementById("dpiInput"),
    dpiPresets: document.getElementById("dpiPresets"),
    fireButtonRange: document.getElementById("fireButtonRange"),
    fireButtonBadge: document.getElementById("fireButtonBadge"),
    fireButtonPresets: document.getElementById("fireButtonPresets"),
    profileCards: document.getElementById("profileCards"),
    profileInput: document.getElementById("profileInput"),

    errorBox: document.getElementById("errorBox"),
    resultsSection: document.getElementById("resultsSection"),
    deviceSummary: document.getElementById("deviceSummary"),
    sensiGrid: document.getElementById("sensiGrid"),
    copyAllBtn: document.getElementById("copyAllBtn"),

    calibrationButtons: document.getElementById("calibrationButtons"),
    calibrationFeedbackBox: document.getElementById("calibrationFeedbackBox"),
    resetBaseBtn: document.getElementById("resetBaseBtn"),

    saveProfileNameInput: document.getElementById("saveProfileNameInput"),
    saveProfileBtn: document.getElementById("saveProfileBtn"),

    notesBox: document.getElementById("notesBox"),
    notesList: document.getElementById("notesList"),
    disclaimerText: document.getElementById("disclaimerText"),
    staticDisclaimer: document.getElementById("staticDisclaimer"),

    savedCountBadge: document.getElementById("savedCountBadge"),
    savedProfilesList: document.getElementById("savedProfilesList"),
    profileSearch: document.getElementById("profileSearch"),
    historyList: document.getElementById("historyList"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),

    compareSelectA: document.getElementById("compareSelectA"),
    compareSelectB: document.getElementById("compareSelectB"),
    compareResultBox: document.getElementById("compareResultBox"),

    toast: document.getElementById("toast"),
  };

  let activeState = null;
  let idCounter = 0;
  let toastTimer = null;

  function createLocalId(prefix) {
    idCounter += 1;
    return `${prefix}_${Date.now()}_${idCounter}`;
  }

  function readStorageArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function calibrationLearningKey(config, profileLabel) {
    return [config.marca, config.modelo, profileLabel].map((part) =>
      String(part || "").trim().toLowerCase()
    ).join("|");
  }

  function readCalibrationLearning(config, profileLabel) {
    const all = readStorageObject(STORAGE_LEARNING);
    const key = calibrationLearningKey(config, profileLabel);
    return all[key] && typeof all[key] === "object" ? all[key] : {};
  }

  function saveCalibrationLearning(config, profileLabel, learningState) {
    const all = readStorageObject(STORAGE_LEARNING);
    all[calibrationLearningKey(config, profileLabel)] = learningState;
    localStorage.setItem(STORAGE_LEARNING, JSON.stringify(all));
  }

  function readStorageObject(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  function writeStorageArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 2400);
  }

  function showError(message) {
    els.errorBox.textContent = message;
    els.errorBox.classList.remove("hidden");
  }

  function clearError() {
    els.errorBox.textContent = "";
    els.errorBox.classList.add("hidden");
  }

  function formatDateTime(ts) {
    try {
      return new Date(ts).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_err) {
      return "";
    }
  }

  function formatValuesInline(values) {
    return `G:${values.General} | RD:${values["Red Dot"]} | 2x:${values["2x"]} | 4x:${values["4x"]} | AWM:${values.AWM} | Olh:${values.Olhadinha}`;
  }

  function buildCopyBlock(entry) {
    const cfg = entry.config;
    const v = entry.values;
    return [
      `SENSI.AI — ${cfg.marca} ${cfg.modelo} (${entry.profileLabel})`,
      `Hardware: ${cfg.ram}GB RAM | ${cfg.hz}Hz | ${cfg.dpi} DPI | Botão de tiro: ${cfg.fireButtonSize}%`,
      `Geral (General): ${v.General}`,
      `Red Dot: ${v["Red Dot"]}`,
      `Mira 2x: ${v["2x"]}`,
      `Mira 4x: ${v["4x"]}`,
      `AWM: ${v.AWM}`,
      `Olhadinha: ${v.Olhadinha}`,
      "",
      "Obs.: Sugestão inicial ajustável por testes no modo treinamento.",
    ].join("\n");
  }

  async function copyToClipboard(text, successMsg) {
    try {
      if (
        window.AndroidBridge &&
        typeof window.AndroidBridge.copyText === "function"
      ) {
        window.AndroidBridge.copyText(text);
        showToast(successMsg);
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      showToast(ok ? successMsg : "Não foi possível copiar.");
    } catch (_err) {
      showToast("Falha ao acessar a área de transferência.");
    }
  }

  function switchTab(tabId) {
    els.tabBtns.forEach((btn) => {
      const isSelected = btn.dataset.tab === tabId;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-selected", String(isSelected));
    });

    Object.entries(els.tabPanels).forEach(([key, panel]) => {
      panel.classList.toggle("hidden", key !== tabId);
    });

    if (tabId === "saved") {
      renderSavedAndHistory();
    } else if (tabId === "compare") {
      renderComparisonSelectors();
    }
  }

  function setupChipSelector(containerEl, hiddenInputEl) {
    containerEl.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-value]");
      if (!btn) return;
      containerEl
        .querySelectorAll("button[data-value]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      hiddenInputEl.value = btn.dataset.value;
    });
  }

  function selectChipValue(containerEl, hiddenInputEl, value) {
    const strVal = String(value);
    hiddenInputEl.value = strVal;
    containerEl
      .querySelectorAll("button[data-value]")
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.value === strVal);
      });
  }

  function syncDpiPresetHighlight() {
    const current = els.dpiInput.value.trim();
    els.dpiPresets
      .querySelectorAll("button[data-dpi]")
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.dpi === current);
      });
  }

  function syncFireButtonUi(val) {
    const num = Math.max(25, Math.min(90, Number.parseInt(val, 10) || 52));
    els.fireButtonRange.value = String(num);
    els.fireButtonBadge.textContent = `${num}%`;
    els.fireButtonPresets
      .querySelectorAll("button[data-fire]")
      .forEach((btn) => {
        btn.classList.toggle("active", Number.parseInt(btn.dataset.fire, 10) === num);
      });
  }

  function syncProfileCardSelection(profileId) {
    els.profileInput.value = profileId;
    els.profileCards
      .querySelectorAll("button[data-profile]")
      .forEach((card) => {
        card.classList.toggle("active", card.dataset.profile === profileId);
      });
  }

  function renderDeviceBrandFilters() {
    const brands = ["Todos", ...new Set(DEVICE_CATALOG.map((item) => item.brand))];
    els.deviceBrandFilters.innerHTML = "";
    brands.forEach((brand) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "device-brand-chip" + (activeDeviceBrand === brand ? " active" : "");
      button.dataset.deviceBrand = brand;
      button.textContent = brand;
      els.deviceBrandFilters.appendChild(button);
    });
  }

  function renderDeviceResults() {
    const query = els.deviceSearchInput.value.trim().toLocaleLowerCase("pt-BR");
    const filtered = DEVICE_CATALOG.filter((item) => {
      const matchesBrand = activeDeviceBrand === "Todos" || item.brand === activeDeviceBrand;
      const haystack = (item.brand + " " + item.model).toLocaleLowerCase("pt-BR");
      return matchesBrand && (!query || haystack.includes(query));
    });
    els.deviceResults.innerHTML = "";
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "device-empty";
      empty.textContent = "Nenhum modelo encontrado. Você pode informar seu aparelho manualmente.";
      els.deviceResults.appendChild(empty);
      return;
    }
    filtered.forEach((device) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "device-result";
      button.setAttribute("role", "option");
      button.innerHTML = '<span class="device-result-icon" aria-hidden="true">▯</span><span class="device-result-copy"><strong></strong><small></small></span><span class="device-result-arrow">›</span>';
      button.querySelector("strong").textContent = device.model;
      button.querySelector("small").textContent = device.brand;
      button.addEventListener("click", () => selectCatalogDevice(device));
      els.deviceResults.appendChild(button);
    });
  }

  function showDeviceCatalog() {
    els.devicePickerSearch.classList.remove("hidden");
    els.deviceManualFields.classList.add("hidden");
    els.selectedDeviceCard.classList.add("hidden");
    els.deviceSearchInput.focus();
  }

  function applyCatalogDeviceSpecs(device) {
    const specs = DEVICE_SPECS[device.brand + "|" + device.model];
    if (!specs) {
      els.selectedDeviceMeta.textContent = device.brand + " · ficha técnica não cadastrada; confira os dados manualmente";
      return;
    }
    els.processadorSelect.value = specs.category;
    els.processadorDetalheInput.value = specs.chipset;
    selectChipValue(els.ramChips, els.ramInput, specs.ram);
    selectChipValue(els.hzChips, els.hzInput, specs.hz);
    els.selectedDeviceMeta.textContent = device.brand + " · " + specs.chipset + " · " + specs.ram + " GB RAM* · " + specs.hz + " Hz";
  }

  function selectCatalogDevice(device) {
    els.marcaSelect.value = device.brand;
    els.customBrandField.classList.add("hidden");
    els.customMarcaInput.value = "";
    els.modeloInput.value = device.model;
    els.selectedDeviceName.textContent = device.model;
    els.selectedDeviceMeta.textContent = device.brand + " · modelo selecionado";
    applyCatalogDeviceSpecs(device);
    els.selectedDeviceCard.classList.remove("hidden");
    els.devicePickerSearch.classList.add("hidden");
    els.deviceManualFields.classList.add("hidden");
    clearError();
    showToast(DEVICE_SPECS[device.brand + "|" + device.model]
      ? "Dados técnicos preenchidos. Confira a variante de RAM do seu aparelho."
      : "Modelo selecionado. Complete os dados técnicos manualmente.");
  }

  function syncDevicePickerFromForm() {
    const brand = els.marcaSelect.value === "Outra" ? els.customMarcaInput.value.trim() : els.marcaSelect.value;
    const model = els.modeloInput.value.trim();
    if (!brand || !model) return;
    const match = DEVICE_CATALOG.find((item) => item.brand.toLocaleLowerCase("pt-BR") === brand.toLocaleLowerCase("pt-BR") && item.model.toLocaleLowerCase("pt-BR") === model.toLocaleLowerCase("pt-BR"));
    els.selectedDeviceName.textContent = model;
    els.selectedDeviceMeta.textContent = match ? brand + " · modelo selecionado" : brand + " · aparelho personalizado";
    els.selectedDeviceCard.classList.remove("hidden");
    els.devicePickerSearch.classList.add("hidden");
    els.deviceManualFields.classList.add("hidden");
  }

  function collectFormInput() {
    const selectedBrand = els.marcaSelect.value;
    const marca =
      selectedBrand === "Outra"
        ? els.customMarcaInput.value.trim()
        : selectedBrand;

    return {
      marca,
      modelo: els.modeloInput.value.trim(),
      processador: els.processadorSelect.value,
      processadorDetalhe: els.processadorDetalheInput.value.trim(),
      ram: Number.parseInt(els.ramInput.value, 10),
      hz: Number.parseInt(els.hzInput.value, 10),
      dpi: Number.parseInt(els.dpiInput.value, 10),
      fireButtonSize: Number.parseInt(els.fireButtonRange.value, 10),
      profile: els.profileInput.value,
    };
  }

  function applyInputToForm(config) {
    const standardBrands = Array.from(els.marcaSelect.options).map((o) => o.value);
    if (standardBrands.includes(config.marca)) {
      els.marcaSelect.value = config.marca;
      els.customBrandField.classList.add("hidden");
    } else {
      els.marcaSelect.value = "Outra";
      els.customBrandField.classList.remove("hidden");
      els.customMarcaInput.value = config.marca || "";
    }

    els.modeloInput.value = config.modelo || "";
    els.processadorSelect.value = config.processador || "intermediario_plus";
    els.processadorDetalheInput.value = config.processadorDetalhe || "";
    selectChipValue(els.ramChips, els.ramInput, config.ram || 8);
    selectChipValue(els.hzChips, els.hzInput, config.hz || 120);
    els.dpiInput.value = String(config.dpi || 600);
    syncDpiPresetHighlight();
    syncFireButtonUi(config.fireButtonSize || 52);
    syncProfileCardSelection(config.profile || "capa");
    syncDevicePickerFromForm();
  }

  function renderActiveResults() {
    if (!activeState) return;
    const { config, profileLabel, values, notes, disclaimer } = activeState;

    els.deviceSummary.textContent = `${config.marca} ${config.modelo} • ${profileLabel} • ${config.ram}GB • ${config.hz}Hz • ${config.dpi} DPI • Botão ${config.fireButtonSize}%`;
    els.sensiGrid.innerHTML = "";

    SCOPE_LABELS.forEach(({ key, label }) => {
      const value = values[key];
      const pct = Math.max(0, Math.min(100, Math.round((value / 200) * 100)));

      const card = document.createElement("div");
      card.className = "sensi-item";

      const top = document.createElement("div");
      top.className = "sensi-top";

      const nameEl = document.createElement("span");
      nameEl.className = "sensi-name";
      nameEl.textContent = label;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "copy-one-btn";
      copyBtn.textContent = "COPIAR";
      copyBtn.addEventListener("click", () => {
        copyToClipboard(`${label}: ${value}`, `${label} (${value}) copiado!`);
      });

      top.appendChild(nameEl);
      top.appendChild(copyBtn);

      const valueRow = document.createElement("div");
      valueRow.className = "sensi-value-row";

      const minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.className = "step-btn";
      minusBtn.textContent = "-1";
      minusBtn.setAttribute("aria-label", `Diminuir ${label} em 1 ponto`);
      minusBtn.addEventListener("click", () => handleSingleAdjust(key, -1));

      const valEl = document.createElement("div");
      valEl.className = "sensi-value";
      valEl.textContent = String(value);

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "step-btn";
      plusBtn.textContent = "+1";
      plusBtn.setAttribute("aria-label", `Aumentar ${label} em 1 ponto`);
      plusBtn.addEventListener("click", () => handleSingleAdjust(key, 1));

      valueRow.appendChild(minusBtn);
      valueRow.appendChild(valEl);
      valueRow.appendChild(plusBtn);

      const bar = document.createElement("div");
      bar.className = "sensi-bar";
      const fill = document.createElement("div");
      fill.className = "sensi-bar-fill";
      fill.style.width = `${pct}%`;
      bar.appendChild(fill);

      card.appendChild(top);
      card.appendChild(valueRow);
      card.appendChild(bar);
      els.sensiGrid.appendChild(card);
    });

    if (Array.isArray(notes) && notes.length > 0) {
      els.notesList.innerHTML = "";
      notes.forEach((tip) => {
        const li = document.createElement("li");
        li.textContent = tip;
        els.notesList.appendChild(li);
      });
      els.notesBox.classList.remove("hidden");
    } else {
      els.notesBox.classList.add("hidden");
    }

    if (disclaimer) {
      els.disclaimerText.textContent = disclaimer;
    }

    els.saveProfileNameInput.placeholder = `${config.marca} ${config.modelo} • ${profileLabel}`;
    els.resultsSection.classList.remove("hidden");
    els.staticDisclaimer.classList.add("hidden");
  }

  function recordHistoryEntry(entry) {
    const history = readStorageArray(STORAGE_HISTORY);
    history.unshift({
      id: createLocalId("hist"),
      createdAt: Date.now(),
      name: `${entry.config.marca} ${entry.config.modelo} (${entry.profileLabel})`,
      config: entry.config,
      profileLabel: entry.profileLabel,
      values: { ...entry.values },
    });
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    writeStorageArray(STORAGE_HISTORY, history);
  }

  function handleGenerateSubmit(event) {
    event.preventDefault();
    clearError();

    const raw = collectFormInput();
    if (!raw.marca || raw.marca.length < 2) {
      showError("Informe a marca do smartphone.");
      return;
    }
    if (!raw.modelo) {
      showError("Informe o modelo do smartphone.");
      return;
    }
    if (!Number.isInteger(raw.dpi) || raw.dpi < 200 || raw.dpi > 1600) {
      showError("A DPI deve estar entre 200 e 1600.");
      return;
    }

    const generated = window.SensiEngine.generateSensitivity(raw);
    activeState = {
      config: generated.config,
      profileLabel: generated.profileLabel,
      values: { ...generated.values },
      baseValues: { ...generated.values },
      notes: generated.notes,
      disclaimer: generated.disclaimer,
      calibrationSteps: 0,
      learningState: readCalibrationLearning(generated.config, generated.profileLabel),
    };

    els.calibrationFeedbackBox.classList.add("hidden");
    els.calibrationFeedbackBox.textContent = "";

    recordHistoryEntry(activeState);
    renderActiveResults();
    els.resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleSingleAdjust(scopeKey, delta) {
    if (!activeState) return;
    activeState.values = window.SensiEngine.adjustSingleScope(
      activeState.values,
      scopeKey,
      delta
    );
    renderActiveResults();
  }

  function handleCalibrationClick(feedbackType) {
    if (!activeState) return;
    const prevValues = { ...activeState.values };
    const result = window.SensiEngine.applyAdaptiveCalibration(
      activeState.values,
      feedbackType,
      {
        dpi: activeState.config.dpi,
        fireButtonSize: activeState.config.fireButtonSize,
        calibrationSteps: activeState.calibrationSteps,
        learningState: activeState.learningState,
      }
    );

    activeState.values = result.values;
    activeState.learningState = result.learningState;
    activeState.calibrationSteps += 1;
    saveCalibrationLearning(activeState.config, activeState.profileLabel, activeState.learningState);

    const changedParts = Object.entries(result.deltas)
      .filter(([, d]) => d !== 0)
      .map(([scope, d]) => {
        const sign = d > 0 ? `+${d}` : String(d);
        return `${scope}: ${prevValues[scope]} → ${result.values[scope]} (${sign})`;
      });

    els.calibrationFeedbackBox.innerHTML = "";
    const titleEl = document.createElement("strong");
    titleEl.textContent = `${result.reason}: `;
    const tipEl = document.createElement("span");
    tipEl.textContent = result.tip;
    els.calibrationFeedbackBox.appendChild(titleEl);
    els.calibrationFeedbackBox.appendChild(tipEl);

    if (changedParts.length > 0) {
      const diffEl = document.createElement("div");
      diffEl.style.marginTop = "6px";
      diffEl.style.fontFamily = "var(--font-mono)";
      diffEl.style.fontSize = "0.76rem";
      diffEl.textContent = changedParts.join("  •  ");
      els.calibrationFeedbackBox.appendChild(diffEl);
    }

    els.calibrationFeedbackBox.classList.remove("hidden");
    recordHistoryEntry(activeState);
    renderActiveResults();
  }

  function handleResetBase() {
    if (!activeState) return;
    activeState.values = { ...activeState.baseValues };
    activeState.calibrationSteps = 0;
    activeState.learningState = {};
    saveCalibrationLearning(activeState.config, activeState.profileLabel, {});
    els.calibrationFeedbackBox.classList.add("hidden");
    renderActiveResults();
    showToast("Valores restaurados para a base calculada.");
  }

  function handleSaveProfile() {
    if (!activeState) return;
    const customName = els.saveProfileNameInput.value.trim();
    const defaultName = `${activeState.config.marca} ${activeState.config.modelo} • ${activeState.profileLabel}`;
    const name = (customName || defaultName).slice(0, 48);

    const saved = readStorageArray(STORAGE_SAVED);
    saved.unshift({
      id: createLocalId("prof"),
      createdAt: Date.now(),
      name,
      config: activeState.config,
      profileLabel: activeState.profileLabel,
      values: { ...activeState.values },
    });
    writeStorageArray(STORAGE_SAVED, saved);
    els.saveProfileNameInput.value = "";
    showToast(`Perfil "${name}" salvo no aparelho!`);
  }

  function loadEntryIntoEditor(entry) {
    applyInputToForm(entry.config);
    const regenerated = window.SensiEngine.generateSensitivity(entry.config);
    activeState = {
      config: entry.config,
      profileLabel: entry.profileLabel || regenerated.profileLabel,
      values: { ...entry.values },
      baseValues: { ...regenerated.values },
      notes: regenerated.notes,
      disclaimer: regenerated.disclaimer,
      calibrationSteps: 0,
    };
    els.calibrationFeedbackBox.classList.add("hidden");
    renderActiveResults();
    switchTab("generator");
    showToast("Perfil carregado para edição e calibração.");
  }

  function renderSavedAndHistory() {
    const saved = readStorageArray(STORAGE_SAVED);
    const history = readStorageArray(STORAGE_HISTORY);
    const query = (els.profileSearch?.value || "").trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = (item) => !query || [item.name, item.config?.marca, item.config?.modelo, item.profileLabel].some((value) => String(value || "").toLocaleLowerCase("pt-BR").includes(query));
    const filteredSaved = saved.filter(matchesQuery);
    const filteredHistory = history.filter(matchesQuery);

    els.savedCountBadge.textContent = `${saved.length} SALVO${saved.length === 1 ? "" : "S"}`;
    els.savedProfilesList.innerHTML = "";

    if (filteredSaved.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = saved.length && query ? "Nenhum perfil corresponde à busca." : "Nenhum perfil salvo ainda. Gere uma sensibilidade e toque em SALVAR PERFIL.";
      els.savedProfilesList.appendChild(empty);
    } else {
      filteredSaved.forEach((item) => els.savedProfilesList.appendChild(buildEntryCard(item, "saved")));
    }

    els.historyList.innerHTML = "";
    if (filteredHistory.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = history.length && query ? "Nenhum registro do histórico corresponde à busca." : "O histórico local ainda está vazio. Suas gerações e calibrações aparecerão aqui automaticamente.";
      els.historyList.appendChild(empty);
    } else {
      filteredHistory.forEach((item) => els.historyList.appendChild(buildEntryCard(item, "history")));
    }
  }

  function buildEntryCard(item, sourceType) {
    const card = document.createElement("div");
    card.className = "saved-item";

    const top = document.createElement("div");
    top.className = "saved-item-top";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "saved-item-title";
    title.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "saved-item-meta";
    meta.textContent = `${item.config.dpi} DPI • ${item.config.hz}Hz • ${item.config.ram}GB • Botão ${item.config.fireButtonSize}% • ${formatDateTime(item.createdAt)}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);
    top.appendChild(titleWrap);

    const pill = document.createElement("div");
    pill.className = "saved-values-pill";
    pill.textContent = formatValuesInline(item.values);

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn-ghost-sm";
    loadBtn.textContent = "Carregar";
    loadBtn.addEventListener("click", () => loadEntryIntoEditor(item));

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn-ghost-sm";
    copyBtn.textContent = "Copiar";
    copyBtn.addEventListener("click", () => {
      copyToClipboard(buildCopyBlock(item), "Sensibilidade copiada!");
    });

    const compareBtn = document.createElement("button");
    compareBtn.type = "button";
    compareBtn.className = "btn-ghost-sm";
    compareBtn.textContent = "Comparar";
    compareBtn.addEventListener("click", () => {
      switchTab("compare");
      renderComparisonSelectors(item.id);
    });

    actions.appendChild(loadBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(compareBtn);

    if (sourceType === "saved") {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-danger-sm";
      deleteBtn.textContent = "Excluir";
      deleteBtn.addEventListener("click", () => {
        const next = readStorageArray(STORAGE_SAVED).filter((x) => x.id !== item.id);
        writeStorageArray(STORAGE_SAVED, next);
        renderSavedAndHistory();
        showToast("Perfil removido.");
      });
      actions.appendChild(deleteBtn);
    }

    card.appendChild(top);
    card.appendChild(pill);
    card.appendChild(actions);
    return card;
  }

  function getComparablePool() {
    const pool = [];
    if (activeState) {
      pool.push({
        id: "current_active",
        name: `Atual: ${activeState.config.marca} ${activeState.config.modelo} (${activeState.profileLabel})`,
        config: activeState.config,
        profileLabel: activeState.profileLabel,
        values: activeState.values,
      });
    }

    readStorageArray(STORAGE_SAVED).forEach((item) => {
      pool.push({ ...item, name: `Perfil: ${item.name}` });
    });

    readStorageArray(STORAGE_HISTORY).forEach((item) => {
      pool.push({
        ...item,
        name: `Histórico (${formatDateTime(item.createdAt)}): ${item.name}`,
      });
    });

    return pool;
  }

  function renderComparisonSelectors(preferredIdB) {
    const pool = getComparablePool();
    els.compareSelectA.innerHTML = "";
    els.compareSelectB.innerHTML = "";

    if (pool.length < 2) {
      els.compareResultBox.innerHTML =
        '<div class="empty-state">Gere ou salve pelo menos duas sensibilidades para comparar lado a lado.</div>';
      return;
    }

    pool.forEach((entry) => {
      const optA = document.createElement("option");
      optA.value = entry.id;
      optA.textContent = entry.name;
      els.compareSelectA.appendChild(optA);

      const optB = document.createElement("option");
      optB.value = entry.id;
      optB.textContent = entry.name;
      els.compareSelectB.appendChild(optB);
    });

    els.compareSelectA.value = pool[0].id;
    els.compareSelectB.value =
      preferredIdB && pool.some((p) => p.id === preferredIdB)
        ? preferredIdB
        : pool[1].id;

    renderComparisonTable(pool);
  }

  function renderComparisonTable(poolArg) {
    const pool = poolArg || getComparablePool();
    const entryA = pool.find((p) => p.id === els.compareSelectA.value);
    const entryB = pool.find((p) => p.id === els.compareSelectB.value);

    if (!entryA || !entryB) {
      els.compareResultBox.innerHTML =
        '<div class="empty-state">Selecione duas configurações para comparar.</div>';
      return;
    }

    const comparison = window.SensiEngine.compareConfigurations(entryA, entryB);
    const table = document.createElement("table");
    table.className = "compare-table";

    const thead = document.createElement("thead");
    thead.innerHTML =
      "<tr><th>Mira</th><th>Config A</th><th>Config B</th><th>Diferença</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    comparison.rows.forEach((row) => {
      const tr = document.createElement("tr");
      const labelObj = SCOPE_LABELS.find((s) => s.key === row.scope);
      const tdName = document.createElement("td");
      tdName.textContent = labelObj ? labelObj.label : row.scope;

      const tdA = document.createElement("td");
      tdA.className = "compare-num";
      tdA.textContent = String(row.valueA);

      const tdB = document.createElement("td");
      tdB.className = "compare-num";
      tdB.textContent = String(row.valueB);

      const tdDiff = document.createElement("td");
      if (row.diff > 0) {
        tdDiff.className = "delta-pos";
        tdDiff.textContent = `+${row.diff}`;
      } else if (row.diff < 0) {
        tdDiff.className = "delta-neg";
        tdDiff.textContent = String(row.diff);
      } else {
        tdDiff.className = "delta-zero";
        tdDiff.textContent = "=";
      }

      tr.appendChild(tdName);
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      tr.appendChild(tdDiff);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const metaBox = document.createElement("div");
    metaBox.className = "compare-meta-box";

    const rowA = document.createElement("div");
    const strongA = document.createElement("strong");
    strongA.textContent = "A: ";
    rowA.appendChild(strongA);
    rowA.appendChild(
      document.createTextNode(
        `${entryA.config.marca} ${entryA.config.modelo} • ${entryA.config.dpi} DPI • ${entryA.config.hz}Hz • Botão ${entryA.config.fireButtonSize}%`
      )
    );

    const rowB = document.createElement("div");
    const strongB = document.createElement("strong");
    strongB.textContent = "B: ";
    rowB.appendChild(strongB);
    rowB.appendChild(
      document.createTextNode(
        `${entryB.config.marca} ${entryB.config.modelo} • ${entryB.config.dpi} DPI • ${entryB.config.hz}Hz • Botão ${entryB.config.fireButtonSize}%`
      )
    );

    metaBox.appendChild(rowA);
    metaBox.appendChild(rowB);

    els.compareResultBox.innerHTML = "";
    els.compareResultBox.appendChild(table);
    els.compareResultBox.appendChild(metaBox);
  }

  function init() {
    els.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    renderDeviceBrandFilters();
    renderDeviceResults();
    els.deviceSearchInput.addEventListener("input", renderDeviceResults);
    els.deviceBrandFilters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-device-brand]");
      if (!button) return;
      activeDeviceBrand = button.dataset.deviceBrand;
      renderDeviceBrandFilters();
      renderDeviceResults();
    });
    els.changeDeviceBtn.addEventListener("click", showDeviceCatalog);
    els.manualDeviceBtn.addEventListener("click", () => {
      els.devicePickerSearch.classList.add("hidden");
      els.selectedDeviceCard.classList.add("hidden");
      els.deviceManualFields.classList.remove("hidden");
    });
    els.backToDeviceCatalogBtn.addEventListener("click", showDeviceCatalog);

    els.marcaSelect.addEventListener("change", () => {
      const isOther = els.marcaSelect.value === "Outra";
      els.customBrandField.classList.toggle("hidden", !isOther);
      if (isOther) els.customMarcaInput.focus();
    });

    setupChipSelector(els.ramChips, els.ramInput);
    setupChipSelector(els.hzChips, els.hzInput);

    els.dpiPresets.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-dpi]");
      if (!btn) return;
      els.dpiInput.value = btn.dataset.dpi;
      syncDpiPresetHighlight();
    });
    els.dpiInput.addEventListener("input", syncDpiPresetHighlight);

    els.fireButtonRange.addEventListener("input", (event) => {
      syncFireButtonUi(event.target.value);
    });
    els.fireButtonPresets.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-fire]");
      if (!btn) return;
      syncFireButtonUi(btn.dataset.fire);
    });

    els.profileCards.addEventListener("click", (event) => {
      const card = event.target.closest("button[data-profile]");
      if (!card) return;
      syncProfileCardSelection(card.dataset.profile);
    });

    els.form.addEventListener("submit", handleGenerateSubmit);

    els.calibrationButtons.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-feedback]");
      if (!btn) return;
      handleCalibrationClick(btn.dataset.feedback);
    });

    els.resetBaseBtn.addEventListener("click", handleResetBase);
    els.saveProfileBtn.addEventListener("click", handleSaveProfile);

    els.copyAllBtn.addEventListener("click", () => {
      if (!activeState) return;
      copyToClipboard(
        buildCopyBlock(activeState),
        "Todas as sensibilidades copiadas!"
      );
    });

    els.profileSearch.addEventListener("input", renderSavedAndHistory);

    els.clearHistoryBtn.addEventListener("click", () => {
      writeStorageArray(STORAGE_HISTORY, []);
      renderSavedAndHistory();
      showToast("Histórico limpo.");
    });

    els.compareSelectA.addEventListener("change", () => renderComparisonTable());
    els.compareSelectB.addEventListener("change", () => renderComparisonTable());
  }

  document.addEventListener("DOMContentLoaded", init);
})();
