package com.taskmanagement.service;

import com.taskmanagement.dto.CommentCreateRequest;
import com.taskmanagement.dto.CommentResponse;
import com.taskmanagement.dto.CommentUpdateRequest;
import com.taskmanagement.entity.*;
import com.taskmanagement.repository.CommentRepository;
import com.taskmanagement.repository.TaskRepository;
import com.taskmanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test class for CommentService
 */
@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CommentService commentService;

    private UUID taskId;
    private UUID commentId;
    private UUID userId;
    private UUID parentCommentId;
    private Task task;
    private Comment comment;
    private Comment parentComment;
    private User user;
    private Project project;
    private CommentCreateRequest commentCreateRequest;
    private CommentUpdateRequest commentUpdateRequest;

    @BeforeEach
    void setUp() {
        taskId = UUID.randomUUID();
        commentId = UUID.randomUUID();
        userId = UUID.randomUUID();
        parentCommentId = UUID.randomUUID();

        // Create test entities
        user = new User();
        user.setId(userId);
        user.setEmail("test@example.com");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.MEMBER);

        project = new Project();
        project.setId(UUID.randomUUID());
        project.setName("Test Project");

        task = new Task();
        task.setId(taskId);
        task.setProject(project);
        task.setTitle("Test Task");
        task.setDescription("Test Description");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.MEDIUM);
        task.setCreatedBy(user);

        parentComment = new Comment();
        parentComment.setId(parentCommentId);
        parentComment.setTask(task);
        parentComment.setAuthor(user);
        parentComment.setContent("Parent comment");
        parentComment.setCreatedAt(LocalDateTime.now());

        comment = new Comment();
        comment.setId(commentId);
        comment.setTask(task);
        comment.setAuthor(user);
        comment.setContent("Test comment");
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        // Create test DTOs
        commentCreateRequest = new CommentCreateRequest();
        commentCreateRequest.setContent("New comment content");

        commentUpdateRequest = new CommentUpdateRequest();
        commentUpdateRequest.setContent("Updated comment content");
    }

    @Test
    void createComment_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(commentRepository.findByParentCommentId(any(UUID.class))).thenReturn(Arrays.asList());

        // Act
        CommentResponse result = commentService.createComment(taskId, commentCreateRequest, userId);

        // Assert
        assertNotNull(result);
        assertEquals(commentId, result.getId());
        assertEquals(taskId, result.getTaskId());
        assertEquals("Test comment", result.getContent());
        assertEquals(user.getEmail(), result.getAuthor().getEmail());

        verify(commentRepository).save(any(Comment.class));
        verify(notificationService, never()).sendTaskCommentNotification(any(Task.class), any(Comment.class));
    }

    @Test
    void createComment_WithAssigneeNotification_Success() {
        // Arrange
        User assignee = new User();
        assignee.setId(UUID.randomUUID());
        assignee.setEmail("assignee@example.com");
        task.setAssignee(assignee);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(commentRepository.findByParentCommentId(any(UUID.class))).thenReturn(Arrays.asList());

        // Act
        CommentResponse result = commentService.createComment(taskId, commentCreateRequest, userId);

        // Assert
        assertNotNull(result);
        verify(notificationService).sendTaskCommentNotification(task, comment);
    }

    @Test
    void createComment_WithParentComment_Success() {
        // Arrange
        commentCreateRequest.setParentCommentId(parentCommentId);
        comment.setParentComment(parentComment);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.findById(parentCommentId)).thenReturn(Optional.of(parentComment));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(commentRepository.findByParentCommentId(any(UUID.class))).thenReturn(Arrays.asList());

        // Act
        CommentResponse result = commentService.createComment(taskId, commentCreateRequest, userId);

        // Assert
        assertNotNull(result);
        assertEquals(parentCommentId, result.getParentCommentId());
    }

    @Test
    void createComment_TaskNotFound_ThrowsException() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                commentService.createComment(taskId, commentCreateRequest, userId));

        assertEquals("Task not found", exception.getMessage());
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void createComment_ParentCommentNotFound_ThrowsException() {
        // Arrange
        commentCreateRequest.setParentCommentId(parentCommentId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.findById(parentCommentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                commentService.createComment(taskId, commentCreateRequest, userId));

        assertEquals("Parent comment not found", exception.getMessage());
    }

    @Test
    void getTaskComments_Success() {
        // Arrange
        Page<Comment> commentPage = new PageImpl<>(Arrays.asList(comment));
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(commentRepository.findByTaskIdAndParentCommentIsNull(eq(taskId), any(Pageable.class)))
                .thenReturn(commentPage);
        when(commentRepository.findByParentCommentId(commentId)).thenReturn(Arrays.asList());

        // Act
        List<CommentResponse> result = commentService.getTaskComments(taskId, 0, 20, userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(commentId, result.get(0).getId());
    }

    @Test
    void getAllTaskComments_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(commentRepository.findByTaskIdAndParentCommentIsNull(taskId)).thenReturn(Arrays.asList(comment));
        when(commentRepository.findByParentCommentId(commentId)).thenReturn(Arrays.asList());

        // Act
        List<CommentResponse> result = commentService.getAllTaskComments(taskId, userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(commentId, result.get(0).getId());
    }

    @Test
    void getCommentById_Success() {
        // Arrange
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentRepository.findByParentCommentId(commentId)).thenReturn(Arrays.asList());

        // Act
        CommentResponse result = commentService.getCommentById(commentId, userId);

        // Assert
        assertNotNull(result);
        assertEquals(commentId, result.getId());
        assertEquals("Test comment", result.getContent());
    }

    @Test
    void getCommentById_CommentNotFound_ThrowsException() {
        // Arrange
        when(commentRepository.findById(commentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                commentService.getCommentById(commentId, userId));

        assertEquals("Comment not found", exception.getMessage());
    }

    @Test
    void updateComment_Success() {
        // Arrange
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);
        when(commentRepository.findByParentCommentId(any(UUID.class))).thenReturn(Arrays.asList());

        // Act
        CommentResponse result = commentService.updateComment(commentId, commentUpdateRequest, userId);

        // Assert
        assertNotNull(result);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void updateComment_NotAuthor_ThrowsException() {
        // Arrange
        UUID otherUserId = UUID.randomUUID();
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                commentService.updateComment(commentId, commentUpdateRequest, otherUserId));

        assertEquals("You can only edit your own comments", exception.getMessage());
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void deleteComment_Success() {
        // Arrange
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.findByParentCommentId(commentId)).thenReturn(Arrays.asList());

        // Act
        commentService.deleteComment(commentId, userId);

        // Assert
        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteComment_HasReplies_ThrowsException() {
        // Arrange
        Comment reply = new Comment();
        reply.setId(UUID.randomUUID());
        reply.setParentComment(comment);

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(commentRepository.findByParentCommentId(commentId)).thenReturn(Arrays.asList(reply));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                commentService.deleteComment(commentId, userId));

        assertEquals("Cannot delete comment with replies. Delete replies first.", exception.getMessage());
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void deleteComment_NotAuthorOrAdmin_ThrowsException() {
        // Arrange
        UUID otherUserId = UUID.randomUUID();
        User otherUser = new User();
        otherUser.setId(otherUserId);
        otherUser.setRole(Role.MEMBER);

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(userRepository.findById(otherUserId)).thenReturn(Optional.of(otherUser));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                commentService.deleteComment(commentId, otherUserId));

        assertEquals("You can only delete your own comments or you need admin/manager privileges", exception.getMessage());
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void getRecentComments_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(commentRepository.findRecentCommentsByTaskId(eq(taskId), any(LocalDateTime.class)))
                .thenReturn(Arrays.asList(comment));
        when(commentRepository.findByParentCommentId(any(UUID.class))).thenReturn(Arrays.asList());

        // Act
        List<CommentResponse> result = commentService.getRecentComments(taskId, 7, userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(commentId, result.get(0).getId());
    }

    @Test
    void searchComments_Success() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(commentRepository.findByTaskIdAndContentContaining(taskId, "test"))
                .thenReturn(Arrays.asList(comment));
        when(commentRepository.findByParentCommentId(any(UUID.class))).thenReturn(Arrays.asList());

        // Act
        List<CommentResponse> result = commentService.searchComments(taskId, "test", userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(commentId, result.get(0).getId());
    }

    @Test
    void searchComments_EmptySearchTerm_ReturnsEmptyList() {
        // Arrange
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        // Act
        List<CommentResponse> result = commentService.searchComments(taskId, "", userId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(commentRepository, never()).findByTaskIdAndContentContaining(any(UUID.class), anyString());
    }
}