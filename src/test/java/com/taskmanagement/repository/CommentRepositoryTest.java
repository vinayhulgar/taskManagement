package com.taskmanagement.repository;

import com.taskmanagement.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for CommentRepository
 */
@DataJpaTest
class CommentRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CommentRepository commentRepository;

    private User user;
    private User author2;
    private Team team;
    private Project project;
    private Task task;
    private Comment parentComment;
    private Comment childComment;
    private Comment anotherComment;

    @BeforeEach
    void setUp() {
        // Create test users
        user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(Role.MEMBER);
        user = entityManager.persistAndFlush(user);

        author2 = new User();
        author2.setEmail("author2@example.com");
        author2.setPasswordHash("hashedPassword");
        author2.setFirstName("Author");
        author2.setLastName("Two");
        author2.setRole(Role.MEMBER);
        author2 = entityManager.persistAndFlush(author2);

        // Create team
        team = new Team();
        team.setName("Test Team");
        team.setDescription("Test Description");
        team.setOwner(user);
        team = entityManager.persistAndFlush(team);

        // Create project
        project = new Project();
        project.setTeam(team);
        project.setName("Test Project");
        project.setDescription("Test Description");
        project.setStatus(ProjectStatus.ACTIVE);
        project.setCreatedBy(user);
        project = entityManager.persistAndFlush(project);

        // Create task
        task = new Task();
        task.setProject(project);
        task.setTitle("Test Task");
        task.setDescription("Test Description");
        task.setStatus(TaskStatus.TODO);
        task.setPriority(Priority.MEDIUM);
        task.setAssignee(user);
        task.setCreatedBy(user);
        task = entityManager.persistAndFlush(task);

        // Create parent comment
        parentComment = new Comment();
        parentComment.setTask(task);
        parentComment.setAuthor(user);
        parentComment.setContent("This is a parent comment");
        parentComment = entityManager.persistAndFlush(parentComment);

        // Create child comment (reply)
        childComment = new Comment();
        childComment.setTask(task);
        childComment.setAuthor(author2);
        childComment.setParentComment(parentComment);
        childComment.setContent("This is a reply to the parent comment");
        childComment = entityManager.persistAndFlush(childComment);

        // Create another comment
        anotherComment = new Comment();
        anotherComment.setTask(task);
        anotherComment.setAuthor(author2);
        anotherComment.setContent("This comment mentions @test@example.com");
        anotherComment = entityManager.persistAndFlush(anotherComment);

        entityManager.clear();
    }

    @Test
    void findByTask_Success() {
        // Act
        List<Comment> comments = commentRepository.findByTask(task);

        // Assert
        assertEquals(3, comments.size());
    }

    @Test
    void findByTaskId_Success() {
        // Act
        List<Comment> comments = commentRepository.findByTaskId(task.getId());

        // Assert
        assertEquals(3, comments.size());
    }

    @Test
    void findByTaskIdWithPagination_Success() {
        // Act
        Pageable pageable = PageRequest.of(0, 2);
        Page<Comment> commentPage = commentRepository.findByTaskId(task.getId(), pageable);

        // Assert
        assertEquals(3, commentPage.getTotalElements());
        assertEquals(2, commentPage.getContent().size());
        assertEquals(2, commentPage.getTotalPages());
    }

    @Test
    void findByAuthor_Success() {
        // Act
        List<Comment> userComments = commentRepository.findByAuthor(user);
        List<Comment> author2Comments = commentRepository.findByAuthor(author2);

        // Assert
        assertEquals(1, userComments.size());
        assertEquals("This is a parent comment", userComments.get(0).getContent());
        
        assertEquals(2, author2Comments.size());
    }

    @Test
    void findByAuthorId_Success() {
        // Act
        List<Comment> userComments = commentRepository.findByAuthorId(user.getId());

        // Assert
        assertEquals(1, userComments.size());
        assertEquals("This is a parent comment", userComments.get(0).getContent());
    }

    @Test
    void findByParentComment_Success() {
        // Act
        List<Comment> replies = commentRepository.findByParentComment(parentComment);

        // Assert
        assertEquals(1, replies.size());
        assertEquals("This is a reply to the parent comment", replies.get(0).getContent());
        assertEquals(parentComment.getId(), replies.get(0).getParentComment().getId());
    }

    @Test
    void findByParentCommentId_Success() {
        // Act
        List<Comment> replies = commentRepository.findByParentCommentId(parentComment.getId());

        // Assert
        assertEquals(1, replies.size());
        assertEquals("This is a reply to the parent comment", replies.get(0).getContent());
    }

    @Test
    void findByTaskAndParentCommentIsNull_Success() {
        // Act
        List<Comment> rootComments = commentRepository.findByTaskAndParentCommentIsNull(task);

        // Assert
        assertEquals(2, rootComments.size());
        assertTrue(rootComments.stream().allMatch(c -> c.getParentComment() == null));
        assertTrue(rootComments.stream().anyMatch(c -> c.getContent().equals("This is a parent comment")));
        assertTrue(rootComments.stream().anyMatch(c -> c.getContent().contains("mentions")));
    }

    @Test
    void findByTaskIdAndParentCommentIsNull_Success() {
        // Act
        List<Comment> rootComments = commentRepository.findByTaskIdAndParentCommentIsNull(task.getId());

        // Assert
        assertEquals(2, rootComments.size());
    }

    @Test
    void findByTaskIdAndParentCommentIsNullWithPagination_Success() {
        // Act
        Pageable pageable = PageRequest.of(0, 1);
        Page<Comment> commentPage = commentRepository.findByTaskIdAndParentCommentIsNull(task.getId(), pageable);

        // Assert
        assertEquals(2, commentPage.getTotalElements());
        assertEquals(1, commentPage.getContent().size());
        assertEquals(2, commentPage.getTotalPages());
    }

    @Test
    void findByCreatedAtAfter_Success() {
        // Act
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        List<Comment> recentComments = commentRepository.findByCreatedAtAfter(yesterday);

        // Assert
        assertEquals(3, recentComments.size());
    }

    @Test
    void findByTaskAndCreatedAtAfter_Success() {
        // Act
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        List<Comment> recentComments = commentRepository.findByTaskAndCreatedAtAfter(task, yesterday);

        // Assert
        assertEquals(3, recentComments.size());
    }

    @Test
    void findByTaskIdAndCreatedAtAfter_Success() {
        // Act
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);
        List<Comment> recentComments = commentRepository.findByTaskIdAndCreatedAtAfter(task.getId(), yesterday);

        // Assert
        assertEquals(3, recentComments.size());
    }

    @Test
    void countByTask_Success() {
        // Act
        long commentCount = commentRepository.countByTask(task);

        // Assert
        assertEquals(3, commentCount);
    }

    @Test
    void countByTaskId_Success() {
        // Act
        long commentCount = commentRepository.countByTaskId(task.getId());

        // Assert
        assertEquals(3, commentCount);
    }

    @Test
    void countByAuthor_Success() {
        // Act
        long userCommentCount = commentRepository.countByAuthor(user);
        long author2CommentCount = commentRepository.countByAuthor(author2);

        // Assert
        assertEquals(1, userCommentCount);
        assertEquals(2, author2CommentCount);
    }

    @Test
    void findByContentContainingIgnoreCase_Success() {
        // Act
        List<Comment> commentsWithParent = commentRepository.findByContentContainingIgnoreCase("PARENT");
        List<Comment> commentsWithReply = commentRepository.findByContentContainingIgnoreCase("reply");

        // Assert
        assertEquals(2, commentsWithParent.size()); // parent comment and reply mentioning parent
        assertEquals(1, commentsWithReply.size());
    }

    @Test
    void findByTaskIdAndContentContaining_Success() {
        // Act
        List<Comment> comments = commentRepository.findByTaskIdAndContentContaining(task.getId(), "parent");

        // Assert
        assertEquals(2, comments.size());
    }

    @Test
    void findRecentCommentsByTaskId_Success() {
        // Act
        LocalDateTime sinceDate = LocalDateTime.now().minusHours(1);
        List<Comment> recentComments = commentRepository.findRecentCommentsByTaskId(task.getId(), sinceDate);

        // Assert
        assertEquals(3, recentComments.size());
        // Should be ordered by createdAt DESC
        assertTrue(recentComments.get(0).getCreatedAt().isAfter(recentComments.get(1).getCreatedAt()) ||
                  recentComments.get(0).getCreatedAt().equals(recentComments.get(1).getCreatedAt()));
    }

    @Test
    void findCommentsMentioningUser_Success() {
        // Act
        List<Comment> mentionComments = commentRepository.findCommentsMentioningUser("test");

        // Assert
        assertEquals(1, mentionComments.size());
        assertTrue(mentionComments.get(0).getContent().contains("@test@example.com"));
    }

    @Test
    void findByTaskIds_Success() {
        // Create another task and comment
        Task anotherTask = new Task();
        anotherTask.setProject(project);
        anotherTask.setTitle("Another Task");
        anotherTask.setDescription("Another Description");
        anotherTask.setStatus(TaskStatus.TODO);
        anotherTask.setPriority(Priority.LOW);
        anotherTask.setCreatedBy(user);
        anotherTask = entityManager.persistAndFlush(anotherTask);

        Comment anotherTaskComment = new Comment();
        anotherTaskComment.setTask(anotherTask);
        anotherTaskComment.setAuthor(user);
        anotherTaskComment.setContent("Comment on another task");
        entityManager.persistAndFlush(anotherTaskComment);

        // Act
        List<Comment> comments = commentRepository.findByTaskIds(
                List.of(task.getId(), anotherTask.getId()));

        // Assert
        assertEquals(4, comments.size()); // 3 from original task + 1 from new task
    }

    @Test
    void findCommentsWithReplyCount_Success() {
        // Act
        List<Object[]> results = commentRepository.findCommentsWithReplyCount(task.getId());

        // Assert
        assertEquals(2, results.size()); // 2 root comments
        
        // Find the parent comment result
        Object[] parentResult = results.stream()
                .filter(result -> ((Comment) result[0]).getContent().equals("This is a parent comment"))
                .findFirst()
                .orElse(null);
        
        assertNotNull(parentResult);
        assertEquals(1L, parentResult[1]); // Should have 1 reply
        
        // Find the mention comment result
        Object[] mentionResult = results.stream()
                .filter(result -> ((Comment) result[0]).getContent().contains("mentions"))
                .findFirst()
                .orElse(null);
        
        assertNotNull(mentionResult);
        assertEquals(0L, mentionResult[1]); // Should have 0 replies
    }
}