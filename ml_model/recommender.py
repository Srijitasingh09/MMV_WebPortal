import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RecommendationSystem:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.resources_df = None
        self.tfidf_matrix = None

    def prepare_data(self, resources_list):
        """
        resources_list: List of dicts containing 'id', 'name', 'description', 'type', 'tags'
        """
        if not resources_list:
            return
            
        self.resources_df = pd.DataFrame(resources_list)
        
        # Combine name, description and tags into a single feature string
        def combine_features(row):
            tags_value = row.get('tags', [])
            if isinstance(tags_value, list):
                tags = " ".join(str(t) for t in tags_value if t)
            else:
                tags = str(tags_value or "")

            name = str(row.get('name') or "")
            description = str(row.get('description') or "")
            item_type = str(row.get('type') or "Resource")
            return f"{name} {description} {tags} {item_type}".strip()

        self.resources_df['combined_features'] = self.resources_df.apply(combine_features, axis=1)
        self.tfidf_matrix = self.vectorizer.fit_transform(self.resources_df['combined_features'])

    def _normalize_list(self, value):
        if value is None:
            return []
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        if isinstance(value, str):
            cleaned = value.strip()
            return [cleaned] if cleaned else []
        return [str(value).strip()]

    def _fallback_recommendations(self, top_n=5):
        if self.resources_df is None or self.resources_df.empty:
            return []

        fallback_items = self.resources_df.head(top_n).to_dict(orient='records')
        return [
            {
                "id": item.get('id'),
                "name": item.get('name'),
                "description": item.get('description'),
                "type": item.get('type'),
                "explanation": "Recommended starter resource. Add your interests for more personalized matches.",
                "score": 0.0,
            }
            for item in fallback_items
        ]

    def recommend(self, user_interests, user_problems, top_n=5):
        if self.resources_df is None or self.tfidf_matrix is None:
            return []

        interests = self._normalize_list(user_interests)
        problems = self._normalize_list(user_problems)

        # Combine user's interests and problems into a single query string
        user_query = (" ".join(interests) + " " + " ".join(problems)).strip()
        if not user_query:
            return self._fallback_recommendations(top_n=top_n)
        
        # Vectorize the user query
        user_vector = self.vectorizer.transform([user_query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(user_vector, self.tfidf_matrix).flatten()
        
        # Get top indices
        top_indices = similarities.argsort()[-top_n:][::-1]
        
        recommendations = []
        for idx in top_indices:
            if similarities[idx] > 0:
                item = self.resources_df.iloc[idx].to_dict()
                
                # Determine explanation
                combined = str(item.get('combined_features') or '').lower()
                matched_interests = [i for i in interests if i.lower() in combined]
                matched_problems = [p for p in problems if p.lower() in combined]
                
                explanation = ""
                if matched_interests:
                    explanation = f"Recommended because you are interested in {', '.join(matched_interests)}."
                elif matched_problems:
                    explanation = f"Recommended based on the challenges you selected: {', '.join(matched_problems)}."
                else:
                    explanation = "Recommended as a valuable resource for your department."

                recommendations.append({
                    "id": item['id'],
                    "name": item['name'],
                    "description": item['description'],
                    "type": item['type'],
                    "explanation": explanation,
                    "score": float(similarities[idx])
                })

            if not recommendations:
                return self._fallback_recommendations(top_n=top_n)

            if len(recommendations) < top_n:
                existing_ids = {rec["id"] for rec in recommendations}
                for item in self._fallback_recommendations(top_n=top_n):
                    if item["id"] in existing_ids:
                        continue
                    recommendations.append(item)
                    if len(recommendations) >= top_n:
                        break

            return recommendations
