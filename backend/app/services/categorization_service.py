from typing import List, Dict, Tuple
from ..models.contact import Contact

# Main bucket definitions
MAIN_BUCKETS = {
    "BUSINESS_OPERATIONS": "Business Operations",
    "HEALTH": "Health",
    "SURVIVALIST": "Survivalist",
    "DEFAULT": "Default",
    "CANNOT_PLACE": "Cannot Place"
}

# Personality bucket definitions
PERSONALITY_BUCKETS = {
    "DIGITAL_MARKETING": "Digital Marketing",
    "ENTREPRENEURSHIP": "Entrepreneurship",
    "FITNESS_NUTRITION": "Fitness & Nutrition",
    "HOLISTIC_WELLNESS": "Holistic Wellness",
    "INVESTING_FINANCE": "Investing & Finance",
    "LONGEVITY_HEALTH": "Longevity & Health",
    "MENTAL_EMOTIONAL": "Mental & Emotional Well-being",
    "SELF_RELIANCE": "Self-Reliance & Preparedness",
    "TARGETED_HEALTH": "Targeted Health Solutions",
    "WOMENS_HEALTH": "Women's Health",
    "DEFAULT": "Default",
    "CANNOT_PLACE": "Cannot Place"
}

class CategorizationService:
    def __init__(self):
        # Initialize keyword mappings (to be populated from CSV)
        self.main_bucket_keywords: Dict[str, List[str]] = {}
        self.personality_bucket_keywords: Dict[str, List[str]] = {}
        
    def categorize_contact(self, contact: Contact) -> Tuple[str, str]:
        """
        Categorize a single contact into main and personality buckets.
        Returns a tuple of (main_bucket, personality_bucket)
        """
        if not contact.tags:
            return MAIN_BUCKETS["CANNOT_PLACE"], PERSONALITY_BUCKETS["CANNOT_PLACE"]
            
        # Score each bucket based on keyword matches
        main_scores = self._calculate_bucket_scores(contact.tags, self.main_bucket_keywords)
        personality_scores = self._calculate_bucket_scores(contact.tags, self.personality_bucket_keywords)
        
        # Get highest scoring buckets
        main_bucket = self._get_highest_scoring_bucket(main_scores, MAIN_BUCKETS)
        personality_bucket = self._get_highest_scoring_bucket(personality_scores, PERSONALITY_BUCKETS)
        
        return main_bucket, personality_bucket
    
    def _calculate_bucket_scores(self, tags: List[str], bucket_keywords: Dict[str, List[str]]) -> Dict[str, int]:
        """Calculate scores for each bucket based on tag matches"""
        scores = {bucket: 0 for bucket in bucket_keywords.keys()}
        
        for tag in tags:
            tag_lower = tag.lower()
            for bucket, keywords in bucket_keywords.items():
                if any(keyword.lower() in tag_lower for keyword in keywords):
                    scores[bucket] += 1
                    
        return scores
    
    def _get_highest_scoring_bucket(self, scores: Dict[str, int], bucket_mapping: Dict[str, str]) -> str:
        """Get the highest scoring bucket, defaulting to DEFAULT if no clear winner"""
        if not scores:
            return bucket_mapping["DEFAULT"]
            
        max_score = max(scores.values())
        if max_score == 0:
            return bucket_mapping["DEFAULT"]
            
        # Get all buckets with the maximum score
        max_buckets = [bucket for bucket, score in scores.items() if score == max_score]
        
        # If there's a tie, use the first one (could be enhanced with more sophisticated tie-breaking)
        return bucket_mapping[max_buckets[0]]
    
    def load_keywords_from_csv(self, csv_path: str):
        """Load keyword mappings from CSV file"""
        # TODO: Implement CSV parsing and keyword loading
        pass 