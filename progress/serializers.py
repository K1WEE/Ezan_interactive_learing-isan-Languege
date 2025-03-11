from rest_framework import serializers
from .models import UserProgress, QuestionAttempt
from api_data.serializers import LevelSerializer, QuestionSerializer


class QuestionAttemptSerializer(serializers.ModelSerializer):
    question_details = QuestionSerializer(source='question', read_only=True)

    class Meta:
        model = QuestionAttempt
        fields = ['id', 'question', 'answer', 'is_correct',
                  'attempt_date', 'question_details']
        read_only_fields = ['attempt_date']


class UserProgressSerializer(serializers.ModelSerializer):
    level_details = LevelSerializer(source='level', read_only=True)
    percentage_score = serializers.FloatField(read_only=True)
    has_passed = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserProgress
        fields = ['id', 'user', 'level', 'is_completed', 'is_unlocked',
                  'score', 'max_score', 'percentage_score', 'has_passed',
                  'completion_date', 'level_details']
        read_only_fields = ['completion_date']


class UserProgressDetailSerializer(UserProgressSerializer):
    question_attempts = QuestionAttemptSerializer(many=True, read_only=True)

    class Meta(UserProgressSerializer.Meta):
        fields = UserProgressSerializer.Meta.fields + ['question_attempts']
