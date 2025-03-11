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
    sound_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id','word','pronunciation', 'sound_file', 'sound_file_url','level', 'level_details','answers']

    def get_sound_file_url(self, obj):
        """คืนค่า URL เต็มของไฟล์เสียง"""
        if obj.sound_file and obj.sound_file.url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.sound_file.url)
            return obj.sound_file.url
        return None
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