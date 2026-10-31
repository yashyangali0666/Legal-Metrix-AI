import os
from PIL import Image, ImageDraw, ImageFont

def generate_packaging_image(
    filename: str,
    brand: str,
    product_name: str,
    category: str,
    declarations_text: list,
    bg_color=(240, 244, 250),
    accent_color=(29, 78, 216),
    output_dir: str = "backend/sample_images"
) -> str:
    os.makedirs(output_dir, exist_ok=True)
    width, height = 900, 1100
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Decorative packaging header / border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=accent_color, width=4)
    draw.rectangle([(20, 20), (width - 20, 140)], fill=accent_color)

    # Brand and Product Title
    draw.text((40, 35), brand.upper(), fill=(255, 255, 255))
    draw.text((40, 75), product_name, fill=(255, 255, 255))
    draw.text((width - 260, 45), f"CATEGORY: {category}", fill=(200, 225, 255))

    # Center Visual Mock Banner
    draw.rectangle([(50, 160), (width - 50, 360)], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
    draw.text((70, 180), "PRE-PACKAGED COMMODITY SPECIMEN", fill=(100, 116, 139))
    draw.text((70, 210), f"Generic: {product_name}", fill=(15, 23, 42))
    draw.text((70, 240), f"Standard Commercial Packaging - Packaged Commodity Rules 2011", fill=(71, 85, 105))

    # Barcode representation
    draw.rectangle([(width - 220, 260), (width - 70, 340)], fill=(255, 255, 255), outline=(0, 0, 0), width=1)
    for bx in range(width - 210, width - 80, 5):
        draw.line([(bx, 270), (bx, 325)], fill=(0, 0, 0), width=2)
    draw.text((width - 205, 326), "8901234567890", fill=(0, 0, 0))

    # Mandatory Declarations Panel (Principal Display Panel / Back Panel)
    draw.rectangle([(50, 390), (width - 50, height - 60)], fill=(255, 255, 255), outline=(148, 163, 184), width=2)
    draw.rectangle([(50, 390), (width - 50, 430)], fill=(226, 232, 240))
    draw.text((70, 400), "STATUTORY MANDATORY DECLARATIONS (RULE 6)", fill=(15, 23, 42))

    y_pos = 450
    for decl in declarations_text:
        draw.text((70, y_pos), decl, fill=(15, 23, 42))
        y_pos += 38

    draw.text((70, height - 100), "For consumer feedback/queries contact customer care address above.", fill=(100, 116, 139))

    out_path = os.path.join(output_dir, filename)
    img.save(out_path, quality=95)
    return out_path

def create_all_sample_images():
    # 1. Fully Compliant Potato Chips
    generate_packaging_image(
        filename="sample_chips_compliant.jpg",
        brand="Haldiram's",
        product_name="Aloo Bhujia Crispy Snacks",
        category="Food & Beverages",
        declarations_text=[
            "Product / Generic Name: Fried Potato and Gram Flour Snack",
            "Net Weight: 150 g",
            "MRP Rs. 50.00 (INCL. OF ALL TAXES)",
            "Unit Sale Price: Rs. 0.33 per g",
            "Mfg Date: 10/2026",
            "Manufactured by: Haldiram Snacks Pvt. Ltd.",
            "Address: B-1/H-8, Mohan Co-op Industrial Area, Mathura Road, New Delhi 110044",
            "Customer Care Helpline: 1800-102-4455",
            "Consumer Care Email: customercare@haldirams.com",
            "Country of Origin: India"
        ],
        bg_color=(254, 243, 199), # Light warm yellow
        accent_color=(180, 83, 9)
    )

    # 2. Non-Compliant Biscuits (Missing MRP declaration)
    generate_packaging_image(
        filename="sample_biscuit_missing_mrp.jpg",
        brand="Parle-G",
        product_name="Glucose Milk Biscuits",
        category="Food & Beverages",
        declarations_text=[
            "Generic Name: Wheat Flour Biscuits",
            "Net Weight: 250 g",
            "Mfg Date: 09/2026",
            "Manufactured by: Parle Products Private Ltd.",
            "Address: V.S. Khandekar Marg, Vile Parle East, Mumbai 400057",
            "Customer Care: 022-2613-8888 | care@parle.biz",
            "Country of Origin: India"
            # Note: MRP is intentionally missing!
        ],
        bg_color=(254, 242, 242), # Light red tint
        accent_color=(185, 28, 28)
    )

    # 3. Needs Review Mustard Oil (Missing postal PIN code in address)
    generate_packaging_image(
        filename="sample_oil_incomplete_address.jpg",
        brand="Tata Sampann",
        product_name="Cold Pressed Pure Mustard Oil",
        category="Edible Oils",
        declarations_text=[
            "Generic Name: 100% Pure Kachi Ghani Mustard Oil",
            "Net Volume: 1 L",
            "MRP Rs. 195.00 (incl. of all taxes)",
            "Unit Sale Price: Rs. 0.19 per ml",
            "Mfg Date: 08/2026",
            "Manufactured by: Tata Consumer Products Ltd., Industrial Estate, Bareilly",
            # Note: Address lacks 6-digit PIN code!
            "Consumer Care: 1800-345-0066 | care@tataconsumer.com",
            "Country of Origin: India"
        ],
        bg_color=(254, 249, 195),
        accent_color=(161, 98, 7)
    )

    # 4. Non-Compliant Imported Truffles (Missing Country of Origin)
    generate_packaging_image(
        filename="sample_imported_no_origin.jpg",
        brand="Cadbury",
        product_name="Swiss Truffles Dark Confection",
        category="Confectionery",
        declarations_text=[
            "Generic Name: Filled Cocoa Confectionery",
            "Net Weight: 200 g",
            "MRP Rs. 250.00 incl. of all taxes",
            "Mfg Date: 11/2026",
            "Imported & Marketed by: Mondelez India Foods Pvt Ltd",
            "Address: Unit 2001, Central Wing, Peninsula Towers, Lower Parel, Mumbai 400013",
            "Consumer Care: 1800-22-7080 | suggestions@mdlz.com"
            # Note: Country of origin missing for imported product!
        ],
        bg_color=(243, 232, 255),
        accent_color=(126, 34, 206)
    )

    # 5. Small Pack Exempt Cosmetic
    generate_packaging_image(
        filename="sample_cosmetic_exempt.jpg",
        brand="Himalaya",
        product_name="Purifying Neem Face Wash Mini",
        category="Cosmetics",
        declarations_text=[
            "Generic Name: Herbal Facial Cleanser",
            "Net Quantity: 8 ml", # <= 10 ml, Rule 26 exemption applies!
            "MRP Rs. 15.00 (incl. of all taxes)",
            "Mfg Date: 07/2026",
            "Manufactured by: The Himalaya Drug Company",
            "Address: Makali, Bengaluru 562162",
            "Customer Care: 1800-208-1930 | contactus@himalayawellness.com",
            "Country of Origin: India"
        ],
        bg_color=(236, 253, 245),
        accent_color=(4, 120, 87)
    )

if __name__ == "__main__":
    create_all_sample_images()
    print("All sample packaged commodity images generated successfully!")

