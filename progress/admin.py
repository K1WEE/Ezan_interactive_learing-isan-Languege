from django.contrib import admin
from .models import UserProgress, QuestionAttempt

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'level', 'score', 'max_score', 'percentage_score', 'is_completed', 'is_unlocked', 'completion_date']
    list_filter = ['user', 'level', 'is_completed', 'is_unlocked']
    search_fields = ['user__username', 'level__name']
    
    def percentage_score(self, obj):
        return f"{obj.percentage_score:.1f}%"
    percentage_score.short_description = 'Score (%)'

@admin.register(QuestionAttempt)
class QuestionAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'question', 'is_correct', 'attempt_date']
    list_filter = ['user', 'is_correct', 'question__level']
    search_fields = ['user__username', 'question__word']