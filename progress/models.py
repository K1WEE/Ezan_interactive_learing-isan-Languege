from django.db import models
from django.contrib.auth.models import User
from api_data.models import Level, Question, Answer

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    is_unlocked = models.BooleanField(default=False)
    score = models.IntegerField(default=0)
    max_score = models.IntegerField(default=0)
    completion_date = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'level']
        ordering = ['level__number']
    
    def __str__(self):
        return f"{self.user.username} - Level {self.level.number}"
    
    @property
    def percentage_score(self):
        if self.max_score == 0:
            return 0
        return (self.score / self.max_score) * 100
    
    @property
    def has_passed(self):
        """User passes if they scored 80% or higher"""
        return self.percentage_score >= 80

class QuestionAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='question_attempts')
    progress = models.ForeignKey(UserProgress, on_delete=models.CASCADE, related_name='question_attempts')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE)
    is_correct = models.BooleanField()
    attempt_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-attempt_date']
    
    def __str__(self):
        return f"{self.user.username} - {self.question.word} - {'Correct' if self.is_correct else 'Incorrect'}"