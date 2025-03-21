from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from api_data.models import Level, Question, Answer
from .models import UserProgress, QuestionAttempt
from .serializers import UserProgressSerializer, UserProgressDetailSerializer, QuestionAttemptSerializer
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
import logging

# เพิ่ม logger สำหรับบันทึกข้อมูลการทำงาน
logger = logging.getLogger(__name__)

class IsUserOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow users to edit their own progress.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user

class UserProgressViewSet(viewsets.ModelViewSet):
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsUserOrReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        return UserProgress.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserProgressDetailSerializer
        return UserProgressSerializer
    
    @action(detail=False, methods=['get'])
    def user_levels(self, request):
        """Get all levels with user progress information"""
        logger.info(f"User levels requested by user: {request.user.username}")
        user = request.user
        
        # Get all levels
        levels = Level.objects.all().order_by('number')
        logger.debug(f"Found {levels.count()} levels")
        
        # Get user progress for all levels
        user_progress = UserProgress.objects.filter(user=user)
        logger.debug(f"Found {user_progress.count()} progress records for user")
        
        # Prepare data for each level
        result = []
        for level in levels:
            # Find user progress for this level, or create default data
            progress = user_progress.filter(level=level).first()
            
            if progress:
                # User has progress for this level
                level_data = {
                    'id': level.id,
                    'number': level.number,
                    'name': level.name,
                    'description': level.description,
                    'is_completed': progress.is_completed,
                    'is_unlocked': progress.is_unlocked,
                    'score': progress.score,
                    'max_score': progress.max_score,
                    'percentage_score': progress.percentage_score,
                    'has_passed': progress.has_passed
                }
            else:
                # Default data for level with no progress
                level_data = {
                    'id': level.id,
                    'number': level.number,
                    'name': level.name,
                    'description': level.description,
                    'is_completed': False,
                    'is_unlocked': level.number == 1,  # First level is unlocked by default
                    'score': 0,
                    'max_score': 0,
                    'percentage_score': 0,
                    'has_passed': False
                }
            
            result.append(level_data)
        
        logger.info(f"Returning data for {len(result)} levels")
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def submit_quiz(self, request):
        """Submit quiz answers and update progress"""
        logger.info(f"Submit quiz called by user: {request.user.username}")
        logger.debug(f"Submit quiz data: {request.data}")
        
        try:
            user = request.user
            level_id = request.data.get('level_id')
            answers = request.data.get('answers', [])
            
            logger.debug(f"User: {user.username}, Level ID: {level_id}, Answers count: {len(answers)}")
            
            if not level_id or not answers:
                logger.warning("Missing level_id or answers in request")
                return Response({'error': 'level_id and answers are required'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            level = get_object_or_404(Level, id=level_id)
            logger.debug(f"Found level: {level.name} (Level {level.number})")
            
            # Get or create progress for this level
            progress, created = UserProgress.objects.get_or_create(
                user=user,
                level=level,
                defaults={'is_unlocked': True}  # New progress is unlocked by default
            )
            logger.debug(f"{'Created new' if created else 'Using existing'} progress record")
            
            # Process answers
            correct_count = 0
            max_score = len(answers)
            
            for answer_data in answers:
                question_id = answer_data.get('question_id')
                answer_id = answer_data.get('answer_id')
                
                if not question_id or not answer_id:
                    logger.warning(f"Skipping invalid answer data: {answer_data}")
                    continue
                
                question = get_object_or_404(Question, id=question_id)
                answer = get_object_or_404(Answer, id=answer_id)
                
                # Check if answer is correct
                is_correct = answer.is_correct
                if is_correct:
                    correct_count += 1
                
                # Save question attempt
                QuestionAttempt.objects.create(
                    user=user,
                    progress=progress,
                    question=question,
                    answer=answer,
                    is_correct=is_correct
                )
                logger.debug(f"Recorded attempt for question {question.word}: {'Correct' if is_correct else 'Incorrect'}")
            
            # Update progress
            progress.score = correct_count
            progress.max_score = max_score
            
            # Mark as completed if attempted
            if max_score > 0:
                progress.is_completed = True
                progress.completion_date = timezone.now()
            
            progress.save()
            logger.info(f"Updated progress: score={correct_count}/{max_score} ({progress.percentage_score:.1f}%)")
            
            # Unlock next level if passed (80% or higher)
            if progress.has_passed:
                next_level = Level.objects.filter(number=level.number + 1).first()
                if next_level:
                    logger.info(f"Unlocking next level: {next_level.name} (Level {next_level.number})")
                    next_progress, created = UserProgress.objects.get_or_create(
                        user=user,
                        level=next_level,
                        defaults={'is_unlocked': True}
                    )
                    if not next_progress.is_unlocked:
                        next_progress.is_unlocked = True
                        next_progress.save()
                        logger.info(f"Next level {next_level.number} unlocked")
                else:
                    logger.info("No next level to unlock")
            else:
                logger.info(f"Level not passed ({progress.percentage_score:.1f}%), no next level unlocked")
            
            serializer = UserProgressDetailSerializer(progress)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in submit_quiz: {str(e)}", exc_info=True)
            return Response({'error': 'An error occurred while processing your quiz submission'},
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def incorrect_questions(self, request):
        """Get questions that the user answered incorrectly in their most recent attempt"""
        logger.info(f"Incorrect questions requested by user: {request.user.username}")
        user = request.user
        level_id = request.query_params.get('level_id')
        
        base_query = Q(user=user)
        if level_id:
            base_query &= Q(question__level_id=level_id)
            logger.debug(f"Filtering by level ID: {level_id}")
        
        # Get all question IDs attempted by the user for this level
        all_attempted_question_ids = QuestionAttempt.objects.filter(
            base_query
        ).values_list('question_id', flat=True).distinct()
        logger.debug(f"Total distinct questions attempted: {len(all_attempted_question_ids)}")
        
        # Find incorrectly answered questions based on the most recent attempt
        incorrect_question_ids = []
        
        for question_id in all_attempted_question_ids:
            # Get the most recent attempt for this question
            latest_attempt = QuestionAttempt.objects.filter(
                user=user,
                question_id=question_id
            ).order_by('-attempt_date').first()
            
            # If the most recent attempt is incorrect, add to our list
            if latest_attempt and not latest_attempt.is_correct:
                incorrect_question_ids.append(question_id)
        
        logger.debug(f"Found {len(incorrect_question_ids)} questions with incorrect latest attempts")
        
        # Fetch the full question objects
        questions = Question.objects.filter(id__in=incorrect_question_ids)
        
        from api_data.serializers import QuestionSerializer
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)

class QuestionAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuestionAttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return QuestionAttempt.objects.filter(user=user)

@login_required
def review_view(request):
    """View for reviewing incorrect answers"""
    logger.info(f"Review view accessed by user: {request.user.username}")
    return render(request, 'progress/review.html')