package com.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * DTO for comment creation requests
 */
public class CommentCreateRequest {
    
    @NotBlank(message = "Comment content is required")
    @Size(min = 1, max = 2000, message = "Comment content must be between 1 and 2000 characters")
    private String content;
    
    private UUID parentCommentId;
    
    // Default constructor
    public CommentCreateRequest() {}
    
    // Constructor with required fields
    public CommentCreateRequest(String content) {
        this.content = content;
    }
    
    // Getters and Setters
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
    
    @Override
    public String toString() {
        return "CommentCreateRequest{" +
                "content='" + content + '\'' +
                ", parentCommentId=" + parentCommentId +
                '}';
    }
}