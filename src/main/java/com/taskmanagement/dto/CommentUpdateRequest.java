package com.taskmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for comment update requests
 */
public class CommentUpdateRequest {
    
    @NotBlank(message = "Comment content is required")
    @Size(min = 1, max = 2000, message = "Comment content must be between 1 and 2000 characters")
    private String content;
    
    // Default constructor
    public CommentUpdateRequest() {}
    
    // Constructor with required fields
    public CommentUpdateRequest(String content) {
        this.content = content;
    }
    
    // Getters and Setters
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    @Override
    public String toString() {
        return "CommentUpdateRequest{" +
                "content='" + content + '\'' +
                '}';
    }
}