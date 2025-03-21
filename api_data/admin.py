from django.contrib import admin
from .models import *


@admin.register(Level) 
class LevelAdmin(admin.ModelAdmin):
    list_display = ('number', 'name','description')
    ordering = ['number']
    search_fields = ['number']

class AnswerInline(admin.TabularInline):  # เปลี่ยนชื่อ class
    model = Answer
    extra = 4

@admin.register(Question)
class WordAdmin(admin.ModelAdmin):
    inlines = [AnswerInline]  # เปลี่ยนชื่อ inline
    list_display = ['word', 'pronunciation', 'get_level_number', 'sound_file']  
    list_filter = ['level']  
    search_fields = ['word', 'pronunciation']

    def get_level_number(self,obj):
        return obj.level.number if obj.level else None
    get_level_number.short_description = 'Level'
    get_level_number.admin_order_field = 'level__number'

@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ['player_name', 'score', 'max_score', 'level', 'created_at']
    list_filter = ['level', 'created_at']
    search_fields = ['player_name']


@admin.register(Vocabulary)
class VocabularyAdmin(admin.ModelAdmin):
    list_display = ('word', 'pronunciation', 'thai_translation', 'english_translation', 'category')
    list_filter = ('category',)
    search_fields = ('word', 'pronunciation', 'thai_translation', 'english_translation')
    ordering = ('category', 'word')
