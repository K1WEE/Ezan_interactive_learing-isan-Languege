from rest_framework import viewsets,filters
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.parsers import MultiPartParser,FormParser,JSONParser
from .models import *
from .serializers import *
from .serializers import ScoreSerializer

class VocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet สำหรับแสดงข้อมูลคำศัพท์"""
    queryset = Vocabulary.objects.all()
    serializer_class = VocabularySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['word', 'pronunciation', 'thai_translation', 'english_translation', 'category']
    ordering_fields = ['word', 'category']
    
    def get_queryset(self):
        queryset = Vocabulary.objects.all()
        
        # กรองตามหมวดหมู่
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        
        return queryset


class LevelViewSet(viewsets.ModelViewSet):
    queryset = Level.objects.all().order_by('number')
    serializer_class = LevelSerializer

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    parser_classes = [MultiPartParser,FormParser,JSONParser]

    def get_queryset(self):
        queryset = Question.objects.all()

        level_id = self.request.query_params.get('level_id', None)
        if level_id :
            queryset = queryset.filter(level_id = level_id)

        level_number = self.request.query_params.get('level_number', None)
        if level_number :
            queryset = queryset.filter(level_number = level_number)

        return queryset

class QuestionsByLevelView(ListAPIView):
    serializer_class = QuestionSerializer
    
    def get_serializer_context(self):
        """เพิ่ม request ใน context"""
        context = super().get_serializer_context()
        return context
    
    def get_queryset(self):
        level_id = self.kwargs.get('level_id')
        return Question.objects.filter(level=level_id)

class ScoreViewSet(viewsets.ModelViewSet):
    queryset = Score.objects.all().order_by('-created_at')
    serializer_class = ScoreSerializer
    
    def create(self, request, *args, **kwargs):
        # รับข้อมูลจาก request
        data = request.data
        
        # สร้าง serializer จากข้อมูลที่ได้รับ
        serializer = self.get_serializer(data=data)
        
        # ตรวจสอบความถูกต้องของข้อมูล
        if serializer.is_valid():
            # บันทึกข้อมูล
            self.perform_create(serializer)
            
            # ส่งข้อมูลกลับพร้อมสถานะ 201 Created
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # ถ้าข้อมูลไม่ถูกต้อง ส่งข้อผิดพลาดกลับ
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
