import re
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List

DEMO_PRODUCTS = [
    {
        "id": "demo_iphone_15_pro",
        "name": "Apple iPhone 15 Pro (256 GB) - Natural Titanium",
        "source": "Amazon",
        "url": "https://www.amazon.in/Apple-iPhone-15-Pro-256/dp/B0CHWV2WYK",
        "rating": 4.6,
        "review_count": 48,
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
        "is_demo": True,
        "reviews": [
            ("The titanium design feels noticeably lighter in the hand. The A17 Pro chip flies through games and 4K ProRes video editing without breaking a sweat.", 5.0, "Sarah Jenkins", "2026-03-10", True),
            ("Action Button is surprisingly versatile! I programmed it to launch Google Assistant or the flashlight. Super tactile and premium feel.", 5.0, "Rahul Sharma", "2026-03-08", True),
            ("Camera system is phenomenal, especially the 5x zoom and portrait mode focus switching in post. Low light photography is unbeatable.", 5.0, "David Chen", "2026-03-05", True),
            ("Display with 120Hz ProMotion is super smooth and bright under direct sunlight. Dynamic island animations are seamless.", 5.0, "Priya Nair", "2026-03-01", True),
            ("USB-C was long overdue! Finally one single cable for my MacBook, iPad, and iPhone. Transfer speeds on USB 3 are very rapid.", 5.0, "Alex Miller", "2026-02-28", True),
            ("Battery life is slightly above average, gets me through about 6.5 hours of screen-on time. Charges quickly with a 30W adapter.", 4.0, "Karan Kapoor", "2026-02-25", True),
            ("Good phone overall, but iOS 17 still has occasional keyboard stutter. Hardware is 10/10 though.", 4.0, "Jessica Taylor", "2026-02-22", True),
            ("Very decent upgrade from iPhone 12. Lightweight titanium frame makes a huge difference if you hold the phone for long reading sessions.", 4.0, "Amitabh V.", "2026-02-20", True),
            ("The back glass matte finish looks sophisticated, but smudges around the titanium edges are slightly noticeable if used without a case.", 4.0, "Vikram Patel", "2026-02-18", True),
            ("Solid performance and audio quality from the stereo speakers is surprisingly full and rich for podcast listening.", 4.0, "Elena Rostova", "2026-02-15", True),
            ("It is an okay phone for the exorbitant price. Not much difference in daily tasks compared to the iPhone 14 Pro.", 3.0, "Marcus Brody", "2026-02-12", True),
            ("Battery backup is just acceptable. If you use 5G and hotspot frequently, you will definitely need a midday recharge.", 3.0, "Neha Gupta", "2026-02-10", True),
            ("Phone heats up noticeably during prolonged gaming sessions or rapid fast charging. Normal web browsing is fine.", 3.0, "Daniel Craig", "2026-02-08", True),
            ("Average battery improvement. Camera improvements over the previous generation are marginal unless you shoot RAW.", 3.0, "Siddharth Rao", "2026-02-05", True),
            ("The device gets quite warm when running navigation and streaming music in the car simultaneously.", 2.0, "Chris Evans", "2026-02-01", True),
            ("Extremely overpriced for incremental updates. Battery draining faster than my older model after the latest software update.", 2.0, "Ananya Roy", "2026-01-28", True),
            ("Terrible customer service experience with Apple Care when reporting minor display flickering. Disappointed with the quality control.", 1.0, "Kevin Peterson", "2026-01-25", True),
            ("Battery health dropped 2% within the first month. Overheating issues persist even after patches. Definitely not worth the premium tag.", 1.0, "Manish Kumar", "2026-01-20", True),
            ("Unbelievable build quality and fluid iOS experience. The best smartphone camera on the market hands down.", 5.0, "Lisa Wong", "2026-01-18", True),
            ("Worth every single penny. The computational photography handles harsh highlights with perfection.", 5.0, "Arun Balaji", "2026-01-15", True),
            ("Compact form factor with flagship power. Fits comfortably in one hand and pockets easily.", 5.0, "Sophie Martin", "2026-01-12", True),
            ("Gaming performance with hardware-accelerated ray tracing is shockingly close to console level graphics.", 5.0, "Tariq Al-Mansoor", "2026-01-10", True),
            ("Decent smartphone but thermal management needs work. It throttles brightness when outdoors in hot weather.", 3.0, "Carlos Santos", "2026-01-08", True),
            ("Not good at all considering the cost. The charging speed is still stuck at barely 25W while competitors offer 80W.", 2.0, "Deepak Joshi", "2026-01-05", True),
            ("Flawless experience. Fast FaceID, crisp stereo speakers, and seamless AirDrop. Top-notch flagship.", 5.0, "Hannah Abbott", "2026-01-02", True)
        ]
    },
    {
        "id": "demo_sony_wh1000xm5",
        "name": "Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones",
        "source": "Amazon",
        "url": "https://www.amazon.in/Sony-WH-1000XM5-Wireless-Cancelling-Headphones/dp/B09XS7JWHH",
        "rating": 4.5,
        "review_count": 42,
        "image_url": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        "is_demo": True,
        "reviews": [
            ("The noise cancellation is pure magic. It completely silences airplane engine hum and noisy office chatter with zero ear pressure.", 5.0, "Jonathan Edwards", "2026-03-12", True),
            ("Best soundstage in wireless headphones. The LDAC support brings out crisp highs, warm mids, and deep controlled bass.", 5.0, "Pooja Hegde", "2026-03-09", True),
            ("Super lightweight and the soft fit synthetic leather headband is comfortable for 8+ hour work sessions with glasses on.", 5.0, "Liam O'Connor", "2026-03-06", True),
            ("Microphone quality for Zoom and Teams meetings is stellar. It isolates my voice even when my dog barks in the background.", 5.0, "Sneha Deshmukh", "2026-03-02", True),
            ("Multipoint bluetooth connection effortlessly switches between my laptop and smartphone when calls come in.", 5.0, "Oliver Smith", "2026-02-27", True),
            ("Battery easily lasts 30 hours with ANC turned on. Quick 3-minute charge gives nearly 3 hours of playback.", 4.0, "Gaurav Sen", "2026-02-23", True),
            ("Great sound clarity and equalizer customization in the Sony Headphones Connect app. Love the custom presets.", 4.0, "Emily Watson", "2026-02-19", True),
            ("Very good ANC, though the automatic optimizer sometimes recalibrates unexpectedly when you turn your head quickly.", 4.0, "Rajesh Mehra", "2026-02-16", True),
            ("Comfort is good, but the earcups can get a bit warm and sweaty after 2 hours of outdoor commuting in humid weather.", 4.0, "Chloe Bennett", "2026-02-14", True),
            ("The headphones do not fold into a compact ball like the older XM4. The carrying case is much larger in my backpack.", 3.0, "Arjun Singhal", "2026-02-10", True),
            ("Decent audio, but touch swipe gestures on the right earcup are finicky in winter when wearing light gloves.", 3.0, "Nathan Drake", "2026-02-06", True),
            ("Sound quality is good but bass is slightly muddy out of the box until you tweak the Clear Bass in the equalizer app.", 3.0, "Kavita Krishnan", "2026-02-01", True),
            ("The hinges started creaking after three months of daily use. For this premium price, plastic hinges are disappointing.", 2.0, "Lucas Meyer", "2026-01-26", True),
            ("Headband padding is way too narrow and causes a noticeable pressure hotspot on the crown of my head after 1 hour.", 2.0, "Naveen Reddy", "2026-01-21", True),
            ("Left earcup started producing an annoying high-pitched ringing feedback squeal when ANC is active. Sony support was unhelpful.", 1.0, "Bradley Cooper", "2026-01-15", True),
            ("ANC failed completely within two weeks. Returning for a full refund. Very dissatisfied with the build longevity.", 1.0, "Meera Iyer", "2026-01-10", True),
            ("Outstanding audio immersion. Acoustic songs sound like a live concert right in front of you.", 5.0, "Simon Cowell", "2026-01-05", True),
            ("Brilliant battery and ultra-fast charging. The speak-to-chat feature automatically pauses music when you speak.", 5.0, "Divya Jain", "2026-01-02", True)
        ]
    },
    {
        "id": "demo_samsung_s24_ultra",
        "name": "Samsung Galaxy S24 Ultra 5G (Titanium Black, 512GB)",
        "source": "Flipkart",
        "url": "https://www.flipkart.com/samsung-galaxy-s24-ultra-5g/p/itme8970",
        "rating": 4.7,
        "review_count": 45,
        "image_url": "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
        "is_demo": True,
        "reviews": [
            ("The flat anti-reflective Gorilla Armor display is unbelievable! Zero glare outdoors and reflections are completely eliminated.", 5.0, "Harsh Vardhan", "2026-03-11", True),
            ("Galaxy AI features like Circle to Search and Live Call Translation are genuinely useful in everyday professional work.", 5.0, "Rachel Green", "2026-03-07", True),
            ("The 200MP camera produces stunning detail and the 5x optical sensor captures sharper photos than the old 10x lens.", 5.0, "Aditya Roy", "2026-03-04", True),
            ("Snapdragon 8 Gen 3 gives blistering speeds with zero thermal throttling. S-Pen functionality makes note-taking seamless.", 5.0, "Monica Geller", "2026-02-28", True),
            ("Massive 5000mAh battery easily provides almost 8 hours of active screen time. Easily lasts into a second day.", 5.0, "Rohan Das", "2026-02-24", True),
            ("Great multimedia beast. The quad speakers and HDR10+ support make watching movies an absolute joy.", 4.0, "Chandler Bing", "2026-02-20", True),
            ("Titanium frame feels substantial and durable. Love the boxy industrial design aesthetic.", 4.0, "Tanvi Shah", "2026-02-17", True),
            ("Very reliable performance and One UI 6.1 is snappy. Samsung promised 7 years of Android updates.", 4.0, "Ross Geller", "2026-02-13", True),
            ("The phone is quite heavy and bulky at 232 grams. Using it one-handed requires gymnastics.", 3.0, "Pooja Bhatia", "2026-02-09", True),
            ("Color profile on the new display was somewhat washed out initially until Samsung added the vividness slider update.", 3.0, "Joey Tribbiani", "2026-02-04", True),
            ("Camera shutter lag still exists when clicking photos of moving pets or active toddlers indoors in low light.", 3.0, "Aakash Verma", "2026-01-30", True),
            ("Galaxy AI requires an internet connection for most heavy tasks and Samsung hints it might be subscription-based later.", 2.0, "Phoebe Buffay", "2026-01-24", True),
            ("Fingerprint scanner under the glass is inconsistent with tempered glass screen protectors applied.", 2.0, "Sunil Chhetri", "2026-01-19", True),
            ("Phone arrived with minor cosmetic scuffs on the titanium rail. Flipkart return process was excruciatingly slow.", 1.0, "Varun Dhawan", "2026-01-14", True),
            ("Display developed a vertical green line issue within 3 weeks. Authorized service center refused warranty coverage.", 1.0, "Karan Johar", "2026-01-09", True),
            ("Sensational piece of engineering. The zoom capability and stylus integration are unmatched in any smartphone.", 5.0, "Alia Bhatt", "2026-01-03", True)
        ]
    },
    {
        "id": "demo_kindle_paperwhite",
        "name": "Kindle Paperwhite (16 GB) – 6.8\" Glare-Free Display with Adjustable Warm Light",
        "source": "Amazon",
        "url": "https://www.amazon.in/Kindle-Paperwhite-16GB-adjustable-light/dp/B08N3TCP2F",
        "rating": 4.8,
        "review_count": 38,
        "image_url": "https://images.unsplash.com/photo-1592496001020-d31bd830651f?w=600&auto=format&fit=crop&q=80",
        "is_demo": True,
        "reviews": [
            ("The 6.8 inch display with adjustable warm light is absolute heaven for nighttime reading. Zero eye fatigue compared to an iPad.", 5.0, "Geeta Sundaram", "2026-03-10", True),
            ("Battery life is legendary! I read 45 minutes every day and only charge it once every 7 to 8 weeks. USB-C is fantastic.", 5.0, "Mark Sullivan", "2026-03-05", True),
            ("IPX8 waterproof rating means I can read peacefully by the swimming pool or bathtub without any paranoia.", 5.0, "Anushka Sharma", "2026-02-27", True),
            ("Crisp 300 ppi text resolution looks identical to real laser printed book paper. Page turns are snappy and responsive.", 5.0, "Richard Feynman", "2026-02-21", True),
            ("Built-in vocabulary builder and instant dictionary lookup have enhanced my English reading speed immensely.", 5.0, "Swati Mishra", "2026-02-15", True),
            ("Compact, lightweight, and holds thousands of books. Indispensable travel companion for avid book lovers.", 4.0, "Neil Gaiman", "2026-02-08", True),
            ("Warm backlight transition is smooth. The flush front design prevents dust from accumulating in corners.", 4.0, "Preeti Sethi", "2026-02-02", True),
            ("Great hardware, but the Amazon Kindle store interface can feel a bit sluggish to navigate compared to a modern phone.", 3.0, "Brandon Sanderson", "2026-01-26", True),
            ("Lack of physical page turn buttons is a step down from the old Kindle Voyage or Oasis models.", 3.0, "Tanmay Bhat", "2026-01-18", True),
            ("The lockscreen ad-supported version is annoying. Charging extra money just to remove lockscreen promotions is cheap.", 2.0, "Stephen King", "2026-01-12", True),
            ("Screen froze and got stuck in a reboot bootloop after downloading a large PDF book. Factory reset needed.", 1.0, "George R.R. Martin", "2026-01-04", True)
        ]
    },
    {
        "id": "demo_macbook_air_m2",
        "name": "Apple MacBook Air 15-inch M2 Chip (16GB RAM, 512GB SSD, Midnight)",
        "source": "Amazon",
        "url": "https://www.amazon.in/Apple-MacBook-15-inch-Laptop-512GB/dp/B0C767R6D5",
        "rating": 4.9,
        "review_count": 40,
        "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
        "is_demo": True,
        "reviews": [
            ("Completely silent fanless design with mind-boggling speed. Battery lasts 16 hours of heavy coding and web development.", 5.0, "Linus Torvalds", "2026-03-09", True),
            ("The 15.3 inch Liquid Retina display gives ample screen real estate without the bulk of a Pro laptop. Trackpad is the best in the industry.", 5.0, "Sundar Pichai", "2026-03-03", True),
            ("Six-speaker sound system with force-cancelling woofers sounds astonishingly good for a machine this thin.", 5.0, "Mira Nair", "2026-02-25", True),
            ("MagSafe charging cable frees up both Thunderbolt ports. 1080p FaceTime camera is crisp for corporate calls.", 5.0, "Steve Wozniak", "2026-02-18", True),
            ("Superb performance in Xcode and Docker. The M2 chip handles everything smoothly with zero thermal lag.", 5.0, "Anand Shimpi", "2026-02-11", True),
            ("Midnight color looks drop-dead gorgeous, though it definitely attracts fingerprint smudges easily.", 4.0, "Craig Federighi", "2026-02-05", True),
            ("Great laptop, but Apple still charges exorbitant prices for upgrading unified RAM and SSD storage.", 3.0, "Tim Cook", "2026-01-29", True),
            ("Limited to only one external external monitor natively without DisplayLink workarounds.", 3.0, "John Gruber", "2026-01-20", True),
            ("Keyboard key started sticking after just 4 months. Authorized Apple repair took over two weeks.", 1.0, "Walt Mossberg", "2026-01-10", True)
        ]
    }
]

class DemoScraper:
    """
    Supplies rich authentic demo review datasets for instant presentation,
    resilient fallback, and zero-configuration testing.
    """
    @staticmethod
    def get_all_products() -> List[Dict[str, Any]]:
        return DEMO_PRODUCTS

    @staticmethod
    def get_by_id(product_id: str) -> Dict[str, Any]:
        for p in DEMO_PRODUCTS:
            if p["id"] == product_id or product_id.lower() in p["name"].lower() or product_id.lower() in p["id"].lower():
                return p
        return DEMO_PRODUCTS[0]

    @staticmethod
    def search_or_fallback(query_or_url: str, source: str = "Amazon", max_reviews: int = 50) -> Dict[str, Any]:
        """
        Finds best matching demo product based on query keywords,
        or returns the top demo product if no direct match.
        """
        lower = query_or_url.lower().strip()
        matched = None
        # 1. Exact or partial ID match
        for p in DEMO_PRODUCTS:
            if p["id"] == lower or p["id"] in lower or lower in p["id"]:
                matched = p
                break

        # 2. Match by query tokens against name or ID
        if not matched:
            clean_tokens = [t for t in re.split(r'[^a-zA-Z0-9]+', lower) if len(t) >= 3 and t not in ('demo', 'amazon', 'flipkart')]
            for p in DEMO_PRODUCTS:
                name_lower = p["name"].lower()
                id_lower = p["id"].lower()
                if any(t in name_lower or t in id_lower for t in clean_tokens):
                    matched = p
                    break
        
        # 3. Match by source
        if not matched:
            for p in DEMO_PRODUCTS:
                if p["source"].lower() == source.lower():
                    matched = p
                    break

        if not matched:
            matched = DEMO_PRODUCTS[0]

        # Clone and clamp reviews to requested count
        reviews_data = []
        for text, rating, reviewer, date_str, verified in matched["reviews"][:max_reviews]:
            reviews_data.append({
                "id": str(uuid.uuid4())[:16],
                "product_id": matched["id"],
                "review_text": text,
                "rating": float(rating),
                "reviewer": reviewer,
                "review_date": date_str,
                "verified_purchase": verified,
                "source": matched["source"]
            })

        return {
            "product": {
                "id": matched["id"],
                "name": matched["name"],
                "url": matched["url"],
                "source": matched["source"],
                "rating": matched["rating"],
                "review_count": len(reviews_data),
                "image_url": matched["image_url"],
                "is_demo": True
            },
            "reviews": reviews_data,
            "is_demo": True
        }
