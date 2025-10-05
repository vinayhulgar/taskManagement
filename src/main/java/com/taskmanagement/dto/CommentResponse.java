package com.taskmanagement.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for comment responses
 */
public class CommentResponse {
    
    private UUID id;
    private UUID taskId;
    private String taskTitle;
    private UserResponse author;
    private String content;
    private UUID parentCommentId;
    private boolean isEdited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CommentResponse> replies;
    private int replyCount;
    private List<String> mentionedUsers;
    
    // Default constructor
    public CommentResponse() {}
    
    // Constructor with required fields
    public CommentResponse(UUID id, UUID taskId, String taskTitle, UserResponse author, 
                          String content, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getTaskId() {
        return taskId;
    }
    
    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }
    
    public String getTaskTitle() {
        return taskTitle;
    }
    
    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }
    
    public UserResponse getAuthor() {
        return author;
    }
    
    public void setAuthor(UserResponse author) {
        this.author = author;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public UUID getParentCommentId() {
        return parentCommentId;
    }
    
    public void setParentCommentId(UUID parentCommentId) {
        this.parentCommentId = parentCommentId;
    }
    
    public boolean isEdited() {
        return isEdited;
    }
    
    public void setEdited(boolean edited) {
        isEdited = edited;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<CommentResponse> getReplies() {
        return replies;
    }
    
    public void setReplies(List<CommentResponse> replies) {
        this.replies = replies;
    }
    
    public int getReplyCount() {
        return replyCount;
    }
    
    public void setReplyCount(int replyCount) {
        this.replyCount = replyCount;
    }
    
    public List<String> getMentionedUsers() {
        return mentionedUsers;
    }
    
    public void setMentionedUsers(List<String> mentionedUsers) {
        this.mentionedUsers = mentionedUsers;
    }
    
    @Override
    public String toString() {
        return "CommentResponse{" +
                "id=" + id +
                ", taskId=" + taskId +
                ", author=" + (author != null ? author.getEmail() : null) +
                ", content='" + content + '\'' +
                ", isEdited=" + isEdited +
                ", replyCount=" + replyCount +
                ", createdAt=" + createdAt +
                '}';
    }
}