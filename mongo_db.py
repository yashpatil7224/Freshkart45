"""
FreshKart 1 - MongoDB Database Configuration & Helper Functions
Supports MongoDB Atlas (Cloud) and Local MongoDB instances.
"""
import os
import datetime
from typing import Optional, List, Dict, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

DEFAULT_MONGODB_URI = "mongodb+srv://yashpatil7224_db_user:Y4hZCo94P6RzrLvl@cluster0.disbnkj.mongodb.net/freshkart?retryWrites=true&w=majority"
DIRECT_MONGODB_URI = "mongodb://yashpatil7224_db_user:Y4hZCo94P6RzrLvl@ac-hdqgbpt-shard-00-00.disbnkj.mongodb.net:27017,ac-hdqgbpt-shard-00-01.disbnkj.mongodb.net:27017,ac-hdqgbpt-shard-00-02.disbnkj.mongodb.net:27017/freshkart?ssl=true&replicaSet=atlas-fwvyil-shard-0&authSource=admin&retryWrites=true&w=majority"

MONGODB_URI = os.getenv("MONGODB_URI", DEFAULT_MONGODB_URI).strip()
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "freshkart").strip()

_mongo_client: Optional[MongoClient] = None

def get_mongo_client() -> Optional[MongoClient]:
    global _mongo_client
    if _mongo_client is None:
        try:
            _mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
            _mongo_client.admin.command('ping')
            print(f"[MONGODB SUCCESS] Connected to MongoDB Atlas Cloud Database: {MONGODB_DB_NAME}")
            return _mongo_client
        except Exception:
            pass

        try:
            _mongo_client = MongoClient(DIRECT_MONGODB_URI, serverSelectionTimeoutMS=4000)
            _mongo_client.admin.command('ping')
            print(f"[MONGODB SUCCESS] Connected to MongoDB Atlas via Direct Seeds: {MONGODB_DB_NAME}")
            return _mongo_client
        except Exception as err:
            print(f"[MONGODB WARNING] Could not connect to MongoDB ({err}). Falling back to SQLite/Memory.")
            _mongo_client = None
    return _mongo_client

def get_mongo_db():
    client = get_mongo_client()
    if client is not None:
        return client[MONGODB_DB_NAME]
    return None

def is_mongo_active() -> bool:
    return get_mongo_db() is not None

# ==============================================================================
# MONGODB CRUD HELPER FUNCTIONS
# ==============================================================================

# 1. USER ACCOUNTS
def mongo_find_user(identifier: str) -> Optional[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return None
    clean = identifier.strip().lower()
    user = db.users.find_one({
        "$or": [
            {"username": clean},
            {"email": clean}
        ]
    })
    if user and "_id" in user:
        user["_id"] = str(user["_id"])
    return user

def mongo_create_user(user_dict: dict) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None: return user_dict
    if "created_at" not in user_dict:
        user_dict["created_at"] = datetime.datetime.utcnow().isoformat()
    res = db.users.insert_one(user_dict)
    user_dict["_id"] = str(res.inserted_id)
    return user_dict

def mongo_get_all_users() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    users = list(db.users.find({}, {"password_hash": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return users

def mongo_update_user_address(username: str, address_data: dict) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.users.update_one(
        {"username": username.strip().lower()},
        {"$set": {
            "full_name": address_data.get("full_name"),
            "phone": address_data.get("phone"),
            "street_address": address_data.get("street_address"),
            "city": address_data.get("city"),
            "pincode": address_data.get("pincode"),
            "address": address_data
        }}
    )
    return res.modified_count > 0

def mongo_delete_user(username: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.users.delete_one({"username": username.strip().lower()})
    return res.deleted_count > 0


# 2. PRODUCTS
def mongo_get_all_products() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    products = list(db.products.find({}))
    for p in products:
        p["_id"] = str(p["_id"])
    return products

def mongo_get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return None
    p = db.products.find_one({"id": str(product_id)})
    if p and "_id" in p:
        p["_id"] = str(p["_id"])
    return p

def mongo_save_product(product_dict: dict) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None: return product_dict
    p_id = str(product_dict.get("id"))
    db.products.update_one(
        {"id": p_id},
        {"$set": product_dict},
        upsert=True
    )
    return product_dict

def mongo_delete_product(product_id: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.products.delete_one({"id": str(product_id)})
    return res.deleted_count > 0


# 3. ORDERS
def mongo_get_all_orders() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    orders = list(db.orders.find({}).sort("created_at", -1))
    for o in orders:
        o["_id"] = str(o["_id"])
    return orders

def mongo_get_user_orders(user_id: str) -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    clean_uid = str(user_id).strip().lower()
    orders = list(db.orders.find({
        "$or": [
            {"user_id": clean_uid},
            {"userId": clean_uid},
            {"delivery.email": clean_uid}
        ]
    }).sort("created_at", -1))
    for o in orders:
        o["_id"] = str(o["_id"])
    return orders

def mongo_save_order(order_dict: dict) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None: return order_dict
    o_id = str(order_dict.get("id"))
    if "created_at" not in order_dict:
        order_dict["created_at"] = datetime.datetime.utcnow().isoformat()
    db.orders.update_one(
        {"id": o_id},
        {"$set": order_dict},
        upsert=True
    )
    return order_dict

def mongo_update_order_status(order_id: str, new_status: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.orders.update_one(
        {"id": str(order_id)},
        {"$set": {"status": new_status}}
    )
    return res.modified_count > 0


# 4. CART & WISHLIST
def mongo_get_user_cart(user_id: str) -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    items = list(db.cart.find({"user_id": str(user_id)}))
    for i in items:
        i["_id"] = str(i["_id"])
    return items

def mongo_save_cart_item(user_id: str, product_id: str, quantity: int) -> bool:
    db = get_mongo_db()
    if db is None: return False
    db.cart.update_one(
        {"user_id": str(user_id), "product_id": str(product_id)},
        {"$set": {"quantity": quantity, "updated_at": datetime.datetime.utcnow().isoformat()}},
        upsert=True
    )
    return True

def mongo_clear_user_cart(user_id: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.cart.delete_many({"user_id": str(user_id)})
    return res.deleted_count > 0

def mongo_toggle_wishlist(user_id: str, product_id: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    uid = str(user_id)
    pid = str(product_id)
    existing = db.wishlist.find_one({"user_id": uid, "product_id": pid})
    if existing:
        db.wishlist.delete_one({"user_id": uid, "product_id": pid})
        return False
    else:
        db.wishlist.insert_one({"user_id": uid, "product_id": pid, "created_at": datetime.datetime.utcnow().isoformat()})
        return True

def mongo_get_user_wishlist(user_id: str) -> List[str]:
    db = get_mongo_db()
    if db is None: return []
    items = db.wishlist.find({"user_id": str(user_id)})
    return [i["product_id"] for i in items]


# 5. COUPONS & SERVICEABLE LOCATIONS
def mongo_get_all_coupons() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    coupons = list(db.coupons.find({}))
    for c in coupons:
        c["_id"] = str(c["_id"])
    return coupons

def mongo_save_coupon(coupon_dict: dict) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None: return coupon_dict
    code = coupon_dict.get("code", "").upper()
    db.coupons.update_one(
        {"code": code},
        {"$set": coupon_dict},
        upsert=True
    )
    return coupon_dict

def mongo_delete_coupon(coupon_id: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.coupons.delete_one({"$or": [{"id": coupon_id}, {"code": coupon_id.upper()}]})
    return res.deleted_count > 0

def mongo_get_all_locations() -> List[Dict[str, Any]]:
    db = get_mongo_db()
    if db is None: return []
    locations = list(db.locations.find({}))
    for l in locations:
        l["_id"] = str(l["_id"])
    return locations

def mongo_save_location(location_dict: dict) -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None: return location_dict
    pincode = str(location_dict.get("pincode"))
    db.locations.update_one(
        {"pincode": pincode},
        {"$set": location_dict},
        upsert=True
    )
    return location_dict

def mongo_delete_location(pincode: str) -> bool:
    db = get_mongo_db()
    if db is None: return False
    res = db.locations.delete_one({"pincode": str(pincode)})
    return res.deleted_count > 0
