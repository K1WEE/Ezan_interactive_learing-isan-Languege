from django.db import models
import uuid

class Level(models.Model):
    name = models.CharField(max_length=100)
    number = models.IntegerField(unique=True)
    description = models.TextField(blank=True,null=True)
    def __str__(self):
        return f"Level {self.number}: {self.name}"
    class Meta: 
        ordering = ['number']

class Question(models.Model):
    uid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    word = models.CharField(max_length=100)
    pronunciation = models.CharField(max_length=100)
    sound_file = models.FileField(upload_to='question_sounds/', null=True, blank=True)
    level = models.ForeignKey(
        Level, 
        on_delete=models.CASCADE, 
        related_name='questions',
        null=True, 
        blank=True  
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.word

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    thai_text = models.CharField(max_length=100)
    english_text = models.CharField(max_length=100)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.thai_text} ({self.english_text})"

class Score(models.Model):
    player_name = models.CharField(max_length=100, blank=True, null=True)
    score = models.IntegerField()
    max_score = models.IntegerField()
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='scores')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player_name} - {self.score}/{self.max_score}"

class Vocabulary(models.Model):
    CATEGORY_CHOICES = [
        ('Noun', 'Noun'),
        ('Pronoun', 'Pronoun'),
        ('Verb', 'Verb'),
        ('Adverb', 'Adverb'),
        ('Adjective', 'Adjective'),
        ('Conjunction', 'Conjunction'),
        ('Phrase', 'Phrase'),
        ('Preposition', 'Preposition'),
        ('Time', 'Time'),
        ('Clothes', 'Clothes'),
        ('Plants', 'Plants'),
        ('Animals', 'Animals'),
        ('Utensils', 'Utensils'),
    ]
    
    word = models.CharField(max_length=100, verbose_name="คำศัพท์")
    pronunciation = models.CharField(max_length=100, verbose_name="คำอ่าน")
    thai_translation = models.CharField(max_length=100, verbose_name="คำแปลภาษาไทย")
    english_translation = models.CharField(max_length=100, verbose_name="คำแปลภาษาอังกฤษ")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name="หมวดหมู่")
    sound_file = models.FileField(upload_to='vocabulary_sounds/', null=True, blank=True, verbose_name="ไฟล์เสียง")
    
    def __str__(self):
        return f"{self.word} ({self.category})"
    
    class Meta:
        verbose_name = "คำศัพท์"
        verbose_name_plural = "คำศัพท์"
        ordering = ['category', 'word']