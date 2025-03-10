from rest_framework import serializers
from .models import Level,Answer,Question,Score


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ['id', 'name', 'number','description']

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'thai_text', 'english_text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)
    level_details = LevelSerializer(source='level', read_only=True)

    class Meta:
        model = Question
        fields = ['id','word','pronunciation', 'sound_file','level', 'level_details','answers']
    def create(self, validated_data):
        answer_data = validated_data.pop('answers')
        question = Question.objects.create(**validated_data)
        for answer in answer_data :
            Answer.objects.create(question=question, **answer)
        return question

class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ['id', 'player_name', 'score', 'max_score', 'level', 'created_at']
        read_only_fields = ['created_at']