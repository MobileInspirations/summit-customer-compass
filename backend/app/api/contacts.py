from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..core.database import get_db
from ..models.contact import Contact
from ..services.batch_service import BatchProcessingService
import csv
import io
from datetime import datetime

router = APIRouter()

# Store active batch processing tasks
active_tasks: Dict[str, BatchProcessingService] = {}

@router.post("/upload")
async def upload_contacts(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload contacts from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        contents = await file.read()
        csv_file = io.StringIO(contents.decode('utf-8'))
        reader = csv.DictReader(csv_file)
        
        contacts = []
        for row in reader:
            contact = Contact(
                email=row.get('email', '').strip(),
                full_name=row.get('full_name', '').strip(),
                company=row.get('company', '').strip(),
                tags=row.get('tags', '').split(',') if row.get('tags') else []
            )
            contacts.append(contact)
        
        # Bulk insert contacts
        db.bulk_save_objects(contacts)
        db.commit()
        
        return {"message": f"Successfully uploaded {len(contacts)} contacts"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/categorize/start")
async def start_categorization(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start the categorization process"""
    task_id = datetime.utcnow().isoformat()
    batch_service = BatchProcessingService(db)
    active_tasks[task_id] = batch_service
    
    # Start processing in background
    background_tasks.add_task(batch_service.process_all_contacts)
    
    return {"task_id": task_id, "message": "Categorization process started"}

@router.get("/categorize/status/{task_id}")
async def get_categorization_status(task_id: str):
    """Get the status of a categorization task"""
    if task_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return active_tasks[task_id].get_progress()

@router.get("/contacts")
async def get_contacts(
    skip: int = 0,
    limit: int = 100,
    main_bucket: str = None,
    personality_bucket: str = None,
    db: Session = Depends(get_db)
):
    """Get contacts with filtering and pagination"""
    query = db.query(Contact)
    
    if main_bucket:
        query = query.filter(Contact.main_bucket_assignment == main_bucket)
    if personality_bucket:
        query = query.filter(Contact.personality_bucket_assignment == personality_bucket)
    
    total = query.count()
    contacts = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "contacts": contacts
    }

@router.get("/categories/summary")
async def get_categories_summary(db: Session = Depends(get_db)):
    """Get summary of contacts in each bucket"""
    main_buckets = db.query(
        Contact.main_bucket_assignment,
        func.count(Contact.id)
    ).group_by(Contact.main_bucket_assignment).all()
    
    personality_buckets = db.query(
        Contact.personality_bucket_assignment,
        func.count(Contact.id)
    ).group_by(Contact.personality_bucket_assignment).all()
    
    return {
        "main_buckets": dict(main_buckets),
        "personality_buckets": dict(personality_buckets)
    } 