import os
import json
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# Setup Firebase
FIREBASE_CREDS_PATH = r"B:\My Works\LabManagementSystem\admin_server\firebase.json"
cred = credentials.Certificate(FIREBASE_CREDS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Our new ASP.NET Core API
API_BASE_URL = "http://localhost:5015/api" # Adjust port as needed

def migrate_data():
    print("Fetching students from Firebase...")
    students_ref = db.collection("students").stream()
    
    unique_batches = set()
    students_data = []
    
    for doc in students_ref:
        data = doc.to_dict()
        student_name = data.get("student_name", "").strip()
        batch = data.get("batch", "").strip()
        
        if student_name and batch:
            unique_batches.add(batch)
            students_data.append({
                "name": student_name,
                "batchName": batch
            })

    print(f"Found {len(unique_batches)} batches and {len(students_data)} students.")
    
    # 1. Create Batches in ASP.NET API
    batch_map = {} # Maps batchName to BatchId
    for batch_name in unique_batches:
        print(f"Creating Batch: {batch_name}")
        resp = requests.post(f"{API_BASE_URL}/batches", json={
            "batchName": batch_name,
            "year": "2024", # Default
            "department": "Unknown"
        }, verify=False)
        
        if resp.status_code in [200, 201]:
            batch_obj = resp.json()
            batch_map[batch_name] = batch_obj["id"]
        else:
            print(f"Failed to create batch {batch_name}: {resp.text}")
            
    # 2. Create Students in ASP.NET API
    for student in students_data:
        batch_id = batch_map.get(student["batchName"])
        if not batch_id:
            continue
            
        print(f"Creating Student: {student['name']}")
        resp = requests.post(f"{API_BASE_URL}/students", json={
            "name": student["name"],
            "batchId": batch_id,
            "studentId": f"S-{hash(student['name'] + student['batchName']) % 100000}", # Generate random StudentID
            "phoneNumber": "",
            "email": "",
            "status": "Active"
        }, verify=False)
        
        if resp.status_code not in [200, 201]:
             print(f"Failed to create student {student['name']}: {resp.text}")
             
    print("Migration complete!")

if __name__ == "__main__":
    migrate_data()
