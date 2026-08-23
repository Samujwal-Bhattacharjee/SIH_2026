# -*- coding: utf-8 -*-
"""
Procurement Demo Data Seed Script (SIH26100)
=============================================
Seeds realistic procurement tenders, participating bidders, eligibility criteria,
and synthetic extracted documents into the persistent procurement store.

Usage:
    python backend/seed_procurement.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.core import procurement_store as ps


def seed_procurement_data():
    print("Seeding SIH26100 Procurement Compliance Data...")
    try:
        ps.init_db()
        tenders = ps.get_tenders()
        bidders = ps.get_bidders()
        docs = ps.get_all_procurement_documents()
        print(f"  [+] Persistent Tenders: {len(tenders)}")
        print(f"  [+] Persistent Bidders: {len(bidders)}")
        print(f"  [+] Persistent Documents: {len(docs)}")
        print("[SUCCESS] Procurement demonstration data prepared successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to seed procurement data: {e}")


if __name__ == "__main__":
    seed_procurement_data()
