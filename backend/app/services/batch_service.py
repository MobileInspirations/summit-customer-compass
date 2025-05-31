from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..models.contact import Contact
from .categorization_service import CategorizationService
import asyncio
from datetime import datetime
import json

class BatchProcessingService:
    def __init__(self, db: Session, batch_size: int = 1000):
        self.db = db
        self.batch_size = batch_size
        self.categorization_service = CategorizationService()
        self.progress = {
            "total_contacts": 0,
            "processed_contacts": 0,
            "status": "idle",
            "start_time": None,
            "end_time": None,
            "error": None
        }
    
    async def process_all_contacts(self) -> Dict[str, Any]:
        """Process all contacts in batches"""
        try:
            self.progress["status"] = "running"
            self.progress["start_time"] = datetime.utcnow()
            
            # Get total count
            total_count = self.db.query(Contact).count()
            self.progress["total_contacts"] = total_count
            
            # Process in batches
            offset = 0
            while offset < total_count:
                contacts = self.db.query(Contact).offset(offset).limit(self.batch_size).all()
                
                # Process batch
                for contact in contacts:
                    main_bucket, personality_bucket = self.categorization_service.categorize_contact(contact)
                    contact.main_bucket_assignment = main_bucket
                    contact.personality_bucket_assignment = personality_bucket
                    self.progress["processed_contacts"] += 1
                
                # Commit batch
                self.db.commit()
                offset += self.batch_size
                
                # Allow other tasks to run
                await asyncio.sleep(0)
            
            self.progress["status"] = "completed"
            self.progress["end_time"] = datetime.utcnow()
            
        except Exception as e:
            self.progress["status"] = "error"
            self.progress["error"] = str(e)
            self.progress["end_time"] = datetime.utcnow()
            raise
        
        return self.progress
    
    def get_progress(self) -> Dict[str, Any]:
        """Get current progress status"""
        return self.progress
    
    def reset_progress(self):
        """Reset progress tracking"""
        self.progress = {
            "total_contacts": 0,
            "processed_contacts": 0,
            "status": "idle",
            "start_time": None,
            "end_time": None,
            "error": None
        } 